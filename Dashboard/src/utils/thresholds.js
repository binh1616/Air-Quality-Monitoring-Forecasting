// thresholds.js - Cấu hình ngưỡng và màu sắc cho các loại cảm biến

export const SENSOR_THRESHOLDS = {
  temperature: [
    { min: undefined, max: 0, color: '#1e3a5f', label: 'Đóng băng', status: 'critical' },
    { min: 0.1, max: 10, color: '#4682b4', label: 'Rất lạnh', status: 'warning' },
    { min: 10.1, max: 20, color: '#87cefa', label: 'Lạnh', status: 'caution' },
    { min: 20.1, max: 25, color: '#98fb98', label: 'Thoải mái', status: 'good' },
    { min: 25.1, max: 30, color: '#90ee90', label: 'Ấm', status: 'good' },
    { min: 30.1, max: 35, color: '#fdd835', label: 'Nóng', status: 'caution' },
    { min: 35.1, max: 40, color: '#fb8c00', label: 'Rất nóng', status: 'warning' },
    { min: 40.1, max: undefined, color: '#b71c1c', label: 'Nguy hiểm', status: 'critical' },
  ],
  
  humidity: [
    { min: undefined, max: 20, color: '#8b4513', label: 'Rất khô', status: 'warning' },
    { min: 20.1, max: 30, color: '#cd853f', label: 'Khô', status: 'caution' },
    { min: 30.1, max: 40, color: '#f0e68c', label: 'Hơi khô', status: 'good' },
    { min: 40.1, max: 60, color: '#90ee90', label: 'Thoải mái', status: 'good' },
    { min: 60.1, max: 70, color: '#87ceeb', label: 'Hơi ẩm', status: 'good' },
    { min: 70.1, max: 80, color: '#4682b4', label: 'Ẩm', status: 'caution' },
    { min: 80.1, max: 90, color: '#1e90ff', label: 'Rất ẩm', status: 'warning' },
    { min: 90.1, max: undefined, color: '#0000cd', label: 'Quá ẩm', status: 'critical' },
  ],
  
  gas_raw: [
    { min: undefined, max: 300, color: '#22c55e', label: 'An toàn', status: 'good' },
    { min: 300.1, max: 600, color: '#84cc16', label: 'Bình thường', status: 'good' },
    { min: 600.1, max: 900, color: '#eab308', label: 'Chú ý', status: 'caution' },
    { min: 900.1, max: 1200, color: '#f59e0b', label: 'Cảnh báo', status: 'warning' },
    { min: 1200.1, max: 1500, color: '#ea580c', label: 'Nguy hiểm', status: 'warning' },
    { min: 1500.1, max: undefined, color: '#dc2626', label: 'Rất nguy hiểm', status: 'critical' },
  ],
  
  co_ppm: [
    { min: undefined, max: 10, color: '#22c55e', label: 'An toàn', status: 'good' },
    { min: 10.1, max: 30, color: '#84cc16', label: 'Bình thường', status: 'good' },
    { min: 30.1, max: 50, color: '#eab308', label: 'Chú ý', status: 'caution' },
    { min: 50.1, max: 100, color: '#f59e0b', label: 'Cảnh báo', status: 'warning' },
    { min: 100.1, max: 200, color: '#ea580c', label: 'Nguy hiểm', status: 'warning' },
    { min: 200.1, max: undefined, color: '#dc2626', label: 'Rất nguy hiểm', status: 'critical' },
  ],
  
  dust: [
    { min: undefined, max: 12, color: '#22c55e', label: 'Tốt', status: 'good' },
    { min: 12.1, max: 35, color: '#84cc16', label: 'Trung bình', status: 'good' },
    { min: 35.1, max: 55, color: '#eab308', label: 'Nhậy cảm', status: 'caution' },
    { min: 55.1, max: 150, color: '#f59e0b', label: 'Có hại', status: 'warning' },
    { min: 150.1, max: 250, color: '#ea580c', label: 'Rất có hại', status: 'warning' },
    { min: 250.1, max: undefined, color: '#dc2626', label: 'Nguy hiểm', status: 'critical' },
  ],
  
  lpg_smoke: [
    { min: undefined, max: 25, color: '#22c55e', label: 'An toàn', status: 'good' },
    { min: 25.1, max: 50, color: '#84cc16', label: 'Bình thường', status: 'good' },
    { min: 50.1, max: 100, color: '#eab308', label: 'Chú ý', status: 'caution' },
    { min: 100.1, max: 200, color: '#f59e0b', label: 'Cảnh báo', status: 'warning' },
    { min: 200.1, max: 300, color: '#ea580c', label: 'Nguy hiểm', status: 'warning' },
    { min: 300.1, max: undefined, color: '#dc2626', label: 'Rất nguy hiểm', status: 'critical' },
  ],
  
  generic: [
    { min: undefined, max: 20, color: '#22c55e', label: 'Rất thấp', status: 'good' },
    { min: 20.1, max: 40, color: '#84cc16', label: 'Thấp', status: 'good' },
    { min: 40.1, max: 60, color: '#eab308', label: 'Trung bình', status: 'caution' },
    { min: 60.1, max: 80, color: '#f59e0b', label: 'Cao', status: 'warning' },
    { min: 80.1, max: undefined, color: '#dc2626', label: 'Rất cao', status: 'critical' },
  ]
};

// Utility function để lấy màu và trạng thái cho một giá trị
export const getValueColorAndStatus = (value, thresholdType) => {
  const thresholds = SENSOR_THRESHOLDS[thresholdType] || SENSOR_THRESHOLDS.generic;
  
  for (const threshold of thresholds) {
    const minCheck = threshold.min === undefined || value >= threshold.min;
    const maxCheck = threshold.max === undefined || value <= threshold.max;
    
    if (minCheck && maxCheck) {
      return {
        color: threshold.color,
        status: threshold.status,
        label: threshold.label
      };
    }
  }
  
  return {
    color: '#6b7280',
    status: 'unknown',
    label: 'Không xác định'
  };
};