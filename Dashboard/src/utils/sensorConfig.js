// sensorConfig.js - Cấu hình metadata cho các cảm biến
import { Thermometer, Droplets, Activity, AlertTriangle, BarChart3, Eye, Wind, Flame } from 'lucide-react';

export const SENSOR_CONFIG = {
  field1: { 
    name: 'Nhiệt độ', 
    unit: '°C', 
    icon: Thermometer, 
    threshold: 'temperature',
    alertLevels: { caution: 32, warning: 35, danger: 40 },
    emoji: '🌡️',
    description: 'Theo dõi nhiệt độ môi trường'
  },
  
  field2: { 
    name: 'Độ ẩm', 
    unit: '%', 
    icon: Droplets, 
    threshold: 'humidity',
    alertLevels: { caution: 70, warning: 80, danger: 90 },
    emoji: '💧',
    description: 'Độ ẩm không khí'
  },
  
  field3: { 
    name: 'MQ7 Raw', 
    unit: '', 
    icon: Activity, 
    threshold: 'gas_raw',
    alertLevels: { caution: 1300, warning: 1500, danger: 2000 },
    emoji: '🔧',
    description: 'Giá trị thô từ cảm biến MQ7'
  },
  
  field4: { 
    name: 'CO (ppm)', 
    unit: ' ppm', 
    icon: AlertTriangle, 
    threshold: 'co_ppm',
    alertLevels: { caution: 100, warning: 200, danger: 300 },
    emoji: '⚠️',
    description: 'Nồng độ khí Carbon Monoxide'
  },
  
  field5: { 
    name: 'MQ2 Raw', 
    unit: '', 
    icon: BarChart3, 
    threshold: 'gas_raw',
    alertLevels: { caution: 1000, warning: 1200, danger: 1500 },
    emoji: '🔧',
    description: 'Giá trị thô từ cảm biến MQ2'
  },
  
  field6: { 
    name: 'LPG', 
    unit: ' ppm', 
    icon: Flame, 
    threshold: 'lpg_smoke',
    alertLevels: { caution: 50, warning: 100, danger: 200 },
    emoji: '🔥',
    description: 'Nồng độ khí LPG'
  },
  
  field7: { 
    name: 'Smoke', 
    unit: ' ppm', 
    icon: Wind, 
    threshold: 'lpg_smoke',
    alertLevels: { caution: 50, warning: 100, danger: 200 },
    emoji: '💨',
    description: 'Nồng độ khói'
  },
  
  field8: { 
    name: 'Dust Sensor', 
    unit: ' μg/m³', 
    icon: Eye, 
    threshold: 'dust',
    alertLevels: { caution: 50, warning: 100, danger: 200 },
    emoji: '🌪️',
    description: 'Nồng độ bụi trong không khí'
  }
};

// API endpoints cho ThingSpeak channels
export const API_ENDPOINTS = [
  { channel: '2999637', apiKey: 'PFQPJQSYJ2C7UPUA' },
  { channel: '2999638', apiKey: '9GVJ7I9FYVXZJZVA' },
  { channel: '2999639', apiKey: 'ANMIEHA84AAWBPAN' },
  { channel: '3026849', apiKey: 'MEUPK735860V98PG' },
  { channel: '2999643', apiKey: 'L4R9O4OH4RBT6ORV' },
  { channel: '2999644', apiKey: 'M5W0QKQJJT65FK52' },
  { channel: '2999645', apiKey: 'JNULQDROSJOOPU08' },
  { channel: '2999649', apiKey: 'GPIU77SPCCTVFU6M' },
  { channel: '2999651', apiKey: 'ZOMAJTNSSBDUG7MX' },
  { channel: '2999652', apiKey: 'XV2R0CRHV51AGG8O' },
  { channel: '2982770', apiKey: 'S2CGQJ8V23UMYPS4' },
  { channel: '3026416', apiKey: '3KQYFGDOGDINWDGP' },
  { channel: '3026386', apiKey: 'FGJJWJDCDNNUGYV3' },
  { channel: '3026415', apiKey: 'SJ9KGROXAAGC3QRT' },
  { channel: '3026416', apiKey: 'M6R41GRLXCVS2YR8' },
  { channel: '2999925', apiKey: 'VCOT9GK1S03R588N' },
  { channel: '3025936', apiKey: '1SYGUB62V8LRDRPE' },
  { channel: '2999930', apiKey: 'CTAR92U1X687H3Y2' },
  { channel: '2999931', apiKey: 'PXR7J9ZODHSCBXFI' },
  { channel: '2999956', apiKey: 'K1Y443I5V3YK3QU6' },
  { channel: '2999958', apiKey: 'HCKQAR76APFD6DPO' },
  { channel: '2999959', apiKey: '3CVOOJ1QB4MPLWLX' },
  { channel: '2999960', apiKey: '1RCYMLAPISX1ZFGD' },
  { channel: '3025940', apiKey: 'B7GZ9SNM2PRJDVRQ' },
  { channel: '2999996', apiKey: 'XVJS12245V522652' }
];

// Helper function để lấy config của sensor
export const getSensorConfig = (fieldName) => {
  return SENSOR_CONFIG[fieldName] || {
    name: fieldName,
    unit: '',
    icon: Activity,
    threshold: 'generic',
    alertLevels: { caution: 50, warning: 75, danger: 100 },
    emoji: '📊',
    description: 'Sensor chưa được cấu hình'
  };
};