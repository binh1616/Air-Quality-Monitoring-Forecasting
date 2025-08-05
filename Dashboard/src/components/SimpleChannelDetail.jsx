// src/SimpleChannelDetail.jsx - Final version với MultiSensorChartView chuyên biệt
import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, AlertTriangle, ArrowLeft, Calendar, Filter, Download, Settings, BarChart3, TrendingUp } from 'lucide-react';
import { SENSOR_CONFIG } from '../utils/sensorConfig';
import { getValueColorAndStatus } from '../utils/thresholds';
import AlertPanel from './AlertPanel';
import MultiSensorChartView from './MultiSensorChartView';

// ===== SENSOR LEGENDS CONFIGURATION =====
const SENSOR_LEGENDS = {
  field1: { // Temperature
    title: "Nhiệt độ",
    unit: "°C",
    levels: [
      { label: "Đông băng", range: "< 0°C", color: "#1e3a8a" },
      { label: "Rất lạnh", range: "0 - 10°C", color: "#3b82f6" },
      { label: "Lạnh", range: "10.1 - 20°C", color: "#60a5fa" },
      { label: "Thoải mái", range: "20.1 - 25°C", color: "#22c55e" },
      { label: "Ấm", range: "25.1 - 30°C", color: "#eab308" },
      { label: "Nóng", range: "30.1 - 35°C", color: "#f97316" },
      { label: "Rất nóng", range: "35.1 - 40°C", color: "#ef4444" },
      { label: "Nguy hiểm", range: "> 40°C", color: "#7f1d1d" }
    ]
  },
  field2: { // Humidity
    title: "Độ ẩm",
    unit: "%",
    levels: [
      { label: "Rất khô", range: "< 20%", color: "#7f1d1d" },
      { label: "Khô", range: "20 - 30%", color: "#ef4444" },
      { label: "Hơi khô", range: "30.1 - 40%", color: "#f97316" },
      { label: "Thoải mái", range: "40.1 - 60%", color: "#22c55e" },
      { label: "Hơi ẩm", range: "60.1 - 70%", color: "#eab308" },
      { label: "Ẩm", range: "70.1 - 80%", color: "#3b82f6" },
      { label: "Rất ẩm", range: "80.1 - 90%", color: "#1e40af" },
      { label: "Quá ẩm", range: "> 90%", color: "#1e3a8a" }
    ]
  },
  field3: { // MQ7 Raw
    title: "MQ7 Raw",
    unit: "",
    levels: [
      { label: "An toàn", range: "< 300", color: "#22c55e" },
      { label: "Bình thường", range: "300 - 600", color: "#84cc16" },
      { label: "Chú ý", range: "600 - 900", color: "#eab308" },
      { label: "Cảnh báo", range: "900 - 1200", color: "#f97316" },
      { label: "Nguy hiểm", range: "1200 - 1500", color: "#ef4444" },
      { label: "Rất nguy hiểm", range: "> 1500", color: "#7f1d1d" }
    ]
  },
  field4: { // CO (ppm)
    title: "CO (ppm)",
    unit: "ppm",
    levels: [
      { label: "An toàn", range: "< 10 ppm", color: "#22c55e" },
      { label: "Bình thường", range: "10 - 30 ppm", color: "#84cc16" },
      { label: "Chú ý", range: "30 - 50 ppm", color: "#eab308" },
      { label: "Cảnh báo", range: "50 - 100 ppm", color: "#f97316" },
      { label: "Nguy hiểm", range: "100 - 200 ppm", color: "#ef4444" },
      { label: "Rất nguy hiểm", range: "> 200 ppm", color: "#7f1d1d" }
    ]
  },
  field5: { // MQ2 Raw
    title: "MQ2 Raw",
    unit: "",
    levels: [
      { label: "An toàn", range: "< 300", color: "#22c55e" },
      { label: "Bình thường", range: "300 - 600", color: "#84cc16" },
      { label: "Chú ý", range: "600 - 900", color: "#eab308" },
      { label: "Cảnh báo", range: "900 - 1200", color: "#f97316" },
      { label: "Nguy hiểm", range: "1200 - 1500", color: "#ef4444" },
      { label: "Rất nguy hiểm", range: "> 1500", color: "#7f1d1d" }
    ]
  },
  field6: { // LPG
    title: "LPG",
    unit: "",
    levels: [
      { label: "An toàn", range: "< 300", color: "#22c55e" },
      { label: "Bình thường", range: "300 - 600", color: "#84cc16" },
      { label: "Chú ý", range: "600 - 900", color: "#eab308" },
      { label: "Cảnh báo", range: "900 - 1200", color: "#f97316" },
      { label: "Nguy hiểm", range: "1200 - 1500", color: "#ef4444" },
      { label: "Rất nguy hiểm", range: "> 1500", color: "#7f1d1d" }
    ]
  },
  field7: { // Smoke
    title: "Smoke",
    unit: "",
    levels: [
      { label: "An toàn", range: "< 300", color: "#22c55e" },
      { label: "Bình thường", range: "300 - 600", color: "#84cc16" },
      { label: "Chú ý", range: "600 - 900", color: "#eab308" },
      { label: "Cảnh báo", range: "900 - 1200", color: "#f97316" },
      { label: "Nguy hiểm", range: "1200 - 1500", color: "#ef4444" },
      { label: "Rất nguy hiểm", range: "> 1500", color: "#7f1d1d" }
    ]
  },
  field8: { // Dust Sensor
    title: "Dust Sensor",
    unit: "μg/m³",
    levels: [
      { label: "Tốt", range: "< 12 μg/m³", color: "#22c55e" },
      { label: "Trung bình", range: "12 - 35 μg/m³", color: "#84cc16" },
      { label: "Nhạy cảm", range: "35 - 55 μg/m³", color: "#eab308" },
      { label: "Có hại", range: "55 - 150 μg/m³", color: "#f97316" },
      { label: "Rất có hại", range: "150 - 250 μg/m³", color: "#ef4444" },
      { label: "Nguy hiểm", range: "> 250 μg/m³", color: "#7f1d1d" }
    ]
  }
};

// Enhanced function để lấy màu theo sensor cụ thể
const getSensorSpecificColor = (value, fieldKey) => {
  const numValue = parseFloat(value);
  
  // Logic riêng cho từng sensor
  switch (fieldKey) {
    case 'field1': // Temperature
      if (numValue < 0) return '#1e3a8a';
      if (numValue <= 10) return '#3b82f6';
      if (numValue <= 20) return '#60a5fa';
      if (numValue <= 25) return '#22c55e';
      if (numValue <= 30) return '#eab308';
      if (numValue <= 35) return '#f97316';
      if (numValue <= 40) return '#ef4444';
      return '#7f1d1d';
      
    case 'field2': // Humidity
      if (numValue < 20) return '#7f1d1d';
      if (numValue <= 30) return '#ef4444';
      if (numValue <= 40) return '#f97316';
      if (numValue <= 60) return '#22c55e';
      if (numValue <= 70) return '#eab308';
      if (numValue <= 80) return '#3b82f6';
      if (numValue <= 90) return '#1e40af';
      return '#1e3a8a';
      
    case 'field4': // CO (ppm)
      if (numValue < 10) return '#22c55e';
      if (numValue <= 30) return '#84cc16';
      if (numValue <= 50) return '#eab308';
      if (numValue <= 100) return '#f97316';
      if (numValue <= 200) return '#ef4444';
      return '#7f1d1d';
      
    case 'field8': // Dust
      if (numValue < 12) return '#22c55e';
      if (numValue <= 35) return '#84cc16';
      if (numValue <= 55) return '#eab308';
      if (numValue <= 150) return '#f97316';
      if (numValue <= 250) return '#ef4444';
      return '#7f1d1d';
      
    default: // MQ sensors (field3, field5, field6, field7)
      if (numValue < 300) return '#22c55e';
      if (numValue <= 600) return '#84cc16';
      if (numValue <= 900) return '#eab308';
      if (numValue <= 1200) return '#f97316';
      if (numValue <= 1500) return '#ef4444';
      return '#7f1d1d';
  }
};

