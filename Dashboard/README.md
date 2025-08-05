# ThingSpeak Dashboard - Phiên bản Modular

Dashboard hiển thị dữ liệu cảm biến từ ThingSpeak với thiết kế modular, dễ bảo trì và mở rộng.

## 📁 Cấu trúc thư mục

```
src/
├── components/
│   ├── ThingSpeakDashboard.jsx    # Component chính
│   ├── StatCard.jsx               # Thẻ thống kê
│   ├── SensorHeatmap.jsx          # Heatmap 5x5
│   ├── HeatmapCell.jsx            # Ô heatmap
│   ├── AlertPanel.jsx             # Panel cảnh báo
│   └── ChartView.jsx              # Biểu đồ
├── utils/
│   ├── thresholds.js              # Cấu hình ngưỡng và màu sắc
│   ├── sensorConfig.js            # Metadata cảm biến
│   ├── colorUtils.js              # Utilities màu sắc
│   └── apiService.js              # Service API ThingSpeak
└── styles/
    └── dashboard.css              # CSS styling
```

## 🎨 Hệ thống màu sắc động

### Cấu hình ngưỡng (thresholds.js)
- **temperature**: Thang đo nhiệt độ từ đóng băng đến nguy hiểm
- **humidity**: Độ ẩm từ khô đến quá ẩm  
- **gas_raw**: Giá trị thô từ cảm biến khí
- **co_ppm**: Nồng độ CO theo ppm
- **dust**: Chỉ số bụi theo AQI
- **lpg_smoke**: LPG và khói
- **generic**: Thang đo chung

### Ví dụ thêm ngưỡng mới:
```javascript
// Trong thresholds.js
export const SENSOR_THRESHOLDS = {
  // ... các threshold hiện có
  
  my_new_sensor: [
    { min: undefined, max: 10, color: '#22c55e', label: 'Tốt', status: 'good' },
    { min: 10.1, max: 50, color: '#eab308', label: 'Trung bình', status: 'caution' },
    { min: 50.1, max: undefined, color: '#dc2626', label: 'Xấu', status: 'critical' }
  ]
};
```

## 🔧 Cấu hình cảm biến mới

### Trong sensorConfig.js:
```javascript
export const SENSOR_CONFIG = {
  // ... cấu hình hiện có
  
  field9: {
    name: 'Cảm biến mới',
    unit: ' unit',
    icon: YourIcon,
    threshold: 'my_new_sensor', // Tham chiếu đến threshold ở trên
    alertLevels: { caution: 30, warning: 70, danger: 100 },
    emoji: '🆕',
    description: 'Mô tả cảm biến mới'
  }
};
```

## 🚀 Cách sử dụng

### 1. Import và sử dụng Dashboard chính:
```jsx
import ThingSpeakDashboard from './components/ThingSpeakDashboard.jsx';
import './styles/dashboard.css';

function App() {
  return <ThingSpeakDashboard />;
}
```

### 2. Sử dụng components riêng lẻ:
```jsx
import StatCard from './components/StatCard.jsx';
import SensorHeatmap from './components/SensorHeatmap.jsx';

// StatCard riêng lẻ
<StatCard
  title="Nhiệt độ"
  value="25.5"
  unit="°C"
  trend={2.3}
  status="good"
  icon={Thermometer}
  thresholdType="temperature"
/>

// Heatmap riêng lẻ
<SensorHeatmap
  title="Nhiệt độ"
  data={temperatureData}
  timeLabels={timeLabels}
  unit="°C"
  thresholdType="temperature"
/>
```

### 3. Tùy chỉnh API endpoints:
```javascript
// Trong sensorConfig.js
export const API_ENDPOINTS = [
  { channel: 'your_channel_id', apiKey: 'your_api_key' },
  // Thêm các channels khác...
];
```

## 🎯 Tính năng chính

### ✅ Dashboard tổng hợp
- Hiển thị dữ liệu từ nhiều ThingSpeak channels
- Heatmap 5x5 cho mỗi loại cảm biến
- Thống kê thời gian thực
- Cảnh báo thông minh

### ✅ Hệ thống màu sắc động
- Tự động tính màu dựa trên ngưỡng
- Gradient mượt mà giữa các mức
- Dễ dàng thêm thang đo mới

### ✅ Components tái sử dụng
- StatCard: Thẻ thống kê đa năng
- SensorHeatmap: Heatmap linh hoạt
- AlertPanel: Cảnh báo có thể thu gọn
- ChartView: Biểu đồ tương tác

### ✅ API Service mạnh mẽ
- Cache thông minh
- Retry logic
- Error handling
- Real-time polling

## 🛠️ Tùy chỉnh nâng cao

### Thêm loại biểu đồ mới:
```jsx
// Trong ChartView.jsx
const chartTypes = {
  line: LineChart,
  bar: BarChart,
  area: AreaChart, // Thêm mới
  scatter: ScatterChart // Thêm mới
};
```

### Tùy chỉnh thuật toán màu:
```javascript
// Trong colorUtils.js
export const getCustomHeatmapColor = (value, min, max, colorScheme) => {
  // Logic tùy chỉnh để tính màu
  return customColor;
};
```

### Thêm animation mới:
```css
/* Trong dashboard.css */
@keyframes yourCustomAnimation {
  0% { /* initial state */ }
  100% { /* final state */ }
}

.your-element {
  animation: yourCustomAnimation 1s ease-in-out;
}
```

## 📱 Responsive Design

Dashboard tự động responsive trên:
- 🖥️ Desktop (1400px+)
- 💻 Laptop (1024px - 1399px)  
- 📱 Tablet (768px - 1023px)
- 📱 Mobile (< 768px)

## 🌙 Dark Mode

Hỗ trợ dark mode tự động dựa trên `prefers-color-scheme`.

## 📊 Tối ưu hiệu năng

- ✅ Memoization với `useMemo`
- ✅ Cache API với timeout
- ✅ Lazy loading components
- ✅ Debounced updates
- ✅ Virtual scrolling cho danh sách lớn

## 🐛 Debug & Troubleshooting

### Kiểm tra kết nối API:
```javascript
import { thingSpeakService } from './utils/apiService.js';

// Kiểm tra cache
console.log(thingSpeakService.getCacheStats());

// Clear cache nếu cần
thingSpeakService.clearCache();
```

### Debug màu sắc:
```javascript
import { getValueColorAndStatus } from './utils/thresholds.js';

const result = getValueColorAndStatus(25.5, 'temperature');
console.log(result); // { color: '#98fb98', status: 'good', label: 'Thoải mái' }
```

## 🔄 Cập nhật và bảo trì

1. **Thêm cảm biến mới**: Cập nhật `sensorConfig.js` và `thresholds.js`
2. **Thay đổi API**: Sửa `apiService.js`
3. **Tùy chỉnh giao diện**: Chỉnh sửa `dashboard.css`
4. **Thêm tính năng**: Tạo component mới trong `components/`

## 📝 License

MIT License - Tự do sử dụng và chỉnh sửa.

---

### 💡 Tips sử dụng hiệu quả:

1. **Tận dụng TypeScript**: Thêm type definitions cho better IDE support
2. **Sử dụng ESLint**: Đảm bảo code quality
3. **Testing**: Viết unit tests cho utilities
4. **Documentation**: Comment code cho team members
5. **Performance**: Monitor với React DevTools

Chúc bạn xây dựng dashboard tuyệt vời! 🚀