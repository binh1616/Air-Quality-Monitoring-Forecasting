// MultiSensorChartView.jsx - Separate optimized charts for each sensor
import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, Cell
} from 'recharts';
import { Thermometer, Droplets, AlertTriangle, Wind, TrendingUp, BarChart3, Activity } from 'lucide-react';

// ===== SENSOR SPECIFIC CONFIGURATIONS =====
const SENSOR_CHART_CONFIGS = {
  // 1. Nhiệt độ (field1) - Continuous (°C)
  temp: {
    name: 'Nhiệt độ',
    unit: '°C',
    icon: Thermometer,
    emoji: '🌡️',
    color: '#dc2626',
    dataKey: 'temp',
    fieldKey: 'field1',
    description: 'Dữ liệu liên tục - Biến thiên theo thời gian',
    charts: [
      {
        type: 'line',
        name: 'Line Chart',
        emoji: '📈',
        description: 'Tốt nhất - Hiển thị xu hướng biến thiên nhiệt độ theo thời gian',
        primary: true
      },
      {
        type: 'area',
        name: 'Area Chart', 
        emoji: '📊',
        description: 'Thay thế - Hiển thị vùng nhiệt độ, dễ thấy biên độ thay đổi'
      }
    ],
    thresholds: {
      optimal: [20, 25],
      warning: [30, 35], 
      danger: [40, -5]
    }
  },

  // 2. Độ ẩm (field2) - Continuous (%)
  humidity: {
    name: 'Độ ẩm',
    unit: '%',
    icon: Droplets,
    emoji: '💧',
    color: '#2563eb',
    dataKey: 'humidity',
    fieldKey: 'field2',
    description: 'Dữ liệu phần trăm - Vùng bao phủ độ ẩm',
    charts: [
      {
        type: 'area',
        name: 'Area Chart',
        emoji: '📊',
        description: 'Tốt nhất - Thể hiện vùng bao phủ % độ ẩm theo thời gian',
        primary: true
      },
      {
        type: 'line',
        name: 'Line Chart',
        emoji: '📈', 
        description: 'Thay thế - Quan sát xu hướng độ ẩm đơn giản'
      }
    ],
    thresholds: {
      optimal: [40, 60],
      warning: [70, 30],
      danger: [80, 20]
    }
  },

  // 3. CO (field4) - Concentration (ppm)
  mq7CO: {
    name: 'CO (Carbon Monoxide)',
    unit: 'ppm',
    icon: AlertTriangle,
    emoji: '⚠️',
    color: '#ea580c',
    dataKey: 'mq7CO',
    fieldKey: 'field4',
    description: 'Nồng độ khí độc - Cần theo dõi liên tục',
    charts: [
      {
        type: 'line',
        name: 'Line Chart',
        emoji: '📈',
        description: 'Tốt nhất - Phát hiện nhanh xu hướng tăng CO nguy hiểm',
        primary: true
      },
      {
        type: 'bar',
        name: 'Bar Chart',
        emoji: '📊',
        description: 'Phân tích - So sánh mức CO theo từng thời điểm cụ thể'
      }
    ],
    thresholds: {
      optimal: [0, 10],
      warning: [30, 50],
      danger: [100, 200]
    }
  },

  // 4. Dust Sensor (field8) - Pollution (μg/m³)
  dust: {
    name: 'Bụi mịn (PM)',
    unit: 'μg/m³',
    icon: Wind,
    emoji: '🌪️',
    color: '#16a34a',
    dataKey: 'dust',
    fieldKey: 'field8',
    description: 'Chỉ số ô nhiễm - Xu hướng chất lượng không khí',
    charts: [
      {
        type: 'line',
        name: 'Line Chart',
        emoji: '📈',
        description: 'Tốt nhất - Theo dõi xu hướng ô nhiễm không khí',
        primary: true
      },
      {
        type: 'bar',
        name: 'Bar Chart',
        emoji: '📊',
        description: 'Phân tích - So sánh mức bụi theo giờ/khu vực'
      }
    ],
    thresholds: {
      optimal: [0, 12],
      warning: [35, 55],
      danger: [150, 250]
    }
  }
};

