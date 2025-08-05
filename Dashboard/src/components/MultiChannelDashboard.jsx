// src/MultiChannelDashboard.jsx - Dashboard chính với navigation đa kênh  
import React, { useState } from 'react';
import ThingSpeakDashboard from './ThingSpeakDashboard';
import SimpleChannelDetail from './SimpleChannelDetail';


const MultiChannelDashboard = () => {
  const [currentView, setCurrentView] = useState('main'); // 'main' hoặc 'detail'
  const [selectedChannel, setSelectedChannel] = useState(null);

  const handleSelectChannel = (channelInfo) => {
    console.log('Selected channel:', channelInfo); // Debug log
    setSelectedChannel(channelInfo);
    setCurrentView('detail');
  };

  const handleBackToMain = () => {
    setCurrentView('main');
    setSelectedChannel(null);
  };

  return (
    <div>
      {currentView === 'main' && (
        <ThingSpeakDashboard onSelectChannel={handleSelectChannel} />
      )}
      
      {currentView === 'detail' && selectedChannel && (
        <SimpleChannelDetail 
          channelInfo={selectedChannel}
          onBack={handleBackToMain}
        />
      )}
    </div>
  );
};

export default MultiChannelDashboard;
