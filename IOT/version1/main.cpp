#include <WiFi.h>
#include <HTTPClient.h>
#include "DHT.h"

// Cấu hình cảm biến DHT11
#define DHTPIN 19
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// Các chân cảm biến
#define MQ2_PIN 32
#define MQ7_PIN 35
#define DUST_LED 18
#define DUST_ANALOG 34

// Thông tin WiFi
const char* ssid = "";               // thay tên WiFi
const char* password = "";   // mật khẩu WiFi

// ThingSpeak
const char* serverName = "http://api.thingspeak.com/update";
String apiKey = "";      // API Key từ ThingSpeak

// Hercules TCP server
const char* herculesHost = ""; // IP máy tính chạy Hercules
const uint16_t herculesPort = 5000;        // Port Hercules
WiFiClient herculesClient;

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(DUST_LED, OUTPUT);

  WiFi.begin(ssid, password);
  Serial.print("\nDang ket noi WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nDa ket noi WiFi!");
}

void loop() {
  // Đọc cảm biến
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  int mq7Value = analogRead(MQ7_PIN);
  int mq2Value = analogRead(MQ2_PIN);

  digitalWrite(DUST_LED, LOW);
  delayMicroseconds(280);
  int dustRaw = analogRead(DUST_ANALOG);
  delayMicroseconds(40);
  digitalWrite(DUST_LED, HIGH);
  delayMicroseconds(9680);

  // In ra Serial
  Serial.println("----");
  Serial.printf("Temp: %.1f C\n", temp);
  Serial.printf("Humidity: %.1f %%\n", hum);
  Serial.printf("MQ-7: %d\n", mq7Value);
  Serial.printf("Dust: %d\n", dustRaw);
  Serial.printf("MQ-2: %d\n", mq2Value);


  // Gửi đến Hercules
  if (!herculesClient.connected()) {
    herculesClient.connect(herculesHost, herculesPort);
  }
  if (herculesClient.connected()) {
    herculesClient.print("Temp: "); herculesClient.print(temp);
    herculesClient.print(" | Humi: "); herculesClient.print(hum);
    herculesClient.print(" | MQ7: "); herculesClient.print(mq7Value);
    herculesClient.print(" | Dust: "); herculesClient.println(dustRaw);
    herculesClient.print(" | MQ2: "); herculesClient.println(mq2Value);
  } else {
    Serial.println("Khong ket noi duoc den Hercules");
  }

  // Gửi lên ThingSpeak
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String data = "api_key=" + apiKey +
                  "&field1=" + String(temp) +
                  "&field2=" + String(hum) +
                  "&field3=" + String(mq7Value) +
                  "&field4=" + String(dustRaw) +
                  "&field5=" + String(mq2Value);

    http.begin(serverName);
    http.addHeader("Content-Type", "application/x-www-form-urlencoded");
    int responseCode = http.POST(data);

    Serial.print("Gui du lieu... HTTP response code: ");
    Serial.println(responseCode);
    http.end();
  } else {
    Serial.println("WiFi ngat ket noi");
  }

  delay(20000); // chờ 20s (ThingSpeak giới hạn 15s)
}
