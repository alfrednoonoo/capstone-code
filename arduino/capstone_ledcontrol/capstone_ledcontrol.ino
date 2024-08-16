#include <WiFi.h>
#include <PubSubClient.h>

#define LED_PIN 21
#define BUZZER_PIN 22 // Define the buzzer pin
#define SENSOR1 5
#define SENSOR2 18

const char* ssid = "SSID";
const char* password = "PASSWORD";

void setup_wifi() {
  delay(10);
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

const char* mqtt_server = "mqtt_ip_address";

WiFiClient espClient;
PubSubClient client(espClient);

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect("ESP32Client")) {
      Serial.println("connected");
      client.subscribe("Section_1");
      client.subscribe("Section_2");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

// Functions to publish sensor data in JSON format

void publishSensor1(float flowRate1, unsigned long totalMilliLitres1) {
  String payload = "{\"LocationInfo\":\"Section 1\",";
  payload += "\"FlowRate\":" + String(flowRate1) + ",";
  payload += "\"WaterUsed\":" + String(totalMilliLitres1) + "}";

  client.publish("Section_1", payload.c_str());
}

void publishSensor2(float flowRate2, unsigned long totalMilliLitres2) {
  String payload = "{\"LocationInfo\":\"Section 2\",";
  payload += "\"FlowRate\":" + String(flowRate2) + ",";
  payload += "\"WaterUsed\":" + String(totalMilliLitres2) + "}";

  client.publish("Section_2", payload.c_str());
}

// Global variables
long currentMillis = 0;
long previousMillis1 = 0; // For sensor 1 calculations
long previousMillis2 = 0; // For sensor 2 calculations
long publishPreviousMillis1 = 0; // For sensor 1 publishing
long publishPreviousMillis2 = 0; // For sensor 2 publishing

const int interval = 1000; // Calculation interval
const int publishInterval1 = 3000; // Publishing interval for sensor 1 (3 seconds)
const int publishInterval2 = 4000; // Publishing interval for sensor 2 (4 seconds)

boolean ledState = LOW;
float calibrationFactor1 = 7.5; // Calibration factor for sensor 1
float calibrationFactor2 = 7.5; // Calibration factor for sensor 2

volatile byte pulseCount1 = 0;
volatile byte pulseCount2 = 0;

byte pulse1Sec1 = 0;
byte pulse1Sec2 = 0;

float flowRate1 = 0;
float flowRate2 = 0;

unsigned int flowMilliLitres1 = 0;
unsigned int flowMilliLitres2 = 0;

unsigned long totalMilliLitres1 = 0;
unsigned long totalMilliLitres2 = 0;

// Variable to track the combined total for LED and buzzer control
unsigned long combinedTotal = 0;

// Buzzer timing variables
unsigned long buzzerPreviousMillis = 0;
const long buzzerInterval = 1000; // 1 second (0.5s ON, 0.5s OFF)

void IRAM_ATTR pulseCounter1() {
  pulseCount1++;
}

void IRAM_ATTR pulseCounter2() {
  pulseCount2++;
}

void setup() {
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, 1883);

  pinMode(LED_PIN, OUTPUT); // Set the LED pin as OUTPUT
  pinMode(BUZZER_PIN, OUTPUT); // Set the buzzer pin as OUTPUT

  attachInterrupt(digitalPinToInterrupt(SENSOR1), pulseCounter1, FALLING);
  attachInterrupt(digitalPinToInterrupt(SENSOR2), pulseCounter2, FALLING);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  currentMillis = millis();

  // Sensor 1 calculations
  if (currentMillis - previousMillis1 > interval) {
    pulse1Sec1 = pulseCount1;
    pulseCount1 = 0;
    flowRate1 = ((1000.0 / (millis() - previousMillis1)) * pulse1Sec1) / calibrationFactor1;
    previousMillis1 = millis();
    flowMilliLitres1 = (flowRate1 / 60) * 1000;
    totalMilliLitres1 += flowMilliLitres1;
  }

  // Sensor 2 calculations
  if (currentMillis - previousMillis2 > interval) {
    pulse1Sec2 = pulseCount2;
    pulseCount2 = 0;
    flowRate2 = ((1000.0 / (millis() - previousMillis2)) * pulse1Sec2) / calibrationFactor2;
    previousMillis2 = millis();
    flowMilliLitres2 = (flowRate2 / 60) * 1000;
    totalMilliLitres2 += flowMilliLitres2;
  }

  // Publish sensor 1 data every 3 seconds
  if (currentMillis - publishPreviousMillis1 >= publishInterval1) {
    publishSensor1(flowRate1, totalMilliLitres1);
    publishPreviousMillis1 = currentMillis; // Reset timer for Sensor 1 publishing
  }

  // Publish sensor 2 data every 4 seconds
  if (currentMillis - publishPreviousMillis2 >= publishInterval2) {
    publishSensor2(flowRate2, totalMilliLitres2);
    publishPreviousMillis2 = currentMillis; // Reset timer for Sensor 2 publishing
  }

  // Update combinedTotal with the sum of totalMilliLitres1 and totalMilliLitres2
  combinedTotal = totalMilliLitres1 + totalMilliLitres2;

  // LED control based on combinedTotal
  if (combinedTotal >= 3000) {
    digitalWrite(LED_PIN, HIGH); // LED stays on above 3000 mL
    // Buzzer control based on timing
    if (currentMillis - buzzerPreviousMillis >= buzzerInterval) {
      buzzerPreviousMillis = currentMillis; // Update last buzzer change time
      if (digitalRead(BUZZER_PIN) == LOW) {
        digitalWrite(BUZZER_PIN, HIGH); // Turn buzzer on
      } else {
        digitalWrite(BUZZER_PIN, LOW); // Turn buzzer off
      }
    }
  } else if (combinedTotal >= 2500) {
    digitalWrite(LED_PIN, HIGH); // LED stays on above 2500 mL
    digitalWrite(BUZZER_PIN, LOW); // Ensure buzzer is off
  } else if (combinedTotal >= 2000) {
    // Blink twice every second
    digitalWrite(LED_PIN, (currentMillis / 250) % 2 == 0 ? HIGH : LOW);
    digitalWrite(BUZZER_PIN, LOW); // Ensure buzzer is off
  } else if (combinedTotal >= 1000) {
    // Blink once every second
    digitalWrite(LED_PIN, (currentMillis / 500) % 2 == 0 ? HIGH : LOW);
    digitalWrite(BUZZER_PIN, LOW); // Ensure buzzer is off
  } else {
    digitalWrite(LED_PIN, LOW); // LED off below 1000 mL
    digitalWrite(BUZZER_PIN, LOW); // Ensure buzzer is off
  }
}
