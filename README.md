# Capstone Code - Alfred Noonoo

## Introduction
This markdown file is to introduce to the variaous codes in my capstone project. For this capstone, all components were hosted locally - the website and database using **XAMPP** and **phpMyAdmin**, as well as the MQTT server. You are at liberty to make changes to the code at will. Ensure that you have a stable Wi-Fi connection to connect to the ESP32, the MQTT server and the database.

## Body
### Arduino Components
The Arduino code was programmed using the **ESP32** microcontroller. Before running the code, ensure that your MQTT server is running, and replace the `const char* password` and `const char* ssid` values with the values of your Wi-Fi SSID and password. Also, replace the `const char* mqtt_server` value with the value for your MQTT IP address. Both the `capstone_ledcontrol.ino` and the `capstone_svalve.ino` are similar, but the control aspects are different. While the former is set up to control an external LED and a buzzer based on the amount of water used, the latter is set up to control a relay to close and open a solenoid valve based on some parameters.

### MQTT Server
The MQTT server was hosted locally using **Mosquitto**. The server was used to send and receive messages between the Arduino and the database. The server was set up to run on the default port, `1883`.

### Python Code (`py_mqtt.py`)
The Python code was used to subscribe to the MQTT server and receive messages from the Arduino. I used the `paho-mqtt` library to interact with the MQTT server. In addition, the code also transmits the data to the database once the data is received on the server. Ensure to update these parameters for the database you set up.
```python
# MySQL Configuration
DB_HOST = 'localhost'
DB_USER = 'root'
DB_PASSWORD = ''
DB_DATABASE = 'capstone'

# Database connection
db_connection = mysql.connector.connect(
    host=DB_HOST,
    user=DB_USER,
    password=DB_PASSWORD,
    database=DB_DATABASE
)
```

Also, ensure to update these parameters for the MQTT server, as required:
```python
# MQTT Configuration
MQTT_BROKER = "mqtt_ip_address"
MQTT_PORT = 1883
MQTT_TOPIC1 = "Section_1"
MQTT_TOPIC2 = "Section_2"
```

### Database and SQL Code
The database was hosted locally using **phpMyAdmin**. The database was used to store the data received from the Arduino. The database was set up to run on the default port, `3306`. The `db.sql` file contains the format for my database.

### PHP Code (`config.php` and `fetch_data.php`)
The PHP code was used to connect to the database and fetch data from the database. The `config.php` file contains the database connection details, while the `fetch_data.php` file contains the code to fetch data from the database.

### Website
The website was hosted locally using **XAMPP**. The website was used to display the data received from the Arduino. The website was set up to run on the default port, `80`, for HTTP. I built the website using HTML, CSS, and JavaScript.
The JavaScript files (`line_graph.js` and `table.js`) filter the data retrieved from the database depending on the button clicked on the website. They also plot the data and show the data in a table format, respectively.

## Conclusion
The code provided in this repository is a guide to help you set up my project. You can make changes to the code as you see fit. If you have any questions or need further clarification, feel free to reach out to me.
