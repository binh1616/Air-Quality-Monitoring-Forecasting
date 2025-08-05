// dataService.js - Service để fetch dữ liệu từ ThingSpeak API
import { API_ENDPOINTS } from './utils/sensorConfig.js';

export class ThingSpeakDataService {
  constructor() {
    this.baseUrl = 'https://api.thingspeak.com/channels';
    this.defaultResults = 25; // Số lượng records mặc định
  }

  // Fetch dữ liệu từ một channel
  async fetchChannelData(channel, apiKey, results = this.defaultResults) {
    try {
      const url = `${this.baseUrl}/${channel}/feeds.json?api_key=${apiKey}&results=${results}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} for channel ${channel}`);
      }
      
      const data = await response.json();
      return {
        channel: channel,
        success: true,
        ...data
      };
    } catch (error) {
      console.warn(`Failed to fetch data from channel ${channel}:`, error);
      return {
        channel: channel,
        success: false,
        error: error.message
      };
    }
  }

  // Fetch dữ liệu từ tất cả channels
  async fetchAllChannelsData(results = this.defaultResults) {
    try {
      // Tạo promises cho tất cả API calls
      const promises = API_ENDPOINTS.map(({ channel, apiKey }) =>
        this.fetchChannelData(channel, apiKey, results)
      );

      // Chờ tất cả promises hoàn thành
      const results = await Promise.all(promises);

      // Lọc các kết quả thành công
      const validResults = results.filter(result => result.success && result.feeds);
      
      if (validResults.length === 0) {
        throw new Error('Không thể tải dữ liệu từ bất kỳ ThingSpeak channel nào');
      }

      return this.combineChannelData(validResults);
    } catch (error) {
      console.error('Error fetching all channels data:', error);
      throw error;
    }
  }

  // Gộp dữ liệu từ nhiều channels
  combineChannelData(validResults) {
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

    // Lấy feeds gần nhất
    const recentFeeds = sortedFeeds.slice(0, this.defaultResults);

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
      metadata: {
        totalChannels: API_ENDPOINTS.length,
        successfulChannels: validResults.length,
        totalFeeds: allFeeds.length,
        recentFeeds: recentFeeds.length,
        lastUpdate: new Date().toISOString()
      }
    };

    console.log(`Successfully fetched data from ${validResults.length} out of ${API_ENDPOINTS.length} channels`);
    console.log(`Total feeds: ${allFeeds.length}, Recent feeds: ${recentFeeds.length}`);

    return combinedData;
  }

  // Lấy dữ liệu cho biểu đồ
  formatChartData(feeds) {
    return feeds.map((feed, index) => {
      const timeLabel = new Date(feed.created_at).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      });

      return {
        time: timeLabel,
        index: index,
        timestamp: feed.created_at,
        temp: parseFloat(feed.field1) || 0,
        humidity: parseFloat(feed.field2) || 0,
        mq7Raw: parseFloat(feed.field3) || 0,
        mq7CO: parseFloat(feed.field4) || 0,
        mq2Raw: parseFloat(feed.field5) || 0,
        lpg: parseFloat(feed.field6) || 0,
        smoke: parseFloat(feed.field7) || 0,
        dust: parseFloat(feed.field8) || 0
      };
    });
  }

  // Tạo time labels
  createTimeLabels(feeds) {
    return feeds.map(feed =>
      new Date(feed.created_at).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    );
  }

  // Tính toán trend
  calculateTrend(current, previous) {
    if (!previous || parseFloat(previous) === 0) return 0;
    return ((parseFloat(current) - parseFloat(previous)) / parseFloat(previous)) * 100;
  }

  // Tạo thống kê cho sensors
  generateSensorStats(feeds, sensorConfigs) {
    if (!feeds || feeds.length === 0) return [];

    const latest = feeds[feeds.length - 1];
    const previous = feeds.length > 1 ? feeds[feeds.length - 2] : null;

    return Object.entries(sensorConfigs).map(([fieldName, config]) => {
      const currentValue = parseFloat(latest[fieldName] || 0);
      const previousValue = previous ? parseFloat(previous[fieldName] || 0) : 0;
      const trend = this.calculateTrend(currentValue, previousValue);

      // Xác định status dựa trên alertLevels
      let status = 'normal';
      if (currentValue >= config.alertLevels.danger) {
        status = 'danger';
      } else if (currentValue >= config.alertLevels.warning) {
        status = 'warning';
      } else if (currentValue >= config.alertLevels.caution) {
        status = 'caution';
      }

      return {
        fieldName,
        title: config.name,
        value: currentValue.toFixed(config.unit === ' ppm' ? 2 : 1),
        unit: config.unit,
        trend,
        status,
        icon: config.icon,
        thresholdType: config.threshold,
        isValid: !isNaN(currentValue) && currentValue > 0
      };
    }).filter(stat => stat.isValid);
  }

  // Tạo alerts
  generateAlerts(feeds, sensorConfigs) {
    if (!feeds || feeds.length === 0) return [];

    const latest = feeds[feeds.length - 1];
    const alerts = [];

    Object.entries(sensorConfigs).forEach(([fieldName, config]) => {
      const value = parseFloat(latest[fieldName] || 0);
      
      if (!isNaN(value) && value > 0) {
        const { alertLevels } = config;
        
        if (value >= alertLevels.danger) {
          alerts.push({
            sensor: config.name,
            fieldName,
            value,
            message: `Giá trị ${value.toFixed(2)}${config.unit} vượt ngưỡng nguy hiểm (>${alertLevels.danger})`,
            severity: 'critical',
            timestamp: latest.created_at
          });
        } else if (value >= alertLevels.warning) {
          alerts.push({
            sensor: config.name,
            fieldName,
            value,
            message: `Giá trị ${value.toFixed(2)}${config.unit} ở mức cảnh báo (${alertLevels.warning}-${alertLevels.danger})`,
            severity: 'warning',
            timestamp: latest.created_at
          });
        } else if (value >= alertLevels.caution) {
          alerts.push({
            sensor: config.name,
            fieldName,
            value,
            message: `Giá trị ${value.toFixed(2)}${config.unit} cần chú ý (${alertLevels.caution}-${alertLevels.warning})`,
            severity: 'caution',
            timestamp: latest.created_at
          });
        }
      }
    });

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 3, warning: 2, caution: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }
}

// Export singleton instance
export const dataService = new ThingSpeakDataService();