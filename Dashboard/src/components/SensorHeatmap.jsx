// src/SensorHeatmap.jsx - Component heatmap với layout mới (Updated)
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import HeatmapCell from './HeatmapCell';
import { SENSOR_THRESHOLDS } from '../utils/thresholds';

const ColorLegend = ({ thresholdType, unit }) => {
  const thresholds = SENSOR_THRESHOLDS[thresholdType] || SENSOR_THRESHOLDS.generic;
  
  const getThresholdRangeText = (threshold) => {
    if (threshold.min === undefined && threshold.max !== undefined) {
      return `< ${threshold.max}${unit}`;
    } else if (threshold.min !== undefined && threshold.max === undefined) {
      return `> ${threshold.min}${unit}`;
    } else if (threshold.min !== undefined && threshold.max !== undefined) {
      return `${threshold.min} - ${threshold.max}${unit}`;
    }
    return unit;
  };
  
  return (
    <div style={{
      backgroundColor: '#f9fafb',
      borderRadius: '16px',
      padding: '24px',
      minWidth: '300px',
      height: 'fit-content'
    }}>
      <h4 style={{
        margin: '0 0 16px 0',
        fontSize: '1.1rem',
        fontWeight: '700',
        color: '#374151'
      }}>
        Thang đo màu sắc
      </h4>
      
      {/* Gradient Bar */}
      <div style={{
        height: '28px',
        borderRadius: '14px',
        background: `linear-gradient(to right, ${thresholds.map(t => t.color).join(', ')})`,
        marginBottom: '16px',
        border: '2px solid #e5e7eb'
      }} />
      
      {/* Labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.85rem',
        color: '#6b7280',
        marginBottom: '20px',
        fontWeight: '500'
      }}>
        <span>An toàn</span>
        <span>Nguy hiểm</span>
      </div>
      
      {/* Threshold Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {thresholds.map((threshold, index) => (
          <div key={index} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.9rem'
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              backgroundColor: threshold.color,
              borderRadius: '3px',
              border: '1px solid rgba(0,0,0,0.1)',
              flexShrink: 0
            }} />
            <span style={{ 
              color: '#374151', 
              fontWeight: '600',
              flex: 1
            }}>
              {threshold.label}
            </span>
            <span style={{ 
              color: '#6b7280', 
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
              fontWeight: '500'
            }}>
              {getThresholdRangeText(threshold)}
            </span>
          </div>
        ))}
      </div>
      
      {/* Channel Info */}
      <div style={{
        marginTop: '20px',
        padding: '12px',
        backgroundColor: '#f0f9ff',
        borderRadius: '8px',
        fontSize: '0.8rem',
        color: '#0c4a6e'
      }}>
        <strong>💡 Lưu ý:</strong> Mỗi ô tương ứng với 1 kênh riêng biệt. 
        Ô xám = kênh không có dữ liệu.
      </div>
    </div>
  );
};

