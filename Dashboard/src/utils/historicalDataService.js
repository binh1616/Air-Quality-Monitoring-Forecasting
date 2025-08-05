// src/historicalDataService.js - Service cho dữ liệu lịch sử
import { API_ENDPOINTS } from './sensorConfig.js';

class HistoricalDataService {
  constructor() {
    this.baseUrl = 'https://api.thingspeak.com/channels';
    this.historicalCache = new Map();
    this.cacheTimeout = 300000; // 5 minutes for historical data
  }

  // Fetch dữ liệu theo ngày cụ thể
  async fetchDataForDate(targetDate, results = 100) {
    const dateKey = targetDate.toISOString().split('T')[0];
    const cacheKey = `historical-${dateKey}-${results}`;
    
    // Kiểm tra cache
    const cached = this.historicalCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Tính toán start và end time cho ngày cụ thể
      const startDate = new Date(targetDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(targetDate);
      endDate.setHours(23, 59, 59, 999);

      const promises = API_ENDPOINTS.map(({ channel, apiKey }) =>
        this.fetchChannelDataForDateRange(channel, apiKey, startDate, endDate, results)
      );

      const results_data = await Promise.all(promises);
      const validResults = results_data.filter(result => result !== null);

      if (validResults.length === 0) {
        throw new Error(`Không có dữ liệu cho ngày ${dateKey}`);
      }

      // Gộp và sort data
      const allFeeds = validResults.flatMap(result => {
        if (result.feeds && result.feeds.length > 0) {
          return result.feeds.map(feed => ({
            ...feed,
            channelId: result.channel,
            channelName: result.channel?.name || `Channel ${result.channel}`
          }));
        }
        return [];
      });

      const sortedFeeds = allFeeds.sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
      );

      const historicalData = {
        date: dateKey,
        channel: {
          id: 'combined-historical',
          name: `Dữ liệu lịch sử ${dateKey}`,
          description: `Historical data from ${validResults.length} channels`,
          field1: 'Nhiệt độ',
          field2: 'Độ ẩm',
          field3: 'MQ7 Raw',
          field4: 'CO (ppm)',
          field5: 'MQ2 Raw',
          field6: 'LPG',
          field7: 'Smoke',
          field8: 'Dust Sensor'
        },
        feeds: sortedFeeds,
        stats: {
          totalChannels: validResults.length,
          totalFeeds: allFeeds.length,
          date: dateKey
        }
      };

      // Cache kết quả
      this.historicalCache.set(cacheKey, {
        data: historicalData,
        timestamp: Date.now()
      });

      return historicalData;

    } catch (error) {
      console.error(`Error fetching historical data for ${dateKey}:`, error);
      throw error;
    }
  }

  // Fetch dữ liệu từ channel trong khoảng thời gian
  async fetchChannelDataForDateRange(channel, apiKey, startDate, endDate, results) {
    try {
      // ThingSpeak API sử dụng ISO format cho start/end
      const startISO = startDate.toISOString();
      const endISO = endDate.toISOString();
      
      const url = `${this.baseUrl}/${channel}/feeds.json?api_key=${apiKey}&start=${startISO}&end=${endISO}&results=${results}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} for channel ${channel}`);
      }
      
      const data = await response.json();
      return {
        channel: channel,
        ...data
      };
    } catch (error) {
      console.warn(`Failed to fetch historical data from channel ${channel}:`, error);
      return null;
    }
  }

  // So sánh dữ liệu 2 ngày
  async compareWithPreviousDay(currentData, daysBack = 1) {
    try {
      const today = new Date();
      const compareDate = new Date(today);
      compareDate.setDate(today.getDate() - daysBack);

      const historicalData = await this.fetchDataForDate(compareDate);
      
      return this.generateComparison(currentData, historicalData, daysBack);
    } catch (error) {
      console.error('Error comparing with previous day:', error);
      return null;
    }
  }

  // Tạo dữ liệu so sánh
  generateComparison(currentData, historicalData, daysBack) {
    if (!currentData?.feeds || !historicalData?.feeds) {
      return null;
    }

    const comparison = {
      current: {
        date: 'Hôm nay',
        data: currentData
      },
      historical: {
        date: `${daysBack} ngày trước`,
        data: historicalData
      },
      metrics: {}
    };

    // So sánh từng field
    Object.keys(currentData.channel).forEach(fieldKey => {
      if (fieldKey.startsWith('field')) {
        const currentValues = currentData.feeds
          .map(f => parseFloat(f[fieldKey]))
          .filter(v => !isNaN(v) && v > 0);
        
        const historicalValues = historicalData.feeds
          .map(f => parseFloat(f[fieldKey]))
          .filter(v => !isNaN(v) && v > 0);

        if (currentValues.length > 0 && historicalValues.length > 0) {
          const currentAvg = currentValues.reduce((a, b) => a + b, 0) / currentValues.length;
          const historicalAvg = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length;
          
          const change = currentAvg - historicalAvg;
          const changePercent = historicalAvg > 0 ? (change / historicalAvg) * 100 : 0;

          comparison.metrics[fieldKey] = {
            name: currentData.channel[fieldKey],
            current: {
              avg: currentAvg,
              min: Math.min(...currentValues),
              max: Math.max(...currentValues),
              count: currentValues.length
            },
            historical: {
              avg: historicalAvg,
              min: Math.min(...historicalValues),
              max: Math.max(...historicalValues),
              count: historicalValues.length
            },
            change: {
              absolute: change,
              percent: changePercent,
              trend: changePercent > 0 ? 'increase' : changePercent < 0 ? 'decrease' : 'stable'
            }
          };
        }
      }
    });

    return comparison;
  }

  // Fetch trend data cho nhiều ngày
  async fetchTrendData(days = 7) {
    try {
      const trendData = [];
      const today = new Date();

      for (let i = 0; i < days; i++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() - i);
        
        try {
          const dayData = await this.fetchDataForDate(targetDate, 50);
          const dayMetrics = this.calculateDayMetrics(dayData);
          
          trendData.push({
            date: targetDate.toISOString().split('T')[0],
            dateLabel: targetDate.toLocaleDateString('vi-VN'),
            metrics: dayMetrics,
            dataCount: dayData.feeds.length
          });
        } catch (error) {
          console.warn(`No data for ${targetDate.toISOString().split('T')[0]}`);
          // Thêm entry trống cho ngày không có data
          trendData.push({
            date: targetDate.toISOString().split('T')[0],
            dateLabel: targetDate.toLocaleDateString('vi-VN'),
            metrics: {},
            dataCount: 0
          });
        }
      }

      return trendData.reverse(); // Oldest to newest
    } catch (error) {
      console.error('Error fetching trend data:', error);
      throw error;
    }
  }

  // Tính metrics cho một ngày
  calculateDayMetrics(dayData) {
    if (!dayData?.feeds) return {};

    const metrics = {};

    Object.keys(dayData.channel).forEach(fieldKey => {
      if (fieldKey.startsWith('field')) {
        const values = dayData.feeds
          .map(f => parseFloat(f[fieldKey]))
          .filter(v => !isNaN(v) && v > 0);

        if (values.length > 0) {
          metrics[fieldKey] = {
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            count: values.length,
            stdDev: this.calculateStandardDeviation(values)
          };
        }
      }
    });

    return metrics;
  }

  // Tính standard deviation
  calculateStandardDeviation(values) {
    if (values.length === 0) return 0;
    
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDifferences = values.map(value => Math.pow(value - avg, 2));
    const avgSquaredDifference = squaredDifferences.reduce((a, b) => a + b, 0) / values.length;
    
    return Math.sqrt(avgSquaredDifference);
  }

  // Detect anomalies dựa trên historical data
  detectAnomalies(currentData, historicalData, threshold = 2) {
    const anomalies = [];

    if (!currentData?.feeds || !historicalData?.feeds) {
      return anomalies;
    }

    Object.keys(currentData.channel).forEach(fieldKey => {
      if (fieldKey.startsWith('field')) {
        const currentValues = currentData.feeds
          .map(f => parseFloat(f[fieldKey]))
          .filter(v => !isNaN(v) && v > 0);
        
        const historicalValues = historicalData.feeds
          .map(f => parseFloat(f[fieldKey]))
          .filter(v => !isNaN(v) && v > 0);

        if (currentValues.length > 0 && historicalValues.length > 0) {
          const historicalAvg = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length;
          const historicalStdDev = this.calculateStandardDeviation(historicalValues);

          currentValues.forEach(value => {
            const zScore = historicalStdDev > 0 ? Math.abs(value - historicalAvg) / historicalStdDev : 0;
            
            if (zScore > threshold) {
              anomalies.push({
                field: fieldKey,
                fieldName: currentData.channel[fieldKey],
                value: value,
                expected: historicalAvg,
                zScore: zScore,
                severity: zScore > 3 ? 'high' : zScore > 2.5 ? 'medium' : 'low'
              });
            }
          });
        }
      }
    });

    return anomalies;
  }

  // Clear cache
  clearHistoricalCache() {
    this.historicalCache.clear();
  }

  // Get cache stats
  getHistoricalCacheStats() {
    return {
      size: this.historicalCache.size,
      entries: Array.from(this.historicalCache.keys())
    };
  }
}

// Export singleton instance
export const historicalDataService = new HistoricalDataService();
export default historicalDataService;