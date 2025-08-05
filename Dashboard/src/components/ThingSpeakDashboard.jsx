// src/ThingSpeakDashboard.jsx - Dashboard tổng hợp KHÔNG có biểu đồ
import React, { useEffect, useState, useMemo } from 'react';
import { Activity, RefreshCw, AlertTriangle, Calendar, TrendingUp } from 'lucide-react';

// Import components  
import StatCard from './StatCard';
import SensorHeatmap from './SensorHeatmap';
import AlertPanel from './AlertPanel';
import HistoricalComparison from '../components/HistoricalComparison';
import TrendAnalysis from '../components/TrendAnalysis';
import ChannelSelector from './ChannelSelector';

// Import utilities và configs
import { SENSOR_CONFIG, API_ENDPOINTS } from '../utils/sensorConfig';
import { getValueColorAndStatus } from '../utils/thresholds';
import '../styles/dashboard.css';

const ThingSpeakDashboard = ({ onSelectChannel }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('heatmap'); // Chỉ còn: heatmap, historical, trend
  const [selectedSensor, setSelectedSensor] = useState('field1');
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const promises = API_ENDPOINTS.map(async ({ channel, apiKey }) => {
        try {
          const response = await fetch(
            `https://api.thingspeak.com/channels/${channel}/feeds.json?api_key=${apiKey}&results=1`
          );
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          
          return {
            channelId: channel,
            apiKey: apiKey,
            channelInfo: data.channel || {},
            latestFeed: data.feeds && data.feeds.length > 0 ? data.feeds[data.feeds.length - 1] : null,
            feeds: data.feeds || [],
            hasData: data.feeds && data.feeds.length > 0,
            error: null
          };
        } catch (error) {
          console.warn(`Failed to fetch data from channel ${channel}:`, error);
          return {
            channelId: channel,
            apiKey: apiKey,
            channelInfo: {},
            latestFeed: null,
            feeds: [],
            hasData: false,
            error: error.message
          };
        }
      });

      const channelResults = await Promise.all(promises);

      if (channelResults.length === 0) {
        setError('Không thể tải dữ liệu từ bất kỳ ThingSpeak channel nào');
        return;
      }

      // Create 25 feeds array - mỗi vị trí tương ứng với 1 kênh
      const heatmapFeeds = channelResults.map((channelResult, index) => {
        if (channelResult.latestFeed) {
          return {
            ...channelResult.latestFeed,
            channelId: channelResult.channelId,
            channelApiKey: channelResult.apiKey,
            channelName: channelResult.channelInfo?.name || `Channel ${channelResult.channelId}`,
            hasData: true
          };
        } else {
          // Tạo placeholder cho kênh không có data
          return {
            entry_id: `no-data-${channelResult.channelId}`,
            created_at: new Date().toISOString(),
            field1: null,
            field2: null,
            field3: null,
            field4: null,
            field5: null,
            field6: null,
            field7: null,
            field8: null,
            channelId: channelResult.channelId,
            channelApiKey: channelResult.apiKey,
            channelName: channelResult.channelInfo?.name || `Channel ${channelResult.channelId}`,
            hasData: false,
            error: channelResult.error
          };
        }
      });

      const combinedData = {
        channel: {
          id: 'combined',
          name: 'Bản đồ nhiệt từng kênh riêng biệt',
          description: `25 ô tương ứng 25 kênh API`
        },
        feeds: heatmapFeeds, // 25 phần tử, mỗi phần tử = 1 kênh
        channelList: channelResults,
        stats: {
          totalChannels: channelResults.length,
          channelsWithData: channelResults.filter(c => c.hasData).length,
          channelsWithoutData: channelResults.filter(c => !c.hasData).length
        }
      };

      setData(combinedData);
      setLastUpdate(new Date());

    } catch (err) {
      setError('Lỗi không mong muốn khi tải dữ liệu từ ThingSpeak API');
      console.error('Unexpected API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const analysis = useMemo(() => {
    if (!data || !data.feeds || data.feeds.length === 0) return null;

    const alerts = [];

    // Chỉ check alert từ các kênh có data
    data.feeds.forEach(feed => {
      if (!feed.hasData) return; // Skip kênh không có data
      
      Object.keys(SENSOR_CONFIG).forEach(fieldKey => {
        const config = SENSOR_CONFIG[fieldKey];
        const value = parseFloat(feed[fieldKey]);
        
        if (!isNaN(value) && value > 0) {
          const { alertLevels } = config;
          
          if (alertLevels && value >= alertLevels.danger) {
            alerts.push({
              sensor: config.name,
              message: `Kênh ${feed.channelId}: ${value.toFixed(2)}${config.unit} vượt ngưỡng nguy hiểm (>${alertLevels.danger})`,
              level: 'critical',
              timestamp: feed.created_at
            });
          } else if (alertLevels && value >= alertLevels.warning) {
            alerts.push({
              sensor: config.name,
              message: `Kênh ${feed.channelId}: ${value.toFixed(2)}${config.unit} ở mức cảnh báo (${alertLevels.warning}-${alertLevels.danger})`,
              level: 'warning',
              timestamp: feed.created_at
            });
          } else if (alertLevels && value >= alertLevels.caution) {
            alerts.push({
              sensor: config.name,
              message: `Kênh ${feed.channelId}: ${value.toFixed(2)}${config.unit} cần chú ý (${alertLevels.caution}-${alertLevels.warning})`,
              level: 'caution',
              timestamp: feed.created_at
            });
          }
        }
      });
    });

    return { alerts };
  }, [data]);

  // Handle channel click
  const handleChannelClick = (channelInfo) => {
    if (onSelectChannel) {
      onSelectChannel(channelInfo);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Activity size={32} className="loading-spinner" />
        <p>Đang tải dữ liệu từ ThingSpeak...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <AlertTriangle size={32} />
        <p>{error}</p>
        <button onClick={fetchData} className="control-btn">
          Thử lại
        </button>
      </div>
    );
  }

  if (!data || !data.feeds || data.feeds.length === 0) {
    return (
      <div className="no-data-container">
        <p>Không có dữ liệu để hiển thị</p>
        <button onClick={fetchData} className="control-btn">Tải lại</button>
      </div>
    );
  }

  const timeLabels = data.feeds.map(f =>
    new Date(f.created_at).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  );

  const latest = data.feeds[0];
  const previous = data.feeds.length > 1 ? data.feeds[1] : null;

  const calculateTrend = (current, previous) => {
    if (!previous || parseFloat(previous) === 0) return 0;
    return ((parseFloat(current) - parseFloat(previous)) / parseFloat(previous)) * 100;
  };

  const stats = Object.keys(SENSOR_CONFIG).map(fieldKey => {
    const config = SENSOR_CONFIG[fieldKey];
    
    // Lấy dữ liệu từ các kênh có data
    const feedsWithData = data.feeds.filter(feed => feed.hasData && feed[fieldKey] !== null);
    
    if (feedsWithData.length === 0) {
      return null; // Không có data cho sensor này
    }
    
    const currentValue = parseFloat(feedsWithData[feedsWithData.length - 1][fieldKey] || 0);
    const previousValue = feedsWithData.length > 1 ? 
      parseFloat(feedsWithData[feedsWithData.length - 2][fieldKey] || 0) : 0;
    
    const trend = calculateTrend(currentValue, previousValue);
    const { status } = getValueColorAndStatus(currentValue, config.threshold);

    return {
      title: config.name,
      value: currentValue.toFixed(fieldKey === 'field4' ? 2 : 1),
      unit: config.unit,
      trend,
      status,
      icon: config.icon,
      thresholdType: config.threshold
    };
  }).filter(stat => stat !== null);

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            🗺️ ThingSpeak Dashboard tổng hợp
          </h1>
          
          <div className="dashboard-controls">
            <button
              onClick={() => setViewMode('heatmap')}
              className={`control-btn ${viewMode === 'heatmap' ? 'active' : ''}`}
            >
              🗺️ Bản đồ nhiệt
            </button>
            
            <button
              onClick={() => setViewMode('historical')}
              className={`control-btn ${viewMode === 'historical' ? 'active' : ''}`}
            >
              <Calendar size={16} />
              So sánh lịch sử
            </button>
            <button
              onClick={() => setViewMode('trend')}
              className={`control-btn ${viewMode === 'trend' ? 'active' : ''}`}
            >
              <TrendingUp size={16} />
              Xu hướng
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="control-btn refresh"
            >
              <RefreshCw size={16} className={loading ? 'loading-spinner' : ''} />
              Làm mới
            </button>
            
            {/* Channel Selector - Góc phải */}
            <ChannelSelector 
              channels={data?.channelList || []}
              onSelectChannel={handleChannelClick}
            />
          </div>
        </div>

        {/* Alerts */}
        {analysis && analysis.alerts.length > 0 && (
          <AlertPanel alerts={analysis.alerts} />
        )}

        {/* Stats Grid */}
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Main Content */}
        {viewMode === 'heatmap' && (
          <div>
            {/* Sensor Tabs */}
            <div className="sensor-tabs">
              {Object.keys(SENSOR_CONFIG).map(fieldKey => {
                const config = SENSOR_CONFIG[fieldKey];
                const hasData = data.feeds.some(f => f[fieldKey] && parseFloat(f[fieldKey]) > 0);
                
                return (
                  <button
                    key={fieldKey}
                    onClick={() => setSelectedSensor(fieldKey)}
                    className={`sensor-tab ${selectedSensor === fieldKey ? 'active' : ''}`}
                    style={{
                      display: hasData ? 'flex' : 'none'
                    }}
                  >
                    {config.emoji} {config.name}
                  </button>
                );
              })}
            </div>

            {/* Selected Sensor Heatmap */}
            <SensorHeatmap
              title={`${SENSOR_CONFIG[selectedSensor].name} - Mỗi ô = 1 kênh riêng biệt`}
              data={data.feeds.map(f => ({
                value: f[selectedSensor],
                hasData: f.hasData,
                channelId: f.channelId,
                error: f.error,
                time: new Date(f.created_at).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })
              }))}
              timeLabels={timeLabels}
              unit={SENSOR_CONFIG[selectedSensor].unit}
              thresholdType={SENSOR_CONFIG[selectedSensor].threshold}
            />
            
            {/* Thông báo hướng dẫn */}
            <div style={{
              marginTop: '20px',
              padding: '16px',
              backgroundColor: '#eff6ff',
              borderRadius: '12px',
              border: '1px solid #bae6fd',
              fontSize: '0.9rem',
              color: '#0c4a6e'
            }}>
              💡 <strong>Xem biểu đồ xu hướng:</strong> Click vào dropdown "Kênh" ở góc phải và chọn kênh cụ thể để xem biểu đồ chi tiết theo thời gian của kênh đó.
            </div>
          </div>
        )}

        {viewMode === 'historical' && (
          <div>
            <HistoricalComparison currentData={data} />
          </div>
        )}

        {viewMode === 'trend' && (
          <div>
            <TrendAnalysis />
          </div>
        )}

        {/* Footer */}
        <div className="footer">
          📊 {data.stats?.totalChannels || 0} kênh ThingSpeak • 
          ✅ {data.stats?.channelsWithData || 0} có data • 
          ❌ {data.stats?.channelsWithoutData || 0} không data | 
          🕒 Cập nhật lần cuối: {lastUpdate?.toLocaleString('vi-VN') || 'Chưa rõ'} | 
          🔄 Tự động làm mới mỗi 30 giây
          {viewMode === 'historical' && (
            <span> | 📅 So sánh với dữ liệu lịch sử</span>
          )}
          {viewMode === 'trend' && (
            <span> | 📈 Phân tích xu hướng nhiều ngày</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThingSpeakDashboard;