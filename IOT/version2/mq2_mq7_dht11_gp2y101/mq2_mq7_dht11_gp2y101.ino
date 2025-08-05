#include <Arduino.h>
#include <math.h>
#include <DHT.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClient.h>

// WiFi credentials
const char* ssid = "Your_SSID_Here";
const char* password = "Your_PASSWORD_Here";

// ThingSpeak settings
const char* server = "api.thingspeak.com";
const char* apiKey = "Your_API_Key_Here"; // Replace with your ThingSpeak API key

// Hercules settings
const char* herculesIP = "*****";  // Replace with your Hercules server IP
const int herculesPort = 5000;
WiFiClient client;

// MQ2 constants
const int gasPin = 32;         // MQ2 AO → GPIO32 (ADC12-bit range 0–4095)
const float ADC_VOLTAGE = 3.3; // ADC tham chiếu 3.3V
const float RL_KOHM     = 10;  // RL = 10 kΩ (giá trị trên module)

// Calibration parameters for MQ2
const int   CALIB_SAMPLE_TIMES_MQ2    = 50;   // số mẫu để tính R₀
const int   CALIB_SAMPLE_INTERVAL_MQ2 = 500;  // ms giữa các mẫu
const float CLEAN_AIR_FACTOR_MQ2      = 9.83; // tỉ lệ RS/R0 trong không khí sạch

// Reading parameters for MQ2
const int   READ_SAMPLE_TIMES_MQ2    = 5;    // số mẫu khi đọc ppm
const int   READ_SAMPLE_INTERVAL_MQ2 = 50;   // ms giữa các mẫu

float R0_MQ2 = 1.0; // sẽ được tính tự động trong setup

// Các hệ số a, b (từ đồ thị RS/R0 vs ppm của MQ2)
struct GasCurve {
  const char* name;
  float a;
  float b;
};
GasCurve gasCurves[] = {
  {"LPG",     574.25,  -2.222},
  {"Methane",1049.20,  -2.180},
  {"Hydrogen",987.99,  -2.162},
  {"CO (MQ2)",    36974.0,   -3.109},
  {"Alcohol",3616.10,  -2.675},
};
const int GAS_COUNT = sizeof(gasCurves)/sizeof(gasCurves[0]);

// MQ7 constants
const int mq7Pin = 35;              // ESP32 GPIO35 (ADC)
const float Vcc = 5.0;             // Nguồn cung cấp cho MQ-7 (5V)
const float RL = 10000.0;          // Điện trở tải giả sử ~10kΩ
float R0_MQ7 = 1.0;                // Điện trở R0 tại điều kiện chuẩn (sẽ hiệu chuẩn)

// Calibration parameters for MQ7
const int calib_samples_MQ7 = 50;

// Reading parameters for MQ7
const int samples_MQ7 = 10;

// DHT11 and GP2Y101 constants
#define DHTPIN 19
#define DHTTYPE DHT11
#define DUST_LED_PIN 18
#define DUST_ANALOG_PIN 34

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);        // ADC 12-bit (0–4095)
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
  
  Serial.println("\n=== Sensor Calibration & Monitoring ===");
  
  // Warm-up sensors ~20s để ổn định
  Serial.println("Warm-up sensors, please keep in clean air...");
  delay(20000);
  
  // Tự động hiệu chuẩn R0 cho MQ2
  R0_MQ2 = calibrateR0_MQ2();
  Serial.print("Calibrated R0 for MQ2 = ");
  Serial.print(R0_MQ2, 3);
  Serial.println(" kΩ");
  
  // Hiệu chuẩn R0 cho MQ7
  float sum_MQ7 = 0;
  for(int i = 0; i < calib_samples_MQ7; i++) {
    sum_MQ7 += analogRead(mq7Pin);
    delay(100);
  }
  float avg_MQ7 = sum_MQ7 / calib_samples_MQ7;
  // Tính R0 = (Vcc/V_sensor - 1)*RL
  float V_sensor_MQ7 = avg_MQ7 * (3.3 / 4095.0);  // Chú ý: ADC tham chiếu 3.3V
  R0_MQ7 = (Vcc / V_sensor_MQ7 - 1.0) * RL;
  Serial.print("Calibrated R0 for MQ7 = ");
  Serial.println(R0_MQ7);
  
  // Khởi tạo DHT11
  dht.begin();
  pinMode(DUST_LED_PIN, OUTPUT);
  digitalWrite(DUST_LED_PIN, HIGH);
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

  // Đọc RS trung bình cho MQ2
  float rs_MQ2 = readRsAverage_MQ2();
  float ratio_MQ2 = rs_MQ2 / R0_MQ2;

  // Đọc giá trị analog từ chân gasPin (MQ2) và in ra Serial Monitor
  int analogValue_MQ2 = analogRead(gasPin);
  Serial.print("MQ2 Analog Value: ");
  Serial.println(analogValue_MQ2);

  Serial.print("MQ2 RS = ");
  Serial.print(rs_MQ2, 3);
  Serial.print(" kΩ   RS/R0 = ");
  Serial.print(ratio_MQ2, 3);
  Serial.println();

  // Tính và in ppm cho từng khí của MQ2
  float ppm_LPG = gasCurves[0].a * pow(ratio_MQ2, gasCurves[0].b);
  float ppm_Alcohol = gasCurves[4].a * pow(ratio_MQ2, gasCurves[4].b);
  for(int i = 0; i < GAS_COUNT; i++) {
    float ppm = gasCurves[i].a * pow(ratio_MQ2, gasCurves[i].b);
    Serial.print(gasCurves[i].name);
    Serial.print(": ");
    Serial.print(ppm, 2);
    Serial.print(" ppm   ");
  }
  Serial.println();

  // Đọc ADC trung bình cho MQ7
  float sum_MQ7 = 0;
  for(int i = 0; i < samples_MQ7; i++) {
    sum_MQ7 += analogRead(mq7Pin);
    delay(10);
  }
  float sensorVal_MQ7 = sum_MQ7 / samples_MQ7;
  // Tính điện áp đầu ra cảm biến
  float V_sensor_MQ7 = sensorVal_MQ7 * (3.3 / 4095.0);
  // Tính điện trở Rs hiện tại
  float Rs_MQ7 = (Vcc / V_sensor_MQ7 - 1.0) * RL;
  // Tính tỉ số Rs/R0
  float ratio_MQ7 = Rs_MQ7 / R0_MQ7;
  // Tính nồng độ CO (ppm) từ công thức log-log
  float ppm_CO_MQ7 = 0.93 * pow(ratio_MQ7, -1.709);
  
  // Đọc giá trị analog từ chân mq7Pin và in ra Serial Monitor
  int analogValue_MQ7 = analogRead(mq7Pin);
  Serial.print("MQ7 Analog Value: ");
  Serial.println(analogValue_MQ7);
  
  Serial.print("MQ7 ADC: ");
  Serial.print(sensorVal_MQ7);
  Serial.print("  Rs/R0: ");
  Serial.print(ratio_MQ7);
  Serial.print("  CO (MQ7): ");
  Serial.print(ppm_CO_MQ7);
  Serial.println(" ppm");
  
  // Gửi dữ liệu đến ThingSpeak
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = "http://" + String(server) + "/update?api_key=" + String(apiKey);
    url += "&field1=" + String(t);              // Field 1: Temperature
    url += "&field2=" + String(h);              // Field 2: Humidity
    url += "&field3=" + String(analogValue_MQ7); // Field 3: MQ7_raw
    url += "&field4=" + String(ppm_CO_MQ7);     // Field 4: MQ7_CO_ppm
    url += "&field5=" + String(analogValue_MQ2); // Field 5: MQ2_raw
    url += "&field6=" + String(ppm_Alcohol);    // Field 6: MQ2_alcohol
    url += "&field7=" + String(ppm_LPG);        // Field 7: MQ2_LPG
    url += "&field8=" + String(dustDensity);    // Field 8: GP2Y101_dust
    http.begin(url);
    int httpCode = http.GET();
    if (httpCode > 0) {
      Serial.println("Data sent to ThingSpeak");
    } else {
      Serial.println("Error sending to ThingSpeak");
    }
    http.end();
  }

  // Gửi dữ liệu đến Hercules
  if (client.connect(herculesIP, herculesPort)) {
    String data = "Temperature: " + String(t) + " C, Humidity: " + String(h) + " %, MQ7_raw: " + String(analogValue_MQ7) + ", MQ7_CO_ppm: " + String(ppm_CO_MQ7) + ", MQ2_raw: " + String(analogValue_MQ2) + ", MQ2_alcohol: " + String(ppm_Alcohol) + " ppm, MQ2_LPG: " + String(ppm_LPG) + " ppm, GP2Y101_dust: " + String(dustDensity) + " mg/m3";
    client.println(data);
    client.stop();
    Serial.println("Data sent to Hercules");
  } else {
    Serial.println("Error connecting to Hercules");
  }

  Serial.println("----------------------------------------");
  delay(1000);
}

// Đọc một mẫu RS cho MQ2
float readRs_MQ2() {
  int raw = analogRead(gasPin);
  float vOut = (raw * ADC_VOLTAGE) / 4095.0;
  // RS = (Vcc - Vout) / Vout * RL
  float rs = ((ADC_VOLTAGE - vOut) / vOut) * RL_KOHM;
  return rs;
}

// Đọc RS trung bình qua N mẫu cho MQ2
float readRsAverage_MQ2() {
  float sum = 0;
  for(int i = 0; i < READ_SAMPLE_TIMES_MQ2; i++) {
    sum += readRs_MQ2();
    delay(READ_SAMPLE_INTERVAL_MQ2);
  }
  return sum / READ_SAMPLE_TIMES_MQ2;
}

// Hiệu chuẩn R0 cho MQ2 bằng cách đo RS trong không khí sạch
float calibrateR0_MQ2() {
  float sum = 0;
  for(int i = 0; i < CALIB_SAMPLE_TIMES_MQ2; i++) {
    sum += readRs_MQ2();
    delay(CALIB_SAMPLE_INTERVAL_MQ2);
  }
  float rs_air = sum / CALIB_SAMPLE_TIMES_MQ2;
  // R0 = RS_air / CLEAN_AIR_FACTOR
  return rs_air / CLEAN_AIR_FACTOR_MQ2;
}