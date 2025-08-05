// src/StatCard.jsx - Component thẻ thống kê
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { getValueColorAndStatus } from '../utils/thresholds';
import { hexToRgba } from '../utils/colorUtils';

const StatCard = ({ 
  title, 
  value, 
  unit, 
  trend, 
  status, 
  icon: Icon, 
  thresholdType,
  showTrend = true,
  size = 'normal' // normal, large, small
}) => {
  const TrendIcon = trend > 0 ? TrendingUp : TrendingDown;
  const { color, label } = getValueColorAndStatus(parseFloat(value), thresholdType);
  
  const cardStyle = {
    background: `linear-gradient(135deg, ${hexToRgba(color, 0.15)} 0%, ${hexToRgba(color, 0.05)} 100%)`,
    borderLeft: `4px solid ${color}`,
    borderRadius: '12px',
    padding: size === 'large' ? '24px' : size === 'small' ? '16px' : '20px',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: size === 'large' ? '16px' : '12px'
  };

  const trendStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  };

  const valueStyle = {
    fontSize: size === 'large' ? '2rem' : size === 'small' ? '1.2rem' : '1.5rem',
    fontWeight: 'bold',
    color: color,
    margin: '8px 0'
  };

  const titleStyle = {
    fontSize: size === 'large' ? '1.1rem' : '1rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '4px'
  };

  const labelStyle = {
    fontSize: '0.8rem',
    color: '#6b7280',
    fontStyle: 'italic'
  };

  return (
    <div 
      className={`stat-card ${status}`} 
      style={cardStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
      }}
    >
      <div className="stat-header" style={headerStyle}>
        <Icon size={size === 'large' ? 28 : 24} color={color} />
        {showTrend && (
          <div className="trend-info" style={trendStyle}>
            <TrendIcon size={16} color={trend > 0 ? '#16a34a' : '#dc2626'} />
            <span 
              className={`trend-value ${trend > 0 ? 'positive' : 'negative'}`} 
              style={{
                color: trend > 0 ? '#16a34a' : '#dc2626',
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}
            >
              {Math.abs(trend).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
      
      <h3 className="stat-title" style={titleStyle}>
        {title}
      </h3>
      
      <div className="stat-value" style={valueStyle}>
        {value}{unit}
      </div>
      
      <div className="stat-label" style={labelStyle}>
        {label}
      </div>

      {/* Background decoration */}
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          right: '-50%',
          width: '100%',
          height: '100%',
          background: `radial-gradient(circle, ${hexToRgba(color, 0.1)} 0%, transparent 70%)`,
          pointerEvents: 'none'
        }}
      />
    </div>
  );
};

export default StatCard;