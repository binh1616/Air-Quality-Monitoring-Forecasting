// src/hooks/useDataFilter.js - Hook xử lý logic filter dữ liệu
import { useMemo } from 'react';
import { SENSOR_CONFIG } from '../utils/sensorConfig';
import { getValueColorAndStatus } from '../utils/thresholds';

export const useDataFilter = (rawData, filters) => {
  const filteredData = useMemo(() => {
    if (!rawData || !rawData.feeds || rawData.feeds.length === 0) {
      return {
        feeds: [],
        stats: {
          total: 0,
          filtered: 0,
          channels: [],
          timeRange: null
        }
      };
    }

    let feeds = [...rawData.feeds];
    const originalCount = feeds.length;

    // 1. Channel Filter
    if (filters.channels !== 'all' && Array.isArray(filters.channels) && filters.channels.length > 0) {
      feeds = feeds.filter(feed => filters.channels.includes(feed.channelId));
    }

    // 2. Time Range Filter
    const now = new Date();
    let timeFilterStart = null;
    let timeFilterEnd = null;

    switch (filters.timeRange) {
      case '1h':
        timeFilterStart = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '6h':
        timeFilterStart = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '24h':
        timeFilterStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        timeFilterStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        if (filters.customDateFrom) {
          timeFilterStart = new Date(filters.customDateFrom);
        }
        if (filters.customDateTo) {
          timeFilterEnd = new Date(filters.customDateTo);
        }
        break;
    }

    if (timeFilterStart || timeFilterEnd) {
      feeds = feeds.filter(feed => {
        const feedTime = new Date(feed.created_at);
        if (timeFilterStart && feedTime < timeFilterStart) return false;
        if (timeFilterEnd && feedTime > timeFilterEnd) return false;
        return true;
      });
    }

    // 3. Value Range Filter (áp dụng cho tất cả selected fields)
    if (filters.minValue !== '' || filters.maxValue !== '') {
      const minVal = filters.minValue !== '' ? parseFloat(filters.minValue) : -Infinity;
      const maxVal = filters.maxValue !== '' ? parseFloat(filters.maxValue) : Infinity;

      feeds = feeds.filter(feed => {
        const selectedFields = Object.keys(filters.selectedFields)
          .filter(key => filters.selectedFields[key]);
        
        return selectedFields.some(fieldKey => {
          const value = parseFloat(feed[fieldKey]) || 0;
          return value >= minVal && value <= maxVal;
        });
      });
    }

    // 4. Exclude Zeros Filter
    if (filters.excludeZeros) {
      feeds = feeds.filter(feed => {
        const selectedFields = Object.keys(filters.selectedFields)
          .filter(key => filters.selectedFields[key]);
        
        return selectedFields.some(fieldKey => {
          const value = parseFloat(feed[fieldKey]) || 0;
          return value > 0;
        });
      });
    }

    // 5. Anomalies Only Filter
    if (filters.onlyAnomalies) {
      feeds = feeds.filter(feed => {
        const selectedFields = Object.keys(filters.selectedFields)
          .filter(key => filters.selectedFields[key]);
        
        return selectedFields.some(fieldKey => {
          const config = SENSOR_CONFIG[fieldKey];
          const value = parseFloat(feed[fieldKey]) || 0;
          
          if (config && config.alertLevels) {
            return value >= config.alertLevels.caution;
          }
          
          // Fallback: sử dụng threshold system
          const { status } = getValueColorAndStatus(value, config?.threshold);
          return ['warning', 'danger', 'critical'].includes(status);
        });
      });
    }

    // 6. Sort by time (newest first) và apply data limit
    feeds = feeds
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, filters.dataLimit);

    // 7. Calculate stats
    const uniqueChannels = [...new Set(feeds.map(f => f.channelId))];
    const timeRange = feeds.length > 0 ? {
      start: new Date(Math.min(...feeds.map(f => new Date(f.created_at)))),
      end: new Date(Math.max(...feeds.map(f => new Date(f.created_at))))
    } : null;

    return {
      feeds,
      stats: {
        total: originalCount,
        filtered: feeds.length,
        channels: uniqueChannels,
        timeRange,
        filterApplied: originalCount !== feeds.length
      }
    };

  }, [rawData, filters]);

  // Create filtered chart data
  const chartData = useMemo(() => {
    if (!filteredData.feeds || filteredData.feeds.length === 0) return [];

    return filteredData.feeds.map((feed, index) => {
      const timeLabel = new Date(feed.created_at).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      });

      const dataPoint = { time: timeLabel, timestamp: feed.created_at };

      // Only include selected fields
      Object.keys(filters.selectedFields).forEach(fieldKey => {
        if (filters.selectedFields[fieldKey]) {
          dataPoint[fieldKey] = parseFloat(feed[fieldKey]) || 0;
        }
      });

      return dataPoint;
    });
  }, [filteredData.feeds, filters.selectedFields]);

  // Create sensor-specific data for heatmaps
  const getSensorData = (fieldKey) => {
    if (!filters.selectedFields[fieldKey]) return [];
    
    return filteredData.feeds.map(feed => parseFloat(feed[fieldKey]) || 0);
  };

  const getTimeLabels = () => {
    return filteredData.feeds.map(feed =>
      new Date(feed.created_at).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    );
  };

  // Generate alerts based on filtered data
  const generateAlerts = () => {
    if (!filteredData.feeds || filteredData.feeds.length === 0) return [];

    const latest = filteredData.feeds[0]; // Newest after sorting
    const alerts = [];

    Object.keys(filters.selectedFields).forEach(fieldKey => {
      if (!filters.selectedFields[fieldKey]) return;
      
      const config = SENSOR_CONFIG[fieldKey];
      const value = parseFloat(latest[fieldKey]);
      
      if (!isNaN(value) && value > 0 && config) {
        const { alertLevels } = config;
        
        if (alertLevels && value >= alertLevels.danger) {
          alerts.push({
            sensor: config.name,
            message: `Giá trị ${value.toFixed(2)}${config.unit} vượt ngưỡng nguy hiểm (>${alertLevels.danger})`,
            level: 'critical',
            timestamp: latest.created_at,
            channel: latest.channelId
          });
        } else if (alertLevels && value >= alertLevels.warning) {
          alerts.push({
            sensor: config.name,
            message: `Giá trị ${value.toFixed(2)}${config.unit} ở mức cảnh báo (${alertLevels.warning}-${alertLevels.danger})`,
            level: 'warning',
            timestamp: latest.created_at,
            channel: latest.channelId
          });
        } else if (alertLevels && value >= alertLevels.caution) {
          alerts.push({
            sensor: config.name,
            message: `Giá trị ${value.toFixed(2)}${config.unit} cần chú ý (${alertLevels.caution}-${alertLevels.warning})`,
            level: 'caution',
            timestamp: latest.created_at,
            channel: latest.channelId
          });
        }
      }
    });

    return alerts;
  };

  // Calculate statistics for selected fields
  const getFieldStatistics = () => {
    const stats = {};
    
    Object.keys(filters.selectedFields).forEach(fieldKey => {
      if (!filters.selectedFields[fieldKey]) return;
      
      const values = filteredData.feeds
        .map(feed => parseFloat(feed[fieldKey]) || 0)
        .filter(v => v > 0);
      
      if (values.length > 0) {
        const sorted = [...values].sort((a, b) => a - b);
        stats[fieldKey] = {
          count: values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          median: sorted[Math.floor(sorted.length / 2)],
          latest: values[0], // First in filtered data (newest)
          previous: values[1] || values[0]
        };
      }
    });
    
    return stats;
  };

  return {
    filteredData,
    chartData,
    getSensorData,
    getTimeLabels,
    generateAlerts,
    getFieldStatistics,
    isFiltered: filteredData.stats.filterApplied
  };
};

// Utility function to create available channels list from raw data
export const extractAvailableChannels = (rawData) => {
  if (!rawData || !rawData.feeds) return [];
  
  const channelMap = new Map();
  
  rawData.feeds.forEach(feed => {
    if (feed.channelId && !channelMap.has(feed.channelId)) {
      channelMap.set(feed.channelId, {
        id: feed.channelId,
        name: feed.channelName || `Channel ${feed.channelId}`,
        count: 0
      });
    }
    if (feed.channelId) {
      channelMap.get(feed.channelId).count++;
    }
  });
  
  return Array.from(channelMap.values()).sort((a, b) => a.id - b.id);
};

// Default filter state
export const DEFAULT_FILTERS = {
  channels: 'all',
  timeRange: '24h',
  customDateFrom: '',
  customDateTo: '',
  selectedFields: {
    field1: true,
    field2: true,
    field3: false,
    field4: true,
    field5: false,
    field6: false,
    field7: false,
    field8: true
  },
  dataLimit: 100,
  minValue: '',
  maxValue: '',
  onlyAnomalies: false,
  excludeZeros: true
};