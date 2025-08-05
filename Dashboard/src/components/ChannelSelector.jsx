// src/ChannelSelector.jsx - Dropdown chọn kênh ở góc phải
import React, { useState } from 'react';
import { ChevronDown, Database, Wifi, WifiOff } from 'lucide-react';

const ChannelSelector = ({ channels, onSelectChannel }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!channels || channels.length === 0) return null;

  const getChannelStatus = (channel) => {
    return channel.feeds && channel.feeds.length > 0 ? 'online' : 'offline';
  };

  const onlineCount = channels.filter(c => getChannelStatus(c) === 'online').length;
  const offlineCount = channels.length - onlineCount;

  const handleChannelSelect = (channel) => {
    setIsOpen(false);
    if (onSelectChannel) {
      onSelectChannel({
        channel: channel.channelId,
        apiKey: channel.apiKey,
        name: channel.channelInfo?.name || `Channel ${channel.channelId}`
      });
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="control-btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minWidth: '160px',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Database size={16} />
          <span>Kênh ({channels.length})</span>
        </div>
        <ChevronDown 
          size={14} 
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10
            }}
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '4px',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
              border: '1px solid #e5e7eb',
              minWidth: '320px',
              maxWidth: '400px',
              maxHeight: '400px',
              overflowY: 'auto',
              zIndex: 20,
              animation: 'slideDown 0.2s ease-out'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #f3f4f6',
              backgroundColor: '#f9fafb',
              borderRadius: '12px 12px 0 0'
            }}>
              <h4 style={{
                margin: '0 0 8px 0',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#1f2937'
              }}>
                📡 Chọn kênh để xem chi tiết
              </h4>
              
              {/* Status Summary */}
              <div style={{
                display: 'flex',
                gap: '12px',
                fontSize: '0.8rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#16a34a'
                }}>
                  <Wifi size={12} />
                  <span>{onlineCount} online</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#dc2626'
                }}>
                  <WifiOff size={12} />
                  <span>{offlineCount} offline</span>
                </div>
              </div>
            </div>

            {/* Channel List */}
            <div style={{ padding: '8px' }}>
              {channels.map((channel, index) => {
                const status = getChannelStatus(channel);
                const statusColor = status === 'online' ? '#16a34a' : '#dc2626';
                const statusBg = status === 'online' ? '#dcfce7' : '#fef2f2';
                
                return (
                  <div
                    key={`channel-${channel.channelId}-${index}`}
                    onClick={() => handleChannelSelect(channel)}
                    style={{
                      padding: '12px',
                      margin: '4px 0',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      border: `1px solid ${status === 'online' ? '#16a34a20' : '#dc262620'}`,
                      borderLeft: `3px solid ${statusColor}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#f9fafb';
                      e.target.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'white';
                      e.target.style.transform = 'translateX(0)';
                    }}
                  >
                    <div>
                      <div style={{
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: '#1f2937',
                        marginBottom: '2px'
                      }}>
                        📡 Kênh {channel.channelId}
                      </div>
                      
                      {channel.channelInfo?.name && (
                        <div style={{
                          fontSize: '0.8rem',
                          color: '#6b7280',
                          marginBottom: '2px'
                        }}>
                          {channel.channelInfo.name}
                        </div>
                      )}
                      
                      <div style={{
                        fontSize: '0.7rem',
                        color: '#9ca3af'
                      }}>
                        {channel.feeds?.length || 0} records • 
                        {channel.error ? ' Error' : ' Active'}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div style={{
                      padding: '4px 8px',
                      backgroundColor: statusBg,
                      color: statusColor,
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {status === 'online' ? <Wifi size={10} /> : <WifiOff size={10} />}
                      {status === 'online' ? 'Online' : 'Offline'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid #f3f4f6',
              backgroundColor: '#f9fafb',
              borderRadius: '0 0 12px 12px',
              fontSize: '0.75rem',
              color: '#6b7280',
              textAlign: 'center'
            }}>
              💡 Click kênh để xem chi tiết với animation 30s
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
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

export default ChannelSelector;