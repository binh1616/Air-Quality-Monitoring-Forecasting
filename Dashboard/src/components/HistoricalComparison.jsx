// src/HistoricalComparison.jsx - Component so sánh dữ liệu lịch sử
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Calendar, BarChart3, AlertTriangle, Activity } from 'lucide-react';
import { historicalDataService } from '../utils/historicalDataService';
import { SENSOR_CONFIG } from '../utils/sensorConfig';
import { getValueColorAndStatus } from '../utils/thresholds';

const HistoricalComparison = ({ currentData }) => {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDays, setSelectedDays] = useState(1);
  const [anomalies, setAnomalies] = useState([]);

  useEffect(() => {
    if (currentData) {
      loadComparison();
    }
  }, [currentData, selectedDays]);

  const loadComparison = async () => {
    try {
      setLoading(true);
      setError(null);

      const comparisonData = await historicalDataService.compareWithPreviousDay(currentData, selectedDays);
      setComparison(comparisonData);

      // Detect anomalies
      if (comparisonData) {
        const detectedAnomalies = historicalDataService.detectAnomalies(
          currentData, 
          comparisonData.historical.data
        );
        setAnomalies(detectedAnomalies);
      }

    } catch (err) {
      setError(err.message);
      console.error('Error loading comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  const ComparisonMetricCard = ({ fieldKey, metric }) => {
    const config = SENSOR_CONFIG[fieldKey];
    if (!config || !metric) return null;

    const { change } = metric;
    const changeIcon = change.trend === 'increase' ? TrendingUp : 
                      change.trend === 'decrease' ? TrendingDown : BarChart3;
    
    const changeColor = change.trend === 'increase' ? '#16a34a' : 
                       change.trend === 'decrease' ? '#dc2626' : '#6b7280';

    const { color: currentColor } = getValueColorAndStatus(metric.current.avg, config.threshold);
    const { color: historicalColor } = getValueColorAndStatus(metric.historical.avg, config.threshold);

    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <config.icon size={20} color={currentColor} />
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
              {metric.name}
            </h4>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            backgroundColor: change.trend === 'increase' ? '#dcfce7' : 
                           change.trend === 'decrease' ? '#fef2f2' : '#f3f4f6',
            borderRadius: '6px'
          }}>
            {React.createElement(changeIcon, { size: 16, color: changeColor })}
            <span style={{
              fontSize: '0.8rem',
              fontWeight: '600',
              color: changeColor
            }}>
              {Math.abs(change.percent).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Current vs Historical */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '12px'
        }}>
          {/* Current */}
          <div style={{
            padding: '12px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            borderLeft: `3px solid ${currentColor}`
          }}>
            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '4px' }}>
              Hôm nay
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: currentColor }}>
              {metric.current.avg.toFixed(1)}{config.unit}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
              {metric.current.min.toFixed(1)} - {metric.current.max.toFixed(1)}{config.unit}
            </div>
          </div>

          {/* Historical */}
          <div style={{
            padding: '12px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            borderLeft: `3px solid ${historicalColor}`
          }}>
            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '4px' }}>
              {selectedDays} ngày trước
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: historicalColor }}>
              {metric.historical.avg.toFixed(1)}{config.unit}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
              {metric.historical.min.toFixed(1)} - {metric.historical.max.toFixed(1)}{config.unit}
            </div>
          </div>
        </div>

        {/* Change Details */}
        <div style={{
          padding: '8px 12px',
          backgroundColor: change.trend === 'increase' ? '#f0fdf4' : 
                         change.trend === 'decrease' ? '#fef7f7' : '#f9fafb',
          borderRadius: '6px',
          fontSize: '0.8rem'
        }}>
          <span style={{ color: '#374151' }}>Thay đổi: </span>
          <span style={{ fontWeight: '600', color: changeColor }}>
            {change.absolute > 0 ? '+' : ''}{change.absolute.toFixed(2)}{config.unit}
          </span>
          <span style={{ color: '#6b7280' }}> ({metric.current.count} vs {metric.historical.count} readings)</span>
        </div>
      </div>
    );
  };

  const AnomalyAlert = ({ anomaly }) => {
    const config = SENSOR_CONFIG[anomaly.field];
    const severityColor = anomaly.severity === 'high' ? '#dc2626' : 
                         anomaly.severity === 'medium' ? '#f59e0b' : '#eab308';

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        backgroundColor: '#fef7f7',
        borderRadius: '8px',
        border: `1px solid ${severityColor}20`
      }}>
        <AlertTriangle size={20} color={severityColor} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '600', color: '#374151' }}>
            {anomaly.fieldName}: {anomaly.value.toFixed(1)}{config?.unit}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
            Bất thường so với mức trung bình {anomaly.expected.toFixed(1)}{config?.unit}
            {' '}(Z-score: {anomaly.zScore.toFixed(2)})
          </div>
        </div>
        <div style={{
          padding: '2px 8px',
          backgroundColor: severityColor,
          color: 'white',
          borderRadius: '4px',
          fontSize: '0.7rem',
          fontWeight: '600'
        }}>
          {anomaly.severity.toUpperCase()}
        </div>
      </div>
    );
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
        <p>Đang tải dữ liệu so sánh...</p>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <AlertTriangle size={20} />
          <strong>Lỗi tải dữ liệu so sánh</strong>
        </div>
        <p style={{ margin: 0 }}>{error}</p>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        <Calendar size={48} style={{ marginBottom: '16px' }} />
        <p>Không có dữ liệu để so sánh</p>
      </div>
    );
  }

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
          <Calendar size={24} />
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
            So sánh lịch sử
          </h3>
        </div>

        {/* Days Selection */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>So sánh với:</span>
          {[1, 2, 3, 7].map(days => (
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
              {days === 1 ? 'Hôm qua' : `${days} ngày trước`}
            </button>
          ))}
        </div>
      </div>

      {/* Anomalies Section */}
      {anomalies.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{
            margin: '0 0 12px 0',
            fontSize: '1rem',
            fontWeight: '600',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={20} />
            Phát hiện bất thường ({anomalies.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {anomalies.map((anomaly, index) => (
              <AnomalyAlert key={index} anomaly={anomaly} />
            ))}
          </div>
        </div>
      )}

      {/* Comparison Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '16px'
      }}>
        {Object.entries(comparison.metrics).map(([fieldKey, metric]) => (
          <ComparisonMetricCard key={fieldKey} fieldKey={fieldKey} metric={metric} />
        ))}
      </div>

      {/* Summary */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        fontSize: '0.9rem',
        color: '#6b7280'
      }}>
        <strong>Tóm tắt:</strong> So sánh dữ liệu hiện tại với {selectedDays} ngày trước
        {anomalies.length > 0 && (
          <span> • Phát hiện {anomalies.length} bất thường cần chú ý</span>
        )}
      </div>
    </div>
  );
};

export default HistoricalComparison;