// Enhanced Legend Component
const SensorSpecificLegend = ({ fieldKey }) => {
  const legend = SENSOR_LEGENDS[fieldKey];
  if (!legend) return null;

  return (
    <div style={{
      marginTop: '12px',
      padding: '12px',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      border: '1px solid #e2e8f0'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <span style={{
          fontSize: '0.8rem',
          fontWeight: '600',
          color: '#374151'
        }}>
          📊 Thang đo {legend.title}
        </span>
        <span style={{
          fontSize: '0.7rem',
          color: '#6b7280',
          fontStyle: 'italic'
        }}>
          {legend.levels.length} mức độ
        </span>
      </div>

      {/* Color Bar */}
      <div style={{
        height: '8px',
        borderRadius: '4px',
        background: `linear-gradient(to right, ${legend.levels.map(level => level.color).join(', ')})`,
        marginBottom: '8px'
      }} />

      {/* Legend Items */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '4px',
        fontSize: '0.7rem'
      }}>
        {legend.levels.map((level, index) => (
          <div key={index} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '2px 4px'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: level.color,
              borderRadius: '2px',
              flexShrink: 0
            }} />
            <span style={{
              color: '#374151',
              fontWeight: '500'
            }}>
              {level.label}
            </span>
            <span style={{
              color: '#6b7280',
              fontSize: '0.65rem',
              marginLeft: 'auto'
            }}>
              {level.range}
            </span>
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <div style={{
        marginTop: '8px',
        padding: '4px 6px',
        backgroundColor: '#eff6ff',
        borderRadius: '4px',
        fontSize: '0.65rem',
        color: '#1e40af',
        textAlign: 'center'
      }}>
        💡 Màu sắc hiển thị theo thang chuẩn quốc tế cho {legend.title}
      </div>
    </div>
  );
};

const parseDateString = (dateStr, onFilterChange, filterKey, otherDate = null) => {
  // Remove any non-digit and non-slash characters
  const cleanStr = dateStr.replace(/[^\d\/]/g, '');
  
  // Auto-add slashes - thông minh hơn
  let formattedStr = cleanStr;
  if (cleanStr.length >= 2 && cleanStr.length <= 8 && !cleanStr.includes('/')) {
    if (cleanStr.length <= 2) {
      formattedStr = cleanStr;
    } else if (cleanStr.length <= 4) {
      formattedStr = cleanStr.slice(0, 2) + '/' + cleanStr.slice(2);
    } else {
      formattedStr = cleanStr.slice(0, 2) + '/' + cleanStr.slice(2, 4) + '/' + cleanStr.slice(4);
    }
  }
  
  const parts = formattedStr.split('/');
  
  // Validate and process only if we have all 3 parts
  if (parts.length === 3 && parts.every(part => part.length > 0)) {
    const dayStr = parts[0];
    const monthStr = parts[1];
    const yearStr = parts[2];
    
    // Parse numbers
    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);
    
    // Validate ranges
    const currentYear = new Date().getFullYear();
    const isValidDay = day >= 1 && day <= 31;
    const isValidMonth = month >= 1 && month <= 12;
    const isValidYear = year >= 2020 && year <= currentYear + 1;
    
    if (isValidDay && isValidMonth && isValidYear) {
      // Check if day is valid for the specific month/year
      const daysInMonth = new Date(year, month, 0).getDate();
      
      if (day <= daysInMonth) {
        // Format to ISO date
        const isoDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const testDate = new Date(isoDate);
        
        // Additional validation
        if (!isNaN(testDate.getTime()) && testDate <= new Date()) {
          // If this is "to" date, make sure it's not before "from" date
          if (filterKey === 'customDateTo' && otherDate) {
            const fromDate = new Date(otherDate);
            if (testDate >= fromDate) {
              onFilterChange(filterKey, isoDate);
              return { isValid: true, message: '✅ Ngày hợp lệ' };
            } else {
              return { isValid: false, message: '❌ Ngày kết thúc phải sau ngày bắt đầu' };
            }
          } else {
            onFilterChange(filterKey, isoDate);
            return { isValid: true, message: '✅ Ngày hợp lệ' };
          }
        }
      } else {
        const monthNames = ['', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                           'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
        return { isValid: false, message: `❌ ${monthNames[month]} năm ${year} chỉ có ${daysInMonth} ngày` };
      }
    } else {
      let errorMsg = '❌ ';
      if (!isValidDay) errorMsg += 'Ngày không hợp lệ (1-31). ';
      if (!isValidMonth) errorMsg += 'Tháng không hợp lệ (1-12). ';  
      if (!isValidYear) errorMsg += `Năm không hợp lệ (2020-${currentYear + 1}). `;
      return { isValid: false, message: errorMsg };
    }
  }
  
  // Progress feedback
  if (cleanStr.length === 0) {
    return { isValid: true, message: '' };
  } else if (cleanStr.length < 8) {
    return { isValid: false, message: `⏳ Đang nhập... (${cleanStr.length}/8 ký tự)` };
  }
  
  return { isValid: false, message: '⏳ Nhập đầy đủ dd/mm/yyyy' };
};

const DateInput = ({ 
  placeholder, 
  value, 
  filterKey, 
  onFilterChange, 
  otherDate, 
  label 
}) => {
  const [inputValue, setInputValue] = React.useState(
    value ? new Date(value).toLocaleDateString('vi-VN') : ''
  );
  const [validationResult, setValidationResult] = React.useState({ isValid: true, message: '' });

  // Sync with external value changes
  React.useEffect(() => {
    if (value) {
      setInputValue(new Date(value).toLocaleDateString('vi-VN'));
      setValidationResult({ isValid: true, message: '✅ Ngày hợp lệ' });
    } else {
      setInputValue('');
      setValidationResult({ isValid: true, message: '' });
    }
  }, [value]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    const result = parseDateString(newValue, onFilterChange, filterKey, otherDate);
    setValidationResult(result);
  };

  return (
    <div>
      <label style={{
        fontSize: '0.75rem',
        color: '#6b7280',
        marginBottom: '4px',
        display: 'block'
      }}>
        {label}:
      </label>
      <input
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        maxLength={10}
        style={{
          width: '100%',
          padding: '6px 8px',
          border: `2px solid ${validationResult.isValid ? '#d1d5db' : '#ef4444'}`,
          borderRadius: '4px',
          fontSize: '0.8rem',
          backgroundColor: validationResult.isValid ? 'white' : '#fef2f2',
          transition: 'all 0.2s ease'
        }}
      />
      {/* Validation Message */}
      <div style={{
        fontSize: '0.65rem',
        marginTop: '2px',
        color: validationResult.isValid ? '#059669' : '#dc2626',
        minHeight: '16px',
        fontWeight: '500'
      }}>
        {validationResult.message}
      </div>
    </div>
  );
};

// ===== FILTER PANEL COMPONENT =====
const FilterPanel = ({ filters, onFilterChange, isOpen, onToggle }) => {
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="control-btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <Filter size={16} />
        Bộ lọc
      </button>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      margin: '16px 0',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
      border: '1px solid #e5e7eb',
      width: '100%'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h4 style={{
          margin: 0,
          fontSize: '1.1rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Settings size={20} />
          Bộ lọc tương tác
        </h4>
        <button
          onClick={onToggle}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px'
          }}
        >
          ✕
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '30px',
        width: '100%'
      }}>
        {/* Column 1: Time Range, Display Count, Value Range */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '20px' 
        }}>
          {/* Time Range */}
          <div>
            <label style={{
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px',
              display: 'block'
            }}>
              ⏰ Khoảng thời gian:
            </label>
            <select
              value={filters.timeRange}
              onChange={(e) => onFilterChange('timeRange', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            >
              <option value="1hour">1 giờ qua</option>
              <option value="6hours">6 giờ qua</option>
              <option value="1day">24 giờ qua</option>
              <option value="3days">3 ngày qua</option>
              <option value="7days">7 ngày qua</option>
              <option value="1month">1 tháng qua</option>
              <option value="custom">📅 Tùy chọn ngày cụ thể</option>
            </select>

            {/* Enhanced Custom Date Range Picker */}
            {filters.timeRange === 'custom' && (
              <div style={{
                marginTop: '12px',
                padding: '12px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  marginBottom: '8px'
                }}>
                  <DateInput
                    placeholder="VD: 30/07/2025"
                    value={filters.customDateFrom}
                    filterKey="customDateFrom"
                    onFilterChange={onFilterChange}
                    otherDate={null}
                    label="📅 Từ ngày (dd/mm/yyyy)"
                  />
                  <DateInput
                    placeholder="VD: 01/08/2025"
                    value={filters.customDateTo}
                    filterKey="customDateTo"
                    onFilterChange={onFilterChange}
                    otherDate={filters.customDateFrom}
                    label="📅 Đến ngày (dd/mm/yyyy)"
                  />
                </div>

                {/* Smart Quick Select Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '6px',
                  flexWrap: 'wrap',
                  marginBottom: '8px'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      const yesterday = new Date(today);
                      yesterday.setDate(today.getDate() - 1);
                      onFilterChange('customDateFrom', yesterday.toISOString().split('T')[0]);
                      onFilterChange('customDateTo', yesterday.toISOString().split('T')[0]);
                    }}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.7rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    📅 Hôm qua
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      const weekAgo = new Date(today);
                      weekAgo.setDate(today.getDate() - 7);
                      onFilterChange('customDateFrom', weekAgo.toISOString().split('T')[0]);
                      onFilterChange('customDateTo', today.toISOString().split('T')[0]);
                    }}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.7rem',
                      backgroundColor: '#16a34a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    📅 7 ngày qua
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      const monthAgo = new Date(today);
                      monthAgo.setMonth(today.getMonth() - 1);
                      onFilterChange('customDateFrom', monthAgo.toISOString().split('T')[0]);
                      onFilterChange('customDateTo', today.toISOString().split('T')[0]);
                    }}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.7rem',
                      backgroundColor: '#7c3aed',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    📅 30 ngày qua
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // This month
                      const today = new Date();
                      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                      onFilterChange('customDateFrom', firstDayOfMonth.toISOString().split('T')[0]);
                      onFilterChange('customDateTo', today.toISOString().split('T')[0]);
                    }}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.7rem',
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    📅 Tháng này
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Specific example: 30/7 → 1/8
                      onFilterChange('customDateFrom', '2025-07-30');
                      onFilterChange('customDateTo', '2025-08-01');
                    }}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.7rem',
                      backgroundColor: '#ec4899',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    📊 30/7 → 1/8
                  </button>
                </div>

                {/* Enhanced Date Preview */}
                {filters.customDateFrom && filters.customDateTo && (
                  <div style={{
                    padding: '8px 10px',
                    backgroundColor: '#eff6ff',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    color: '#1d4ed8',
                    border: '1px solid #bae6fd'
                  }}>
                    📊 <strong>Xem data từ:</strong> {new Date(filters.customDateFrom).toLocaleDateString('vi-VN')} 
                    → {new Date(filters.customDateTo).toLocaleDateString('vi-VN')}
                    {filters.customDateFrom === filters.customDateTo && (
                      <span style={{ color: '#059669', fontWeight: 'bold' }}> (chỉ 1 ngày)</span>
                    )}
                    {(() => {
                      const start = new Date(filters.customDateFrom);
                      const end = new Date(filters.customDateTo);
                      const diffTime = Math.abs(end - start);
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                      return (
                        <span style={{ color: '#7c3aed', fontWeight: 'bold' }}>
                          • Tổng: {diffDays} ngày
                          {diffDays > 30 && <span style={{ color: '#dc2626' }}> ⚠️ (Dữ liệu nhiều)</span>}
                        </span>
                      );
                    })()}
                  </div>
                )}

                {/* Enhanced Helper Text */}
                <div style={{
                  fontSize: '0.7rem',
                  color: '#9ca3af',
                  marginTop: '6px',
                  fontStyle: 'italic',
                  backgroundColor: '#f9fafb',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: '1px solid #e5e7eb'
                }}>
                  💡 <strong>Cách nhập nhanh:</strong><br />
                  • Gõ <code style={{backgroundColor: '#e5e7eb', padding: '1px 3px', borderRadius: '2px'}}>30072025</code> → Tự động thành <strong>30/07/2025</strong><br />
                  • Hoặc gõ từng phần: <code style={{backgroundColor: '#e5e7eb', padding: '1px 3px', borderRadius: '2px'}}>30/07/2025</code><br />
                  🔄 <strong>Kiểm tra tự động:</strong> Ngày 1-31, Tháng 1-12, Năm 2020-{new Date().getFullYear() + 1}<br />
                  📅 <strong>Lưu ý:</strong> Ngày phải ≤ hôm nay, ngày kết thúc ≥ ngày bắt đầu
                </div>
              </div>
            )}
          </div>

          {/* Display Count - Enhanced */}
          <div>
            <label style={{
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '10px',
              display: 'block'
            }}>
              📊 Số lượng hiển thị:
            </label>
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <select
                value={filters.displayCount}
                onChange={(e) => onFilterChange('displayCount', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  backgroundColor: 'white',
                  marginBottom: '8px'
                }}
              >
                <option value={5}>5 records (nhanh)</option>
                <option value={10}>10 records (chuẩn)</option>
                <option value={15}>15 records (khuyến nghị)</option>
                <option value={20}>20 records (chi tiết)</option>
                <option value={25}>25 records (nhiều)</option>
                <option value={50}>50 records (tối đa)</option>
              </select>
              
              {/* Quick Count Buttons */}
              <div style={{
                display: 'flex',
                gap: '6px',
                flexWrap: 'wrap',
                marginBottom: '8px'
              }}>
                {[5, 10, 15, 20, 25, 50].map(count => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => onFilterChange('displayCount', count)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '0.7rem',
                      backgroundColor: filters.displayCount === count ? '#3b82f6' : '#e5e7eb',
                      color: filters.displayCount === count ? 'white' : '#374151',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: filters.displayCount === count ? '600' : '400'
                    }}
                  >
                    {count}
                  </button>
                ))}
              </div>

              {/* Display Info */}
              <div style={{
                padding: '6px 8px',
                backgroundColor: '#eff6ff',
                borderRadius: '4px',
                fontSize: '0.7rem',
                color: '#1e40af',
                border: '1px solid #bae6fd'
              }}>
                📈 <strong>Hiển thị:</strong> {filters.displayCount} records mới nhất cho mỗi sensor
                {filters.displayCount >= 25 && (
                  <span style={{ color: '#dc2626' }}> • ⚠️ Có thể chậm</span>
                )}
              </div>
            </div>
          </div>

          {/* Value Range Filter - Enhanced */}
          <div>
            <label style={{
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '10px',
              display: 'block'
            }}>
              🔢 Phạm vi giá trị:
            </label>
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    marginBottom: '4px',
                    display: 'block',
                    fontWeight: '500'
                  }}>
                    📉 Giá trị tối thiểu:
                  </label>
                  <input
                    type="number"
                    placeholder="VD: 0"
                    value={filters.minValue}
                    onChange={(e) => onFilterChange('minValue', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    marginBottom: '4px',
                    display: 'block',
                    fontWeight: '500'
                  }}>
                    📈 Giá trị tối đa:
                  </label>
                  <input
                    type="number"
                    placeholder="VD: 100"
                    value={filters.maxValue}
                    onChange={(e) => onFilterChange('maxValue', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
              </div>
              
              {/* Quick Range Buttons */}
              <div style={{
                display: 'flex',
                gap: '6px',
                flexWrap: 'wrap',
                marginBottom: '8px'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    onFilterChange('minValue', '');
                    onFilterChange('maxValue', '');
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.7rem',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  🔄 Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onFilterChange('minValue', '20');
                    onFilterChange('maxValue', '30');
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.7rem',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  🌡️ Nhiệt độ thường
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onFilterChange('minValue', '40');
                    onFilterChange('maxValue', '80');
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.7rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  💧 Độ ẩm thường
                </button>
              </div>

              {/* Range Status */}
              {(filters.minValue !== '' || filters.maxValue !== '') && (
                <div style={{
                  padding: '6px 8px',
                  backgroundColor: '#fef3c7',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  color: '#92400e',
                  border: '1px solid #fbbf24'
                }}>
                  🎯 <strong>Lọc theo:</strong>{' '}
                  {filters.minValue !== '' && `≥ ${filters.minValue}`}
                  {filters.minValue !== '' && filters.maxValue !== '' && ' và '}
                  {filters.maxValue !== '' && `≤ ${filters.maxValue}`}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Quick Filters, Sensor Selection, Reset */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '20px' 
        }}>
          {/* Sensor Selection - Enhanced */}
          <div>
            <label style={{
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '10px',
              display: 'block'
            }}>
              🎛️ Chọn sensors để hiển thị:
            </label>
            
            {/* Sensor Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '6px',
              marginBottom: '12px'
            }}>
              {Object.entries(SENSOR_CONFIG).map(([fieldKey, config]) => {
                const isSelected = filters.selectedSensors[fieldKey] || false;
                return (
                  <label
                    key={fieldKey}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      backgroundColor: isSelected ? '#eff6ff' : '#f9fafb',
                      border: `2px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      minHeight: '40px',
                      fontSize: '0.75rem'
                    }}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => onFilterChange('selectedSensors', {
                        ...filters.selectedSensors,
                        [fieldKey]: e.target.checked
                      })}
                      style={{ 
                        cursor: 'pointer', 
                        width: '14px', 
                        height: '14px',
                        accentColor: '#3b82f6'
                      }}
                    />
                    
                    {/* Icon */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '18px',
                      height: '18px',
                      borderRadius: '3px',
                      backgroundColor: isSelected ? '#3b82f6' : '#6b7280',
                      color: 'white'
                    }}>
                      <config.icon size={10} />
                    </div>
                    
                    {/* Text Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        color: isSelected ? '#1e40af' : '#374151',
                        marginBottom: '1px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {config.name}
                      </div>
                      <div style={{
                        fontSize: '0.6rem',
                        color: '#6b7280',
                        fontStyle: 'italic'
                      }}>
                        {fieldKey}
                      </div>
                    </div>
                    
                    {/* Selected Indicator */}
                    {isSelected && (
                      <div style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.5rem',
                        color: 'white',
                        fontWeight: 'bold'
                      }}>
                        ✓
                      </div>
                    )}
                  </label>
                );
              })}
            </div>

            {/* Quick Select Buttons */}
            <div style={{
              display: 'flex',
              gap: '6px',
              marginBottom: '12px',
              flexWrap: 'wrap'
            }}>
              <button
                type="button"
                onClick={() => {
                  const allSelected = {};
                  Object.keys(SENSOR_CONFIG).forEach(key => {
                    allSelected[key] = true;
                  });
                  onFilterChange('selectedSensors', allSelected);
                }}
                style={{
                  padding: '4px 12px',
                  fontSize: '0.7rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                ✅ Tất cả
              </button>
              
              <button
                type="button"
                onClick={() => {
                  const noneSelected = {};
                  Object.keys(SENSOR_CONFIG).forEach(key => {
                    noneSelected[key] = false;
                  });
                  onFilterChange('selectedSensors', noneSelected);
                }}
                style={{
                  padding: '4px 12px',
                  fontSize: '0.7rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                ❌ Không
              </button>
              
              <button
                type="button"
                onClick={() => {
                  // Select common sensors (field1, field2, field4, field8)
                  const commonSelected = {
                    field1: true,  // Temperature
                    field2: true,  // Humidity  
                    field3: false,
                    field4: true,  // CO
                    field5: false,
                    field6: false,
                    field7: false,
                    field8: true   // Dust
                  };
                  onFilterChange('selectedSensors', commonSelected);
                }}
                style={{
                  padding: '4px 12px',
                  fontSize: '0.7rem',
                  backgroundColor: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                🔥 Phổ biến
              </button>
            </div>

            {/* Selection Summary */}
            <div style={{
              padding: '10px 12px',
              backgroundColor: '#f0fdf4',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: '#166534',
              border: '1px solid #bbf7d0'
            }}>
              <strong>📊 Đã chọn:</strong>{' '}
              <span style={{ fontWeight: '600' }}>
                {Object.values(filters.selectedSensors).filter(Boolean).length}
              </span>
              /{Object.keys(SENSOR_CONFIG).length} sensors
              
              {/* Selected Sensors List */}
              {Object.values(filters.selectedSensors).filter(Boolean).length > 0 && (
                <div style={{ marginTop: '6px' }}>
                  <strong>🎯 Hiển thị:</strong>{' '}
                  {Object.entries(filters.selectedSensors)
                    .filter(([key, selected]) => selected)
                    .map(([fieldKey, _]) => SENSOR_CONFIG[fieldKey]?.name)
                    .join(', ')
                  }
                </div>
              )}
              
              {Object.values(filters.selectedSensors).filter(Boolean).length === 0 && (
                <div style={{ 
                  marginTop: '6px', 
                  color: '#dc2626', 
                  fontWeight: '600' 
                }}>
                  ⚠️ Chưa chọn sensor nào - Không có dữ liệu hiển thị!
                </div>
              )}
            </div>
          </div>

          {/* Reset Button - Enhanced */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end'
          }}>
            <div style={{
              backgroundColor: '#fef2f2',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #fecaca',
              width: '100%'
            }}>
              <button
                onClick={() => onFilterChange('reset')}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}
              >
                <RefreshCw size={16} />
                🔄 Reset tất cả bộ lọc
              </button>
              <div style={{
                fontSize: '0.7rem',
                color: '#dc2626',
                textAlign: 'center',
                fontStyle: 'italic'
              }}>
                Khôi phục về cài đặt mặc định
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Summary - Enhanced */}
      <div style={{
        marginTop: '20px',
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        borderRadius: '8px',
        fontSize: '0.8rem',
        color: '#0c4a6e',
        border: '2px solid #0ea5e9',
        boxShadow: '0 2px 4px rgba(14, 165, 233, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: '#0ea5e9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.7rem'
          }}>
            📊
          </div>
          <strong style={{ fontSize: '0.9rem' }}>Tóm tắt bộ lọc hiện tại:</strong>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '8px'
        }}>
          <div>
            <strong>🔢 Hiển thị:</strong> {filters.displayCount} records
          </div>
          <div>
            <strong>⏰ Thời gian:</strong>{' '}
            {filters.timeRange === 'custom' && filters.customDateFrom && filters.customDateTo ? (
              <>
                {filters.customDateFrom === filters.customDateTo ? 
                  `Ngày ${new Date(filters.customDateFrom).toLocaleDateString('vi-VN')}` :
                  `${new Date(filters.customDateFrom).toLocaleDateString('vi-VN')} - ${new Date(filters.customDateTo).toLocaleDateString('vi-VN')}`
                }
              </>
            ) : (
              <>
                {filters.timeRange.replace('1hour', '1 giờ').replace('6hours', '6 giờ').replace('1day', '1 ngày').replace('3days', '3 ngày').replace('7days', '7 ngày').replace('1month', '1 tháng')}
              </>
            )}
          </div>
          <div>
            <strong>🎛️ Sensors:</strong> {Object.values(filters.selectedSensors).filter(Boolean).length}/{Object.keys(SENSOR_CONFIG).length}
          </div>
          <div>
            <strong>⚡ Bộ lọc:</strong>{' '}
            {filters.onlyAnomalies || filters.excludeZeros || (filters.minValue !== '' || filters.maxValue !== '') ? (
              <>
                {filters.onlyAnomalies && '🚨 Bất thường '}
                {filters.excludeZeros && '🚫 Loại 0 '}
                {(filters.minValue !== '' || filters.maxValue !== '') && '📊 Phạm vi '}
              </>
            ) : (
              'Không có'
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== SENSOR LINEAR HEATMAP COMPONENT =====
const SensorLinearHeatmap = ({ title, data, unit, min, max, thresholdType, displayCount, fieldKey }) => {
  const getSensorColor = (value) => {
    return getSensorSpecificColor(value, fieldKey);
  };

  const getOptimalTextColor = (backgroundColor) => {
    const darkColors = ['#1e3a8a', '#1e40af', '#7f1d1d', '#ef4444', '#f97316'];
    const lightColors = ['#22c55e', '#84cc16', '#eab308', '#60a5fa'];
    
    if (darkColors.includes(backgroundColor)) {
      return '#ffffff';
    } else if (lightColors.includes(backgroundColor)) {
      return '#000000';
    }
    
    // Fallback to luminance calculation
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.55 ? '#000000' : '#ffffff';
  };

  const displayData = data.slice(-displayCount);

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
          {title}
        </h3>
        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
          Min: <strong style={{ color: '#059669' }}>{min.toFixed(1)}{unit}</strong> 
          {' '}Max: <strong style={{ color: '#dc2626' }}>{max.toFixed(1)}{unit}</strong>
          {' '}Avg: <strong style={{ color: '#7c3aed' }}>{((min + max) / 2).toFixed(1)}{unit}</strong>
          {' '}({displayData.length} records)
        </div>
      </div>

      {/* Responsive Linear Heatmap */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(displayCount, 20)}, 1fr)`,
        gap: '2px',
        marginBottom: '12px'
      }}>
        {displayData.map((value, index) => {
          const bgColor = getSensorColor(value);
          const textColor = getOptimalTextColor(bgColor);
          
          return (
            <div
              key={index}
              style={{
                backgroundColor: bgColor,
                color: textColor,
                padding: displayCount > 15 ? '6px 3px' : '8px 4px',
                borderRadius: '6px',
                textAlign: 'center',
                fontSize: displayCount > 15 ? '0.65rem' : '0.75rem',
                fontWeight: '700',
                minHeight: displayCount > 15 ? '45px' : '55px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                textShadow: textColor === '#ffffff' ? '1px 1px 2px rgba(0,0,0,0.8)' : '1px 1px 2px rgba(255,255,255,0.8)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.1)';
                e.target.style.zIndex = '10';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                e.target.style.border = '2px solid #ffffff';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.zIndex = '1';
                e.target.style.boxShadow = 'none';
                e.target.style.border = '1px solid rgba(255,255,255,0.2)';
              }}
              title={`${value.toFixed(1)}${unit} - Record ${displayData.length - index}`}
            >
              <div style={{
                fontWeight: '800',
                textShadow: 'inherit'
              }}>
                {value.toFixed(1)}{unit}
              </div>
              {displayCount <= 15 && (
                <div style={{ 
                  fontSize: '0.55rem', 
                  opacity: 0.9,
                  marginTop: '2px',
                  fontWeight: '600',
                  textShadow: 'inherit'
                }}>
                  #{displayData.length - index}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Enhanced Sensor-Specific Legend */}
      <SensorSpecificLegend fieldKey={fieldKey} />
    </div>
  );
};

// ===== MAIN COMPONENT =====
const SimpleChannelDetail = ({ channelInfo, onBack }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('heatmap'); // 'heatmap' hoặc 'charts'
  
  // Filter states
  const [filters, setFilters] = useState({
    timeRange: '1day',
    customDateFrom: '',
    customDateTo: '',
    displayCount: 15,
    minValue: '',
    maxValue: '',
    selectedSensors: {
      field1: true,
      field2: true,
      field3: false,
      field4: true,
      field5: false,
      field6: false,
      field7: false,
      field8: true
    },
    onlyAnomalies: false,
    excludeZeros: true
  });

  const handleFilterChange = (key, value) => {
    if (key === 'reset') {
      setFilters({
        timeRange: '1day',
        customDateFrom: '',
        customDateTo: '',
        displayCount: 15,
        minValue: '',
        maxValue: '',
        selectedSensors: {
          field1: true,
          field2: true,
          field3: false,
          field4: true,
          field5: false,
          field6: false,
          field7: false,
          field8: true
        },
        onlyAnomalies: false,
        excludeZeros: true
      });
    } else {
      setFilters(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };

  // Get results count based on time range
  const getResultsCount = () => {
    switch (filters.timeRange) {
      case '1hour': return 60;
      case '6hours': return 360;
      case '1day': return 1440;
      case '3days': return 4320;
      case '7days': return 2016;
      case '1month': return 8000;
      default: return 100;
    }
  };

  const fetchChannelData = async () => {
    try {
      setLoading(true);
      setError(null);

      let apiUrl = `https://api.thingspeak.com/channels/${channelInfo.channel}/feeds.json?api_key=${channelInfo.apiKey}`;
      
      // Handle custom date range
      if (filters.timeRange === 'custom' && filters.customDateFrom && filters.customDateTo) {
        const startDate = new Date(filters.customDateFrom);
        const endDate = new Date(filters.customDateTo);
        endDate.setHours(23, 59, 59, 999); // Set to end of day
        
        apiUrl += `&start=${startDate.toISOString()}&end=${endDate.toISOString()}`;
        
        // For custom date, we might get a lot of data, so we limit results
        const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        const maxResults = Math.min(8000, daysDiff * 288); // Max ~288 records per day (5min intervals)
        apiUrl += `&results=${maxResults}`;
      } else {
        // Use regular time-based results
        const results = getResultsCount();
        apiUrl += `&results=${results}`;
      }

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rawData = await response.json();
      
      if (!rawData.feeds || rawData.feeds.length === 0) {
        setError('Không có dữ liệu trong khoảng thời gian đã chọn');
        return;
      }

      setData(rawData);
      setLastUpdate(new Date());
      setCountdown(30);

    } catch (err) {
      setError(`Lỗi tải dữ liệu: ${err.message}`);
      console.error('Error fetching channel data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (channelInfo) {
      fetchChannelData();
    }
  }, [channelInfo, filters.timeRange, filters.customDateFrom, filters.customDateTo]);

  // Auto refresh
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchChannelData();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [channelInfo]);

  // Filter data based on current filters
  const filteredData = React.useMemo(() => {
    if (!data || !data.feeds) return {};

    let feeds = [...data.feeds];

    // Apply value range filter
    if (filters.minValue !== '' || filters.maxValue !== '') {
      const minVal = filters.minValue !== '' ? parseFloat(filters.minValue) : -Infinity;
      const maxVal = filters.maxValue !== '' ? parseFloat(filters.maxValue) : Infinity;

      feeds = feeds.filter(feed => {
        return Object.keys(filters.selectedSensors)
          .filter(key => filters.selectedSensors[key])
          .some(fieldKey => {
            const value = parseFloat(feed[fieldKey]) || 0;
            return value >= minVal && value <= maxVal;
          });
      });
    }

    // Apply exclude zeros
    if (filters.excludeZeros) {
      feeds = feeds.filter(feed => {
        return Object.keys(filters.selectedSensors)
          .filter(key => filters.selectedSensors[key])
          .some(fieldKey => {
            const value = parseFloat(feed[fieldKey]) || 0;
            return value > 0;
          });
      });
    }

    // Apply anomalies filter
    if (filters.onlyAnomalies) {
      feeds = feeds.filter(feed => {
        return Object.keys(filters.selectedSensors)
          .filter(key => filters.selectedSensors[key])
          .some(fieldKey => {
            const config = SENSOR_CONFIG[fieldKey];
            const value = parseFloat(feed[fieldKey]) || 0;
            
            if (config && config.alertLevels) {
              return value >= config.alertLevels.caution;
            }
            return false;
          });
      });
    }

    // Process data for heatmaps
    const processedData = {};
    Object.keys(filters.selectedSensors)
      .filter(fieldKey => filters.selectedSensors[fieldKey])
      .forEach(fieldKey => {
        const values = feeds.map(feed => parseFloat(feed[fieldKey]) || 0).filter(v => v > 0);
        if (values.length > 0) {
          processedData[fieldKey] = {
            values,
            min: Math.min(...values),
            max: Math.max(...values),
            latest: values[values.length - 1]
          };
        }
      });

    return processedData;
  }, [data, filters]);

  // Create chart data for selected sensors
  const chartData = React.useMemo(() => {
    if (!data || !data.feeds) return [];

    return data.feeds.slice(-filters.displayCount * 2).map((feed, index) => {
      const timeLabel = new Date(feed.created_at).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      });

      const dataPoint = { 
        time: timeLabel, 
        timestamp: feed.created_at,
        index: index
      };

      // Add selected sensor data with proper mapping
      Object.keys(filters.selectedSensors).forEach(fieldKey => {
        if (filters.selectedSensors[fieldKey]) {
          // Map field names to chart-friendly names
          switch (fieldKey) {
            case 'field1':
              dataPoint.temp = parseFloat(feed[fieldKey]) || 0;
              break;
            case 'field2':
              dataPoint.humidity = parseFloat(feed[fieldKey]) || 0;
              break;
            case 'field3':
              dataPoint.mq7Raw = parseFloat(feed[fieldKey]) || 0;
              break;
            case 'field4':
              dataPoint.mq7CO = parseFloat(feed[fieldKey]) || 0;
              break;
            case 'field5':
              dataPoint.mq2Raw = parseFloat(feed[fieldKey]) || 0;
              break;
            case 'field6':
              dataPoint.lpg = parseFloat(feed[fieldKey]) || 0;
              break;
            case 'field7':
              dataPoint.smoke = parseFloat(feed[fieldKey]) || 0;
              break;
            case 'field8':
              dataPoint.dust = parseFloat(feed[fieldKey]) || 0;
              break;
          }
        }
      });

      return dataPoint;
    });
  }, [data, filters]);

  // Convert selectedSensors from field keys to chart keys for MultiSensorChartView
  const chartSelectedSensors = React.useMemo(() => {
    return {
      temp: filters.selectedSensors.field1 || false,
      humidity: filters.selectedSensors.field2 || false,
      mq7CO: filters.selectedSensors.field4 || false,
      dust: filters.selectedSensors.field8 || false
    };
  }, [filters.selectedSensors]);

  // Export data function
  const exportData = () => {
    if (!data || !data.feeds) return;

    const csv = [
      ['Timestamp', 'Temperature', 'Humidity', 'MQ7 Raw', 'CO (ppm)', 'MQ2 Raw', 'LPG', 'Smoke', 'Dust'],
      ...data.feeds.slice(-filters.displayCount * 10).map(feed => [
        feed.created_at,
        feed.field1 || '',
        feed.field2 || '',
        feed.field3 || '',
        feed.field4 || '',
        feed.field5 || '',
        feed.field6 || '',
        feed.field7 || '',
        feed.field8 || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `channel-${channelInfo.channel}-filtered-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !data) {
    return (
      <div className="loading-container">
        <Activity size={32} className="loading-spinner" />
        <p>Đang tải dữ liệu kênh {channelInfo?.channel}...</p>
        <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>
          {filters.timeRange === 'custom' && filters.customDateFrom && filters.customDateTo ? (
            filters.customDateFrom === filters.customDateTo ? 
              `Đang tải data ngày ${new Date(filters.customDateFrom).toLocaleDateString('vi-VN')}...` :
              `Đang tải data từ ${new Date(filters.customDateFrom).toLocaleDateString('vi-VN')} đến ${new Date(filters.customDateTo).toLocaleDateString('vi-VN')}...`
          ) : (
            `Đang tải ${getResultsCount()} records (${filters.timeRange})...`
          )}
        </p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="error-container">
        <AlertTriangle size={32} />
        <p>{error}</p>
        <button onClick={fetchChannelData} className="control-btn">
          Thử lại
        </button>
        <button onClick={onBack} className="control-btn">
          <ArrowLeft size={16} />
          Quay lại
        </button>
      </div>
    );
  }

  if (!data || !data.feeds || data.feeds.length === 0) {
    return (
      <div className="no-data-container">
        <p>Không có dữ liệu từ kênh {channelInfo?.channel}</p>
        <button onClick={onBack} className="control-btn">
          <ArrowLeft size={16} />
          Quay lại
        </button>
      </div>
    );
  }

  const getTimeRangeLabel = () => {
    switch (filters.timeRange) {
      case '1hour': return '1 giờ qua';
      case '6hours': return '6 giờ qua';
      case '1day': return '24 giờ qua';
      case '3days': return '3 ngày qua';
      case '7days': return '7 ngày qua';
      case '1month': return '1 tháng qua';
      case 'custom':
        if (filters.customDateFrom && filters.customDateTo) {
          const fromDate = new Date(filters.customDateFrom).toLocaleDateString('vi-VN');
          const toDate = new Date(filters.customDateTo).toLocaleDateString('vi-VN');
          if (filters.customDateFrom === filters.customDateTo) {
            return `Ngày ${fromDate}`;
          }
          return `Từ ${fromDate} đến ${toDate}`;
        }
        return 'Tùy chọn ngày';
      default: return filters.timeRange;
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={onBack} className="control-btn">
              <ArrowLeft size={16} />
              Quay lại
            </button>
            <h1 className="dashboard-title">
              🔧 Kênh {channelInfo.channel} - Chi tiết
            </h1>
          </div>
          
          <div className="dashboard-controls">
            {/* View Mode Toggle */}
            <button
              onClick={() => setViewMode('heatmap')}
              className={`control-btn ${viewMode === 'heatmap' ? 'active' : ''}`}
            >
              <BarChart3 size={16} />
              Heatmap
            </button>
            
            <button
              onClick={() => setViewMode('charts')}
              className={`control-btn ${viewMode === 'charts' ? 'active' : ''}`}
            >
              <TrendingUp size={16} />
              Biểu đồ chuyên biệt
            </button>

            <FilterPanel
              filters={filters}
              onFilterChange={handleFilterChange}
              isOpen={showFilters}
              onToggle={() => setShowFilters(!showFilters)}
            />

            <div style={{
              padding: '6px 12px',
              backgroundColor: countdown <= 5 ? '#fef3c7' : '#f0f9ff',
              borderRadius: '6px',
              fontSize: '0.8rem',
              color: countdown <= 5 ? '#92400e' : '#0c4a6e',
              fontWeight: '600'
            }}>
              🔄 Cập nhật sau {countdown}s
            </div>

            <button
              onClick={exportData}
              className="control-btn"
              title="Xuất dữ liệu CSV"
            >
              <Download size={16} />
              Xuất CSV
            </button>
            
            <button
              onClick={fetchChannelData}
              disabled={loading}
              className="control-btn refresh"
            >
              <RefreshCw size={16} className={loading ? 'loading-spinner' : ''} />
              Làm mới
            </button>
          </div>
        </div>

        {/* Data Info Banner */}
        <div style={{
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '12px',
          padding: '12px 16px',
          margin: '16px 0',
          fontSize: '0.9rem',
          color: '#0c4a6e'
        }}>
          📊 Kênh <strong>{channelInfo.channel}</strong> • 
          {getTimeRangeLabel()} • 
          {viewMode === 'heatmap' ? `Heatmap ${filters.displayCount} records` : `Biểu đồ chuyên biệt ${chartData.length} records`} • 
          Tổng <strong>{data.feeds.length} records</strong> có sẵn • 
          Cập nhật: <strong>{lastUpdate?.toLocaleString('vi-VN')}</strong>
        </div>

        {/* Main Content */}
        {viewMode === 'heatmap' && (
          <div>
            {/* Linear Heatmaps for selected sensors */}
            {Object.keys(filteredData).map(fieldKey => {
              const config = SENSOR_CONFIG[fieldKey];
              const sensorData = filteredData[fieldKey];
              
              return (
                <SensorLinearHeatmap
                  key={fieldKey}
                  title={config.name}
                  data={sensorData.values}
                  unit={config.unit}
                  min={sensorData.min}
                  max={sensorData.max}
                  thresholdType={config.threshold}
                  displayCount={filters.displayCount}
                  fieldKey={fieldKey}
                />
              );
            })}
          </div>
        )}

        {viewMode === 'charts' && (
          <div>
            <MultiSensorChartView 
              data={chartData || []}
              title={`📊 Biểu đồ chuyên biệt kênh ${channelInfo?.channel || 'Unknown'}`}
              selectedSensors={chartSelectedSensors}
              height={400}
            />
          </div>
        )}

        {/* No Data Warning */}
        {((viewMode === 'heatmap' && Object.keys(filteredData).length === 0) || 
          (viewMode === 'charts' && chartData.length === 0)) && (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            backgroundColor: '#fef3c7',
            borderRadius: '12px',
            border: '1px solid #fbbf24',
            color: '#92400e'
          }}>
            <AlertTriangle size={48} style={{ marginBottom: '16px' }} />
            <p style={{ fontSize: '1.1rem', fontWeight: '600', margin: '0 0 8px 0' }}>
              Không có dữ liệu phù hợp với bộ lọc
            </p>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              Thử điều chỉnh các tiêu chí lọc hoặc chọn khoảng thời gian khác
            </p>
          </div>
        )}

        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default SimpleChannelDetail;