// src/AlertPanel.jsx - Component hiển thị panel cảnh báo
import React, { useState } from 'react';
import { AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react';

const AlertPanel = ({ 
  alerts, 
  autoHide = false, 
  hideDelay = 5000,
  showTimestamp = true,
  collapsible = true 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  if (!alerts || alerts.length === 0) return null;

  // Lọc bỏ các alerts đã bị dismiss
  const visibleAlerts = alerts.filter((_, index) => !dismissedAlerts.has(index));
  
  if (visibleAlerts.length === 0) return null;

  const dismissAlert = (index) => {
    setDismissedAlerts(new Set([...dismissedAlerts, index]));
  };

  const getAlertColor = (alert) => {
    if (alert.level === 'critical' || alert.message.includes('nguy hiểm')) return '#dc2626';
    if (alert.level === 'warning' || alert.message.includes('cảnh báo')) return '#f59e0b';
    if (alert.level === 'caution' || alert.message.includes('chú ý')) return '#eab308';
    return '#f59e0b';
  };

  const getAlertIcon = (alert) => {
    return <AlertTriangle size={20} color={getAlertColor(alert)} />;
  };

  const panelStyle = {
    backgroundColor: '#fef2f2',
    border: '1px solid rgba(220, 38, 38, 0.2)',
    borderLeft: '4px solid #dc2626',
    borderRadius: '12px',
    padding: '16px',
    margin: '16px 0',
    maxWidth: '100%',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
    animation: 'slideIn 0.3s ease-out'
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: isCollapsed ? '0' : '12px',
    cursor: collapsible ? 'pointer' : 'default'
  };

  const titleContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const titleStyle = {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#991b1b'
  };

  const controlsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const badgeStyle = {
    backgroundColor: '#dc2626',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    padding: '2px 8px',
    borderRadius: '12px',
    minWidth: '20px',
    textAlign: 'center'
  };

  return (
    <div className="alert-panel" style={panelStyle}>
      <div 
        className="alert-header" 
        style={headerStyle}
        onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
      >
        <div style={titleContainerStyle}>
          <AlertTriangle size={20} color="#dc2626" />
          <h3 style={titleStyle}>Cảnh báo hệ thống</h3>
          <span style={badgeStyle}>{visibleAlerts.length}</span>
        </div>

        <div style={controlsStyle}>
          {showTimestamp && (
            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
              {new Date().toLocaleTimeString('vi-VN')}
            </span>
          )}
          {collapsible && (
            <button
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className="alert-list">
          {visibleAlerts.map((alert, index) => (
            <div 
              key={index} 
              className="alert-item"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '8px',
                marginBottom: index < visibleAlerts.length - 1 ? '8px' : '0',
                border: `1px solid ${getAlertColor(alert)}20`,
                position: 'relative'
              }}
            >
              <div style={{ flexShrink: 0, marginTop: '2px' }}>
                {getAlertIcon(alert)}
              </div>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontWeight: '600', 
                  color: '#1f2937',
                  marginBottom: '4px'
                }}>
                  {alert.sensor}
                </div>
                <div style={{ 
                  color: '#4b5563',
                  fontSize: '0.9rem',
                  lineHeight: '1.4'
                }}>
                  {alert.message}
                </div>
                {alert.timestamp && showTimestamp && (
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#6b7280',
                    marginTop: '4px'
                  }}>
                    {new Date(alert.timestamp).toLocaleString('vi-VN')}
                  </div>
                )}
              </div>

              <button
                onClick={() => dismissAlert(alerts.findIndex(a => a === alert))}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#6b7280',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f3f4f6';
                  e.target.style.color = '#1f2937';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#6b7280';
                }}
                title="Đóng cảnh báo"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default AlertPanel;