// Individual Sensor Chart Component
const SensorChart = ({ sensorConfig, data, selectedChartType, onChartTypeChange, height = 300 }) => {
  const IconComponent = sensorConfig.icon;
  
  // Filter and prepare data for this sensor
  const sensorData = useMemo(() => {
    return data.filter(item => 
      item[sensorConfig.dataKey] !== undefined && 
      item[sensorConfig.dataKey] !== null &&
      item[sensorConfig.dataKey] > 0
    ).map(item => ({
      ...item,
      value: parseFloat(item[sensorConfig.dataKey]) || 0
    }));
  }, [data, sensorConfig.dataKey]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!sensorData.length) return { min: 0, max: 0, avg: 0, latest: 0 };
    
    const values = sensorData.map(item => item.value);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      latest: values[values.length - 1] || 0
    };
  }, [sensorData]);

  // Enhanced tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !Array.isArray(payload) || payload.length === 0) {
      return null;
    }

    const entry = payload[0];
    return (
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        padding: '12px 16px',
        border: '2px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
      }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#1f2937' }}>
          🕐 {label}
        </p>
        <div style={{
          color: sensorConfig.color,
          fontSize: '1.1rem',
          fontWeight: '700',
          borderLeft: `4px solid ${sensorConfig.color}`,
          paddingLeft: '8px'
        }}>
          {sensorConfig.emoji} {sensorConfig.name}: {entry.value?.toFixed(2)} {sensorConfig.unit}
        </div>
      </div>
    );
  };

  // Render chart based on type
  const renderChart = () => {
    if (!sensorData.length) {
      return (
        <div style={{
          width: '100%',
          height: height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7280',
          backgroundColor: '#f9fafb',
          border: '2px dashed #d1d5db',
          borderRadius: '8px'
        }}>
          <IconComponent size={40} color="#6b7280" />
          <div style={{ marginTop: '12px', fontSize: '1rem' }}>
            Không có dữ liệu {sensorConfig.name}
          </div>
        </div>
      );
    }

    const commonProps = {
      data: sensorData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    };

    const commonElements = [
      <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#f0f0f0" />,
      <XAxis 
        key="xaxis"
        dataKey="time" 
        stroke="#6b7280"
        fontSize={11}
        tickFormatter={(value) => value?.length > 8 ? value.substring(0, 5) : value}
      />,
      <YAxis key="yaxis" stroke="#6b7280" fontSize={11} />,
      <Tooltip key="tooltip" content={<CustomTooltip />} />,
      <Legend key="legend" />
    ];

    switch (selectedChartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {commonElements}
            <Area
              type="monotone"
              dataKey="value"
              stroke={sensorConfig.color}
              fill={`${sensorConfig.color}25`}
              strokeWidth={3}
              name={`${sensorConfig.name} (${sensorConfig.unit})`}
              dot={{ r: 4, fill: sensorConfig.color }}
              activeDot={{ r: 6, fill: sensorConfig.color }}
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {commonElements}
            <Bar
              dataKey="value"
              name={`${sensorConfig.name} (${sensorConfig.unit})`}
              radius={[4, 4, 0, 0]}
            >
              {sensorData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={sensorConfig.color} />
              ))}
            </Bar>
          </BarChart>
        );

      case 'line':
      default:
        return (
          <LineChart {...commonProps}>
            {commonElements}
            <Line
              type="monotone"
              dataKey="value"
              stroke={sensorConfig.color}
              strokeWidth={3}
              name={`${sensorConfig.name} (${sensorConfig.unit})`}
              dot={{ r: 4, fill: sensorConfig.color }}
              activeDot={{ r: 7, fill: sensorConfig.color }}
              connectNulls={false}
            />
          </LineChart>
        );
    }
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '24px',
      margin: '16px 0',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
      border: '2px solid #e5e7eb'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            padding: '10px',
            backgroundColor: sensorConfig.color,
            borderRadius: '12px',
            color: 'white'
          }}>
            <IconComponent size={24} />
          </div>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: '1.3rem',
              fontWeight: '700',
              color: '#1f2937'
            }}>
              {sensorConfig.emoji} {sensorConfig.name}
            </h3>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: '0.9rem',
              color: '#6b7280'
            }}>
              {sensorConfig.description}
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div style={{
          display: 'flex',
          gap: '16px',
          fontSize: '0.85rem',
          color: '#6b7280'
        }}>
          <div>
            <strong style={{ color: '#059669' }}>Min:</strong> {stats.min.toFixed(1)}{sensorConfig.unit}
          </div>
          <div>
            <strong style={{ color: '#dc2626' }}>Max:</strong> {stats.max.toFixed(1)}{sensorConfig.unit}
          </div>
          <div>
            <strong style={{ color: '#7c3aed' }}>Avg:</strong> {stats.avg.toFixed(1)}{sensorConfig.unit}
          </div>
          <div>
            <strong style={{ color: sensorConfig.color }}>Latest:</strong> {stats.latest.toFixed(1)}{sensorConfig.unit}
          </div>
        </div>
      </div>

      {/* Chart Type Selector */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        padding: '16px',
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <span style={{
          fontSize: '0.9rem',
          fontWeight: '600',
          color: '#374151',
          minWidth: 'fit-content'
        }}>
          📊 Chọn biểu đồ:
        </span>
        
        {sensorConfig.charts.map((chart) => (
          <button
            key={chart.type}
            onClick={() => onChartTypeChange(chart.type)}
            style={{
              padding: '8px 16px',
              border: `2px solid ${selectedChartType === chart.type ? sensorConfig.color : '#d1d5db'}`,
              borderRadius: '8px',
              backgroundColor: selectedChartType === chart.type ? sensorConfig.color : 'white',
              color: selectedChartType === chart.type ? 'white' : '#374151',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              position: 'relative'
            }}
          >
            {chart.primary && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: '#10b981',
                color: 'white',
                fontSize: '0.6rem',
                padding: '2px 6px',
                borderRadius: '10px',
                fontWeight: '700'
              }}>
                ⭐
              </span>
            )}
            {chart.emoji} {chart.name}
          </button>
        ))}
      </div>

      {/* Chart Description */}
      <div style={{
        marginBottom: '20px',
        padding: '12px 16px',
        backgroundColor: selectedChartType === sensorConfig.charts.find(c => c.primary)?.type ? '#dcfce7' : '#eff6ff',
        borderRadius: '8px',
        fontSize: '0.85rem',
        color: selectedChartType === sensorConfig.charts.find(c => c.primary)?.type ? '#166534' : '#1e40af',
        border: `1px solid ${selectedChartType === sensorConfig.charts.find(c => c.primary)?.type ? '#bbf7d0' : '#bae6fd'}`
      }}>
        <strong>💡 {sensorConfig.charts.find(c => c.type === selectedChartType)?.name}:</strong>{' '}
        {sensorConfig.charts.find(c => c.type === selectedChartType)?.description}
        
        {selectedChartType === sensorConfig.charts.find(c => c.primary)?.type && (
          <div style={{ marginTop: '8px', fontWeight: '700' }}>
            ✅ Tuyệt vời! Đây là lựa chọn tối ưu cho {sensorConfig.name}
          </div>
        )}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>

      {/* Data Info */}
      <div style={{
        marginTop: '16px',
        padding: '12px 16px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        fontSize: '0.8rem',
        color: '#6b7280',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div>
          📊 <strong>Dữ liệu:</strong> {sensorData.length} điểm • 
          <strong> Loại:</strong> {sensorConfig.charts.find(c => c.type === selectedChartType)?.name}
        </div>
        <div>
          <strong>Phạm vi:</strong> {stats.min.toFixed(1)} - {stats.max.toFixed(1)} {sensorConfig.unit}
        </div>
      </div>
    </div>
  );
};

