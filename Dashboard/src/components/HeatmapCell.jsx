// src/HeatmapCell.jsx - Component ô heatmap với No Data support
import React from 'react';
import { getHeatmapColor, getContrastColor } from '../utils/colorUtils';
import { getValueColorAndStatus } from '../utils/thresholds';

const HeatmapCell = ({ 
  value, 
  min, 
  max, 
  thresholdType, 
  unit = '', 
  time, 
  isLatest = false,
  hasData = true,
  channelId = null,
  error = null
}) => {
  // Handle no data case
  if (!hasData || value === null || value === undefined) {
    return (
      <div
        className={`heatmap-cell no-data ${isLatest ? 'latest' : ''}`}
        style={{
          backgroundColor: '#f3f4f6',
          color: '#9ca3af',
          border: '1px solid #e5e7eb',
          width: '100%',
          aspectRatio: '1',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          cursor: 'not-allowed',
          fontSize: '0.7rem',
          fontWeight: '600',
          textAlign: 'center',
          padding: '4px',
          transition: 'all 0.2s ease',
          minHeight: '70px'
        }}
        title={`Kênh ${channelId}: Không có dữ liệu${error ? ` (${error})` : ''}`}
      >
        <div style={{ 
          lineHeight: '1.1',
          fontSize: '0.6rem',
          fontWeight: '500',
          textAlign: 'center'
        }}>
          No Data
        </div>
        
        {channelId && (
          <div style={{ 
            fontSize: '0.5rem',
            opacity: 0.7,
            marginTop: '2px'
          }}>
            Ch.{channelId}
          </div>
        )}
        
        <div style={{ 
          fontSize: '0.5rem',
          opacity: 0.6,
          marginTop: '2px',
          fontWeight: '400'
        }}>
          {time || '--:--'}
        </div>
      </div>
    );
  }

  const safeValue = parseFloat(value) || 0;
  const backgroundColor = getHeatmapColor(safeValue, min, max, thresholdType);
  const textColor = getContrastColor(backgroundColor);
  const { status, label } = getValueColorAndStatus(safeValue, thresholdType);

  return (
    <div
      className={`heatmap-cell ${status} ${isLatest ? 'latest' : ''}`}
      style={{
        backgroundColor,
        color: textColor,
        border: isLatest ? '3px solid #3b82f6' : 'none',
        boxShadow: isLatest ? '0 0 12px rgba(59, 130, 246, 0.8)' : 'none',
        width: '100%',
        aspectRatio: '1',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: '700',
        textAlign: 'center',
        padding: '6px',
        transition: 'all 0.2s ease',
        minHeight: '70px'
      }}
      title={`${time}: ${safeValue.toFixed(1)}${unit} - ${label}${channelId ? ` (Kênh ${channelId})` : ''}`}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.zIndex = '10';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.25)';
        e.currentTarget.style.border = '3px solid #ffffff';
      }}
      onMouseLeave={(e) => {
        if (!isLatest) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.zIndex = '1';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.border = 'none';
        } else {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.zIndex = '5';
          e.currentTarget.style.boxShadow = '0 0 12px rgba(59, 130, 246, 0.8)';
          e.currentTarget.style.border = '3px solid #3b82f6';
        }
      }}
    >
      <div style={{ 
        lineHeight: '1.1',
        fontSize: '0.85rem',
        fontWeight: '700'
      }}>
        {safeValue.toFixed(1)}{unit}
      </div>
      
      {channelId && (
        <div style={{ 
          fontSize: '0.55rem',
          opacity: 0.8,
          marginTop: '1px',
          fontWeight: '500'
        }}>
          Ch.{channelId}
        </div>
      )}
      
      <div style={{ 
        fontSize: '0.65rem',
        opacity: 0.9,
        marginTop: '2px',
        fontWeight: '500'
      }}>
        {time}
      </div>
      
      {isLatest && (
        <div style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          width: '8px',
          height: '8px',
          backgroundColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'pulse 2s infinite'
        }} />
      )}
    </div>
  );
};

export default HeatmapCell;