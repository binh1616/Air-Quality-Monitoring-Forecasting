#include <Arduino.h>

// Chân analog của MQ-2 (ví dụ dùng GPIO36, ADC1_CH0 trên ESP32)
const int MQ_PIN = 32;       // MQ-2 analog pin (ADC1_CH0)
const int RL_VALUE = 5;      // Điện trở tải 5kΩ trên module MQ-2

// Các hằng số cho đường cong khí
float RO_CLEAN_AIR_FACTOR = 9.83; 
float LPGCurve[3]   = {2.3, 0.21, -0.47};
float COCurve[3]    = {2.3, 0.72, -0.34};
float SmokeCurve[3] = {2.3, 0.53, -0.44};
float Ro = 10;  // Điện trở cảm biến trong không khí sạch (kΩ)

// Tham số hiệu chỉnh
int CALIBRATION_SAMPLE_TIMES    = 50;
int CALIBRATION_SAMPLE_INTERVAL = 500; // ms
int READ_SAMPLE_INTERVAL        = 50;
int READ_SAMPLE_TIMES           = 5;

void setup() {
  Serial.begin(115200);
  analogReadResolution(12); // Đảm bảo ADC 12-bit (0-4095)

  Serial.print("Calibrating sensor... ");
  Ro = MQCalibration(MQ_PIN);  
  Serial.println("done");
  Serial.print("Ro = "); Serial.print(Ro); Serial.println(" k\u03A9");
  delay(3000);
}

void loop() {
  int raw_adc = analogRead(MQ_PIN);
  Serial.print("Raw ADC: ");
  Serial.println(raw_adc);

  float rs_ro_ratio = MQRead(MQ_PIN) / Ro; // Tính tỉ số Rs/Ro

  long ppmLPG   = MQGetGasPercentage(rs_ro_ratio, 0);
  long ppmCO    = MQGetGasPercentage(rs_ro_ratio, 1);
  long ppmSmoke = MQGetGasPercentage(rs_ro_ratio, 2);

  Serial.print("LPG: ");   Serial.print(ppmLPG);   Serial.print(" ppm, ");
  Serial.print("CO: ");    Serial.print(ppmCO);    Serial.print(" ppm, ");
  Serial.print("Smoke: "); Serial.print(ppmSmoke); Serial.println(" ppm");

  delay(2000);
}

// Tính điện trở cảm biến từ giá trị ADC (đã sửa dùng 4095 cho ESP32)
float MQResistanceCalculation(int raw_adc) {
  return ( (float)RL_VALUE * (4095 - raw_adc) / raw_adc );
}

// Hiệu chỉnh cảm biến trong không khí sạch để tìm Ro
float MQCalibration(int mq_pin) {
  float val = 0;
  for (int i = 0; i < CALIBRATION_SAMPLE_TIMES; i++) {
    val += MQResistanceCalculation( analogRead(mq_pin) );
    delay(CALIBRATION_SAMPLE_INTERVAL);
  }
  val /= CALIBRATION_SAMPLE_TIMES;        // Trung bình nhiều mẫu
  val /= RO_CLEAN_AIR_FACTOR;             // Chia hệ số không khí sạch
  return val;
}

// Đọc điện trở cảm biến (Rs) bằng trung bình nhiều mẫu
float MQRead(int mq_pin) {
  float rs = 0;
  for (int i = 0; i < READ_SAMPLE_TIMES; i++) {
    rs += MQResistanceCalculation( analogRead(mq_pin) );
    delay(READ_SAMPLE_INTERVAL);
  }
  rs /= READ_SAMPLE_TIMES;
  return rs;
}

// Chuyển tỉ số Rs/Ro thành nồng độ gas (ppm) theo đường cong tương ứng
long MQGetGasPercentage(float rs_ro_ratio, int gas_id) {
  if (gas_id == 0) {
    return MQGetPercentage(rs_ro_ratio, LPGCurve);
  } else if (gas_id == 1) {
    return MQGetPercentage(rs_ro_ratio, COCurve);
  } else if (gas_id == 2) {
    return MQGetPercentage(rs_ro_ratio, SmokeCurve);
  }
  return 0;
}

// Tính nồng độ (ppm) từ tỉ số Rs/Ro và đường cong
long MQGetPercentage(float rs_ro_ratio, float *pcurve) {
  return pow(10, ((log(rs_ro_ratio) - pcurve[1]) / pcurve[2] + pcurve[0]));
}