// Main Multi-Sensor Chart View Component
const MultiSensorChartView = ({ 
  data = [], 
  title = "📊 Biểu đồ chuyên biệt theo từng sensor",
  selectedSensors = {
    temp: true,
    humidity: true,
    mq7CO: true,
    dust: true
  },
  height = 350
}) => {
  // State for each sensor's chart type
  const [chartTypes, setChartTypes] = useState({
    temp: 'line',
    humidity: 'area', 
    mq7CO: 'line',
    dust: 'line'
  });

  // Safe data validation
  const safeData = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return [];
    }
    return data.filter(item => item && typeof item === 'object');
  }, [data]);

  const handleChartTypeChange = (sensorKey, chartType) => {
    setChartTypes(prev => ({
      ...prev,
      [sensorKey]: chartType
    }));
  };

  // Get active sensors
  const activeSensors = Object.entries(selectedSensors)
    .filter(([key, selected]) => selected && SENSOR_CHART_CONFIGS[key])
    .map(([key]) => key);

  if (activeSensors.length === 0) {
    return (
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '40px',
        margin: '16px 0',
        textAlign: 'center',
        border: '2px dashed #d1d5db'
      }}>
        <TrendingUp size={48} color="#6b7280" />
        <h3 style={{ color: '#6b7280', marginTop: '16px' }}>
          Chọn ít nhất một sensor để hiển thị biểu đồ
        </h3>
      </div>
    );
  }

  return (
    <div className="multi-sensor-chart-container">
      {/* Header */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        margin: '16px 0',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
        border: '1px solid #e5e7eb'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '1.5rem',
          fontWeight: '700',
          color: '#1f2937',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <BarChart3 size={32} />
          {title}
        </h2>
        <p style={{
          margin: '8px 0 0 0',
          fontSize: '1rem',
          color: '#6b7280'
        }}>
          Mỗi sensor hiển thị với biểu đồ tối ưu riêng - {activeSensors.length} sensors đang hoạt động
        </p>
      </div>

      {/* Individual Sensor Charts */}
      {activeSensors.map(sensorKey => (
        <SensorChart
          key={sensorKey}
          sensorConfig={SENSOR_CHART_CONFIGS[sensorKey]}
          data={safeData}
          selectedChartType={chartTypes[sensorKey]}
          onChartTypeChange={(chartType) => handleChartTypeChange(sensorKey, chartType)}
          height={height}
        />
      ))}

      {/* Summary */}
      <div style={{
        backgroundColor: '#f0f9ff',
        borderRadius: '16px',
        padding: '20px',
        margin: '16px 0',
        border: '2px solid #3b82f6',
        boxShadow: '0 4px 6px rgba(59, 130, 246, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px'
        }}>
          <Activity size={24} color="#3b82f6" />
          <h4 style={{
            margin: 0,
            fontSize: '1.1rem',
            fontWeight: '700',
            color: '#1d4ed8'
          }}>
            📈 Tóm tắt hiển thị
          </h4>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '12px',
          fontSize: '0.9rem',
          color: '#1e40af'
        }}>
          {activeSensors.map(sensorKey => {
            const config = SENSOR_CHART_CONFIGS[sensorKey];
            const currentChart = config.charts.find(c => c.type === chartTypes[sensorKey]);
            return (
              <div key={sensorKey} style={{
                padding: '12px',
                backgroundColor: '#eff6ff',
                borderRadius: '8px',
                border: '1px solid #bae6fd'
              }}>
                <strong>{config.emoji} {config.name}:</strong>{' '}
                {currentChart?.name}
                {currentChart?.primary && (
                  <span style={{ color: '#059669', fontWeight: '700' }}> ⭐</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MultiSensorChartView;