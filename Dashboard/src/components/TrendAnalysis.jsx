// src/TrendAnalysis.jsx - Component phân tích xu hướng
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Calendar, Download, RefreshCw, BarChart3, Activity } from 'lucide-react';
import { historicalDataService } from '../utils/historicalDataService';
import { SENSOR_CONFIG } from '../utils/sensorConfig';
import { getChartColorPalette } from '../utils/colorUtils';

const TrendAnalysis = () => {
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDays, setSelectedDays] = useState(7);
  const [selectedFields, setSelectedFields] = useState({
    field1: true,
    field2: true,
    field4: true
  });
  const [chartType, setChartType] = useState('line');

  useEffect(() => {
    loadTrendData();
  }, [selectedDays]);

  const loadTrendData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await historicalDataService.fetchTrendData(selectedDays);
      
      // Format data for charts
      const formattedData = data.map(day => ({
        date: day.date,
        dateLabel: day.dateLabel,
        dataCount: day.dataCount,
        ...Object.keys(day.metrics).reduce((acc, fieldKey) => {
          const config = SENSOR_CONFIG[fieldKey];
          if (config) {
            acc[fieldKey] = day.metrics[fieldKey]?.avg || 0;
            acc[`${fieldKey}_min`] = day.metrics[fieldKey]?.min || 0;
            acc[`${fieldKey}_max`] = day.metrics[fieldKey]?.max || 0;
          }
          return acc;
        }, {})
      }));

      setTrendData(formattedData);
    } catch (err) {
      setError(err.message);
      console.error('Error loading trend data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleField = (fieldKey) => {
    setSelectedFields(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }));
  };

  const exportTrendData = () => {
    if (trendData.length === 0) return;

    const csv = [
      // Header
      ['Date', 'Date Label', 'Data Count', ...Object.keys(SENSOR_CONFIG).map(field => 
        SENSOR_CONFIG[field].name + ' (' + SENSOR_CONFIG[field].unit + ')'
      )],
      // Data rows
      ...trendData.map(day => [
        day.date,
        day.dateLabel,
        day.dataCount,
        ...Object.keys(SENSOR_CONFIG).map(field => day[field] || 0)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trend-analysis-${selectedDays}days-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const calculateTrendDirection = (fieldKey) => {
    if (trendData.length < 2) return 'stable';
    
    const recent = trendData.slice(-3).map(d => d[fieldKey] || 0);
    const older = trendData.slice(0, 3).map(d => d[fieldKey] || 0);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (Math.abs(change) < 2) return 'stable';
    return change > 0 ? 'increasing' : 'decreasing';
  };

  const TrendSummaryCard = ({ fieldKey }) => {
    const config = SENSOR_CONFIG[fieldKey];
    if (!config) return null;

    const values = trendData.map(d => d[fieldKey] || 0).filter(v => v > 0);
    if (values.length === 0) return null;

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const trend = calculateTrendDirection(fieldKey);

    const trendColor = trend === 'increasing' ? '#16a34a' : 
                      trend === 'decreasing' ? '#dc2626' : '#6b7280';
    const trendIcon = trend === 'increasing' ? TrendingUp : 
                     trend === 'decreasing' ? TrendingUp : BarChart3;

    return (
      <div style={{
        backgroundColor: 'white',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <config.icon size={16} />
            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
              {config.name}
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: trendColor
          }}>
            {React.createElement(trendIcon, { 
              size: 14, 
              style: { transform: trend === 'decreasing' ? 'rotate(180deg)' : 'none' }
            })}
            <span style={{ fontSize: '0.7rem', fontWeight: '500' }}>
              {trend === 'increasing' ? 'Tăng' : trend === 'decreasing' ? 'Giảm' : 'Ổn định'}
            </span>
          </div>
        </div>
        
        <div style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '4px' }}>
          {avg.toFixed(1)}{config.unit}
        </div>
        
        <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
          {min.toFixed(1)} - {max.toFixed(1)}{config.unit} ({selectedDays} ngày)
        </div>
      </div>
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '12px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#1f2937' }}>
            {label}
          </p>
          {payload.map((entry, index) => {
            const config = SENSOR_CONFIG[entry.dataKey];
            return (
              <p key={index} style={{ 
                margin: '4px 0', 
                color: entry.color,
                fontSize: '0.9rem'
              }}>
                {config?.name}: <strong>{entry.value.toFixed(1)}{config?.unit}</strong>
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        gap: '16px'
      }}>
        <Activity size={32} className="loading-spinner" />
        <p>Đang tải dữ liệu xu hướng...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#fef2f2',
        borderRadius: '12px',
        border: '1px solid #fecaca',
        color: '#dc2626'
      }}>
        <strong>Lỗi tải dữ liệu xu hướng:</strong> {error}
      </div>
    );
  }

  const colors = getChartColorPalette();
  const availableFields = Object.keys(SENSOR_CONFIG).filter(field => 
    trendData.some(d => d[field] > 0)
  );

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
      border: '1px solid #e5e7eb',
      margin: '16px 0'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={24} />
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
            Phân tích xu hướng
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Days Selection */}
          {[3, 7, 14, 30].map(days => (
            <button
              key={days}
              onClick={() => setSelectedDays(days)}
              style={{
                padding: '6px 12px',
                border: selectedDays === days ? '2px solid #3b82f6' : '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: selectedDays === days ? '#eff6ff' : 'white',
                color: selectedDays === days ? '#1d4ed8' : '#374151',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: selectedDays === days ? '600' : 'normal'
              }}
            >
              {days} ngày
            </button>
          ))}

          {/* Chart Type */}
          <button
            onClick={() => setChartType(chartType === 'line' ? 'area' : 'line')}
            style={{
              padding: '6px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            {chartType === 'line' ? '📈 Line' : '📊 Area'}
          </button>

          {/* Export */}
          <button
            onClick={exportTrendData}
            style={{
              padding: '6px 12px',
              border: '1px solid #16a34a',
              borderRadius: '6px',
              backgroundColor: '#16a34a',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Download size={14} />
            Export
          </button>

          {/* Refresh */}
          <button
            onClick={loadTrendData}
            disabled={loading}
            style={{
              padding: '6px 12px',
              border: '1px solid #6b7280',
              borderRadius: '6px',
              backgroundColor: '#6b7280',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              opacity: loading ? 0.6 : 1
            }}
          >
            <RefreshCw size={14} className={loading ? 'loading-spinner' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        {availableFields.slice(0, 6).map(fieldKey => (
          <TrendSummaryCard key={fieldKey} fieldKey={fieldKey} />
        ))}
      </div>

      {/* Field Selection */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '20px',
        padding: '12px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px'
      }}>
        <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginRight: '8px' }}>
          Hiển thị:
        </span>
        {availableFields.map((fieldKey, index) => {
          const config = SENSOR_CONFIG[fieldKey];
          const color = colors[index % colors.length];
          return (
            <button
              key={fieldKey}
              onClick={() => toggleField(fieldKey)}
              style={{
                padding: '4px 8px',
                border: `2px solid ${selectedFields[fieldKey] ? color : '#d1d5db'}`,
                borderRadius: '4px',
                backgroundColor: selectedFields[fieldKey] ? `${color}15` : 'white',
                color: selectedFields[fieldKey] ? color : '#6b7280',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: selectedFields[fieldKey] ? '600' : 'normal'
              }}
            >
              {config.name}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        {chartType === 'line' ? (
          <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="dateLabel" 
              stroke="#6b7280"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {availableFields.map((fieldKey, index) => 
              selectedFields[fieldKey] && (
                <Line
                  key={fieldKey}
                  type="monotone"
                  dataKey={fieldKey}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  name={SENSOR_CONFIG[fieldKey].name}
                  dot={{ r: 4, fill: colors[index % colors.length] }}
                  activeDot={{ r: 6, fill: colors[index % colors.length] }}
                />
              )
            )}
          </LineChart>
        ) : (
          <AreaChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="dateLabel" 
              stroke="#6b7280"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {availableFields.map((fieldKey, index) => 
              selectedFields[fieldKey] && (
                <Area
                  key={fieldKey}
                  type="monotone"
                  dataKey={fieldKey}
                  stackId="1"
                  stroke={colors[index % colors.length]}
                  fill={`${colors[index % colors.length]}30`}
                  name={SENSOR_CONFIG[fieldKey].name}
                />
              )
            )}
          </AreaChart>
        )}
      </ResponsiveContainer>

      {/* Footer Info */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        fontSize: '0.8rem',
        color: '#6b7280',
        textAlign: 'center'
      }}>
        📊 Hiển thị xu hướng {selectedDays} ngày gần nhất • 
        {trendData.length > 0 && (
          <span> Từ {trendData[0]?.dateLabel} đến {trendData[trendData.length - 1]?.dateLabel}</span>
        )}
      </div>
    </div>
  );
};

export default TrendAnalysis;