// apiService.js - Service để fetch dữ liệu từ ThingSpeak API
import { API_ENDPOINTS } from './utils/sensorConfig.js';

class ThingSpeakService {
  constructor() {
    this.baseUrl = 'https://api.thingspeak.com/channels';
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds
  }

  // Fetch data từ một channel
  async fetchChannelData(channel, apiKey, results = 2) {
    const cacheKey = `${channel}-${results}`;
    const cached = this.cache.get(cacheKey);
    
    // Kiểm tra cache
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const url = `${this.baseUrl}/${channel}/feeds.json?api_key=${apiKey}&results=${results}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} for channel ${channel}`);
      }
      
      const data = await response.json();
      const result = {
        channel: channel,
        ...data
      };

      // Cache kết quả
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.warn(`Failed to fetch data from channel ${channel}:`, error);
      return null;
    }
  }

  // Fetch data từ tất cả channels
  async fetchAllChannelsData(results = 25) {
    try {
      // Tạo promises cho tất cả các API calls
      const promises = API_ENDPOINTS.map(({ channel, apiKey }) =>
        this.fetchChannelData(channel, apiKey, Math.ceil(results / API_ENDPOINTS.length + 2))
      );

      // Chờ tất cả promises hoàn thành
      const results_data = await Promise.all(promises);

      // Lọc bỏ các kết quả null (từ các API calls bị lỗi)
      const validResults = results_data.filter(result => result !== null);

      if (validResults.length === 0) {
        throw new Error('Không thể tải dữ liệu từ bất kỳ ThingSpeak channel nào');
      }

      // Gộp tất cả feeds từ các channels
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

      // Sắp xếp theo thời gian (mới nhất trước)
      const sortedFeeds = allFeeds.sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
      );

      // Lấy số lượng feeds theo yêu cầu
      const recentFeeds = sortedFeeds.slice(0, results);

      if (recentFeeds.length === 0) {
        throw new Error('Không có dữ liệu feeds từ các ThingSpeak channels');
      }

      // Tạo structure tổng hợp
      const combinedData = {
        channel: {
          id: 'combined',
          name: 'Bản đồ nhiệt tổng hợp',
          description: `Data from ${validResults.length} channels`,
          field1: 'Nhiệt độ',
          field2: 'Độ ẩm',
          field3: 'MQ7 Raw',
          field4: 'CO (ppm)',
          field5: 'MQ2 Raw',
          field6: 'LPG',
          field7: 'Smoke',
          field8: 'Dust Sensor',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        feeds: recentFeeds,
        stats: {
          totalChannels: validResults.length,
          totalFeeds: allFeeds.length,
          recentFeeds: recentFeeds.length,
          successRate: ((validResults.length / API_ENDPOINTS.length) * 100).toFixed(1)
        }
      };

      // Log thông tin debug
      console.log(`✅ Successfully fetched data from ${validResults.length}/${API_ENDPOINTS.length} channels`);
      console.log(`📊 Total feeds: ${allFeeds.length}, Recent feeds: ${recentFeeds.length}`);

      return combinedData;

    } catch (error) {
      console.error('Unexpected API Error:', error);
      throw error;
    }
  }

  // Fetch dữ liệu realtime (polling)
  async startRealTimePolling(callback, interval = 30000) {
    const poll = async () => {
      try {
        const data = await this.fetchAllChannelsData();
        callback(data, null);
      } catch (error) {
        callback(null, error);
      }
    };

    // Initial fetch
    await poll();

    // Set up interval
    const intervalId = setInterval(poll, interval);
    
    return () => clearInterval(intervalId);
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }

  // Validate feeds data
  validateFeedsData(feeds) {
    if (!feeds || !Array.isArray(feeds)) return false;
    
    return feeds.every(feed => 
      feed.created_at && 
      typeof feed === 'object' &&
      Object.keys(feed).some(key => key.startsWith('field') && feed[key] !== null)
    );
  }

  // Get data quality metrics
  getDataQuality(feeds) {
    if (!feeds || feeds.length === 0) return null;

    const metrics = {
      totalRecords: feeds.length,
      validRecords: 0,
      fieldCoverage: {},
      timeRange: {
        start: null,
        end: null
      },
      avgRecordsPerChannel: 0
    };

    // Analyze field coverage
    const fieldCounts = {};
    feeds.forEach(feed => {
      let hasValidData = false;
      
      for (let i = 1; i <= 8; i++) {
        const fieldKey = `field${i}`;
        const value = feed[fieldKey];
        
        if (value !== null && value !== undefined && value !== '') {
          fieldCounts[fieldKey] = (fieldCounts[fieldKey] || 0) + 1;
          hasValidData = true;
        }
      }
      
      if (hasValidData) metrics.validRecords++;
    });

    // Calculate field coverage percentages
    Object.keys(fieldCounts).forEach(field => {
      metrics.fieldCoverage[field] = ((fieldCounts[field] / feeds.length) * 100).toFixed(1);
    });

    // Time range
    const timestamps = feeds.map(f => new Date(f.created_at)).sort((a, b) => a - b);
    metrics.timeRange.start = timestamps[0];
    metrics.timeRange.end = timestamps[timestamps.length - 1];

    return metrics;
  }
}

// Export singleton instance
export const thingSpeakService = new ThingSpeakService();
export default thingSpeakService;