const SensorHeatmap = ({ 
  title, 
  data, 
  timeLabels, 
  unit, 
  thresholdType,
  showStats = true,
  showLegend = true,
  gridSize = 5
}) => {
  // Ensure we have exactly 25 elements for 5x5 grid
  const totalCells = gridSize * gridSize;
  
  // Process data - mỗi element là object với {value, hasData, channelId, error, time}
  const processedData = Array(totalCells).fill(null).map((_, index) => {
    const cellData = data[index];
    
    if (!cellData) {
      return {
        value: null,
        hasData: false,
        channelId: index + 1,
        error: 'No config',
        time: '--:--'
      };
    }
    
    return {
      value: cellData.value !== undefined ? parseFloat(cellData.value) : null,
      hasData: cellData.hasData || false,
      channelId: cellData.channelId || (index + 1),
      error: cellData.error || null,
      time: cellData.time || '--:--'
    };
  });

  // Calculate stats only from channels with data
  const validValues = processedData
    .filter(cell => cell.hasData && cell.value !== null && !isNaN(cell.value) && cell.value > 0)
    .map(cell => cell.value);
    
  const min = validValues.length > 0 ? Math.min(...validValues) : 0;
  const max = validValues.length > 0 ? Math.max(...validValues) : 0;
  const avg = validValues.length > 0 ? validValues.reduce((a, b) => a + b, 0) / validValues.length : 0;
  
  const channelsWithData = processedData.filter(cell => cell.hasData).length;
  const channelsWithoutData = totalCells - channelsWithData;

  // Create 5x5 matrix
  const matrix = [];
  for (let i = 0; i < gridSize; i++) {
    const row = [];
    for (let j = 0; j < gridSize; j++) {
      const index = i * gridSize + j;
      const cellData = processedData[index];
      row.push({
        ...cellData,
        isLatest: false // Since each cell represents different channel, no "latest" concept
      });
    }
    matrix.push(row);
  }

  return (
    <div className="heatmap-container">
      {/* Header với thống kê */}
      {showStats && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: 0
          }}>
            {title}
          </h3>
          
          <div style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            {validValues.length > 0 && (
              <>
                <div style={{
                  padding: '4px 12px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  color: '#374151'
                }}>
                  Min: <strong style={{ color: '#059669' }}>{min.toFixed(1)}{unit}</strong>
                </div>
                <div style={{
                  padding: '4px 12px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  color: '#374151'
                }}>
                  Max: <strong style={{ color: '#dc2626' }}>{max.toFixed(1)}{unit}</strong>
                </div>
                <div style={{
                  padding: '4px 12px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  color: '#374151'
                }}>
                  Avg: <strong style={{ color: '#7c3aed' }}>{avg.toFixed(1)}{unit}</strong>
                </div>
              </>
            )}
            <div style={{
              padding: '4px 12px',
              backgroundColor: '#dcfce7',
              borderRadius: '6px',
              fontSize: '0.8rem',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              ✅ <strong>{channelsWithData}</strong> kênh có data
            </div>
            <div style={{
              padding: '4px 12px',
              backgroundColor: '#fef2f2',
              borderRadius: '6px',
              fontSize: '0.8rem',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              ❌ <strong>{channelsWithoutData}</strong> kênh không data
            </div>
          </div>
        </div>
      )}

      {/* Main Content: Heatmap + Legend */}
      <div style={{
        display: 'flex',
        gap: '24px',
        alignItems: 'flex-start',
        minHeight: '500px'
      }}>
        {/* Heatmap Grid - Bên trái (60%) */}
        <div style={{
          flex: '1 1 60%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {/* Grid Container */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${gridSize}, 1fr)`,
            gap: '0px',
            width: '100%',
            maxWidth: '900px',
            aspectRatio: '1',
            border: '3px solid #e5e7eb',
            borderRadius: '16px',
            padding: '0px',
            backgroundColor: '#ffffff',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden'
          }}>
            {matrix.map((row, rowIndex) => (
              row.map((cell, colIndex) => (
                <HeatmapCell
                  key={`${rowIndex}-${colIndex}`}
                  value={cell.value}
                  min={min}
                  max={max}
                  thresholdType={thresholdType}
                  unit={unit}
                  time={cell.time}
                  isLatest={cell.isLatest}
                  hasData={cell.hasData}
                  channelId={cell.channelId}
                  error={cell.error}
                />
              ))
            ))}
          </div>
          
          {/* Info dưới heatmap */}
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            fontSize: '1rem',
            color: '#6b7280',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            🗺️ Bản đồ nhiệt tổng hợp
          </div>
        </div>

        {/* Color Legend - Bên phải (40%) */}
        {showLegend && (
          <div style={{ 
            flex: '1 1 40%',
            maxWidth: '400px',
            minWidth: '400px'
          }}>
            <ColorLegend 
              thresholdType={thresholdType} 
              unit={unit}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SensorHeatmap;