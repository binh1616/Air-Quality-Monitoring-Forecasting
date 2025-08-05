#include <Arduino.h>
#include <DHT.h>
#include <ThingSpeak.h>
#include <WiFi.h>

// WiFi credentials
const char* ssid = "";               // Replace with your WiFi SSID
const char* password = "";   // Replace with your WiFi password

// ThingSpeak settings
unsigned long myChannelNumber = 123456; // Replace with your ThingSpeak channel number
const char* myWriteAPIKey = "Your_API_Key_Here"; // Replace with your ThingSpeak API key

// Chân analog của MQ-2 và MQ-7
const int MQ2_PIN = 32;       // MQ-2 analog pin (ADC1_CH0)
const int MQ7_PIN = 35;       // MQ-7 analog pin

// Các hằng số cho MQ-2
const int RL_VALUE_MQ2 = 5;      // Điện trở tải 5kΩ trên module MQ-2
float RO_CLEAN_AIR_FACTOR_MQ2 = 9.83; 
float LPGCurve[3]   = {2.3, 0.21, -0.47};
float COCurve[3]    = {2.3, 0.72, -0.34};
float SmokeCurve[3] = {2.3, 0.53, -0.44};
float Ro_MQ2 = 10;  // Điện trở cảm biến trong không khí sạch (kΩ)

// Tham số hiệu chỉnh cho MQ-2
int CALIBRATION_SAMPLE_TIMES_MQ2    = 50;
int CALIBRATION_SAMPLE_INTERVAL_MQ2 = 500; // ms
int READ_SAMPLE_INTERVAL_MQ2        = 50;
int READ_SAMPLE_TIMES_MQ2           = 5;

// Các hằng số cho MQ-7
const float Vcc_MQ7 = 5.0;             // Nguồn cung cấp cho MQ-7 (5V)
const float RL_MQ7 = 10000.0;          // Điện trở tải giả sử ~10kΩ
float R0_MQ7 = 1.0;                    // Điện trở R0 tại điều kiện chuẩn (sẽ hiệu chuẩn)

// DHT11
#define DHTPIN 19
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// GP2Y101
#define DUST_LED_PIN 18
#define DUST_ANALOG_PIN 34

WiFiClient client;

void setup() {
  Serial.begin(115200);
  
  // Kết nối WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");

  // Khởi tạo ThingSpeak
  ThingSpeak.begin(client);

  // Khởi tạo DHT11
  dht.begin();

  // Thiết lập chân cho cảm biến bụi
  pinMode(DUST_LED_PIN, OUTPUT);
  digitalWrite(DUST_LED_PIN, HIGH);

  // Đảm bảo ADC 12-bit (0-4095)
  analogReadResolution(12);

  // Hiệu chuẩn MQ-2
  Serial.print("Calibrating sensor... ");
  Ro_MQ2 = MQCalibration(MQ2_PIN);  
  Serial.println("done");
  Serial.print("Ro = "); Serial.print(Ro_MQ2); Serial.println(" kΩ");
  
  // Hiệu chuẩn MQ-7
  const int calib_samples = 50;
  float sum = 0;
  for(int i = 0; i < calib_samples; i++) {
    sum += analogRead(MQ7_PIN);
    delay(100);
  }
  float avg = sum / calib_samples;
  float V_sensor = avg * (3.3 / 4095.0);  // ADC tham chiếu 3.3V
  R0_MQ7 = (Vcc_MQ7 / V_sensor - 1.0) * RL_MQ7;
  Serial.print("Calibration R0 = ");
  Serial.println(R0_MQ7);
  
  delay(3000);
}

void loop() {
  // Đọc dữ liệu từ DHT11
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  if (isnan(h) || isnan(t)) {
    Serial.println("Failed to read DHT!");
  } else {
    Serial.print("Temperature: ");
    Serial.print(t);
    Serial.println(" C");
    Serial.print("Humidity: ");
    Serial.print(h);
    Serial.println(" %");
  }

  // Đọc dữ liệu từ GP2Y101
  digitalWrite(DUST_LED_PIN, LOW);
  delayMicroseconds(280);
  int voMeasured = analogRead(DUST_ANALOG_PIN);
  delayMicroseconds(40);
  digitalWrite(DUST_LED_PIN, HIGH);
  delayMicroseconds(9680);

  float calcVoltage = voMeasured * (3.3 / 4095.0);
  float dustDensity = 0.17 * calcVoltage - 0.1;
  if (dustDensity < 0) dustDensity = 0;

  Serial.print("Dust Raw: ");
  Serial.println(voMeasured);
  Serial.print("Dust Density: ");
  Serial.print(dustDensity);
  Serial.println(" mg/m3");

  // Đọc và xử lý dữ liệu từ MQ-2
  int raw_adc_mq2 = analogRead(MQ2_PIN);
  Serial.print("Raw ADC: ");
  Serial.println(raw_adc_mq2);

  float rs_ro_ratio_mq2 = MQRead(MQ2_PIN) / Ro_MQ2; // Tính tỉ số Rs/Ro

  long ppmLPG   = MQGetGasPercentage(rs_ro_ratio_mq2, 0);
  long ppmCO_MQ2    = MQGetGasPercentage(rs_ro_ratio_mq2, 1);
  long ppmSmoke = MQGetGasPercentage(rs_ro_ratio_mq2, 2);

  Serial.print("LPG: ");   Serial.print(ppmLPG);   Serial.print(" ppm, ");
  Serial.print("CO: ");    Serial.print(ppmCO_MQ2);    Serial.print(" ppm, ");
  Serial.print("Smoke: "); Serial.print(ppmSmoke); Serial.println(" ppm");

  // Đọc và xử lý dữ liệu từ MQ-7
  const int samples = 10;
  float sum = 0;
  for(int i = 0; i < samples; i++) {
    sum += analogRead(MQ7_PIN);
    delay(10);
  }
  float sensorVal = sum / samples;
  float V_sensor = sensorVal * (3.3 / 4095.0);
  float Rs = (Vcc_MQ7 / V_sensor - 1.0) * RL_MQ7;
  float ratio = Rs / R0_MQ7;
  float ppmCO_MQ7 = 0.93 * pow(ratio, -1.709);
  
  Serial.print("ADC: ");
  Serial.print(sensorVal);
  Serial.print("  Rs/R0: ");
  Serial.print(ratio);
  Serial.print("  CO(ppm): ");
  Serial.println(ppmCO_MQ7);

  // Gửi dữ liệu lên ThingSpeak
  ThingSpeak.setField(1, t);          // Temperature
  ThingSpeak.setField(2, h);          // Humidity
  ThingSpeak.setField(3, sensorVal);  // MQ7_raw
  ThingSpeak.setField(4, ppmCO_MQ7);  // MQ7_CO_ppm
  ThingSpeak.setField(5, raw_adc_mq2); // MQ2_raw
  ThingSpeak.setField(6, ppmLPG);     // MQ2_LPG
  ThingSpeak.setField(7, ppmSmoke);   // MQ2_Smoke
  ThingSpeak.setField(8, dustDensity); // GP2Y101_dust

  int x = ThingSpeak.writeFields(myChannelNumber, myWriteAPIKey);
  if(x == 200) {
    Serial.println("Channel update successful.");
  } else {
    Serial.println("Problem updating channel. HTTP error code " + String(x));
  }

  delay(2000);
}

// Các hàm phụ cho MQ-2
float MQResistanceCalculation(int raw_adc) {
  return ( (float)RL_VALUE_MQ2 * (4095 - raw_adc) / raw_adc );
}

float MQCalibration(int mq_pin) {
  float val = 0;
  for (int i = 0; i < CALIBRATION_SAMPLE_TIMES_MQ2; i++) {
    val += MQResistanceCalculation( analogRead(mq_pin) );
    delay(CALIBRATION_SAMPLE_INTERVAL_MQ2);
  }
  val /= CALIBRATION_SAMPLE_TIMES_MQ2;        // Trung bình nhiều mẫu
  val /= RO_CLEAN_AIR_FACTOR_MQ2;             // Chia hệ số không khí sạch
  return val;
}

float MQRead(int mq_pin) {
  float rs = 0;
  for (int i = 0; i < READ_SAMPLE_TIMES_MQ2; i++) {
    rs += MQResistanceCalculation( analogRead(mq_pin) );
    delay(READ_SAMPLE_INTERVAL_MQ2);
  }
  rs /= READ_SAMPLE_TIMES_MQ2;
  return rs;
}

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

long MQGetPercentage(float rs_ro_ratio, float *pcurve) {
  return pow(10, ((log(rs_ro_ratio) - pcurve[1]) / pcurve[2] + pcurve[0]));
}