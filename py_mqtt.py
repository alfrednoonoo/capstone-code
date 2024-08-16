import paho.mqtt.client as mqtt
import mysql.connector
import json

# MQTT Configuration
MQTT_BROKER = "mqtt_ip_address"
MQTT_PORT = 1883
MQTT_TOPIC1 = "Section_1"
MQTT_TOPIC2 = "Section_2"

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

def get_node_id(location_info):
    cursor = db_connection.cursor(dictionary=True)

    # Check if the LocationInfo already exists
    query = "SELECT NodeID FROM nodeinfo WHERE LocationInfo = %s"
    cursor.execute(query, (location_info,))
    result = cursor.fetchone()

    if result:
        # LocationInfo exists, return the NodeID
        node_id = result['NodeID']
    else:
        # LocationInfo does not exist, insert a new record
        insert_query = "INSERT INTO nodeinfo (LocationInfo) VALUES (%s)"
        cursor.execute(insert_query, (location_info,))
        
        # Get the NodeID of the newly inserted record
        new_node_id = cursor.lastrowid
        node_id = new_node_id

    cursor.close()
    return node_id


# Function to insert sensor data into the database
def insert_sensor_data(node_id, flow_rate, water_used):
    cursor = db_connection.cursor()
    query = """
        INSERT INTO sensordata (NodeID, FlowRate, WaterUsed, TimeRecorded) 
        VALUES (CAST(%s AS INT), CAST(%s AS FLOAT), CAST(%s AS FLOAT), CURRENT_TIMESTAMP);

    """
    cursor.execute(query, (node_id, flow_rate, water_used))
    db_connection.commit()
    cursor.close()

# The callback for when the client receives a CONNACK response from the server.
def on_connect(client, userdata, flags, rc):
    print("Connected with result code " + str(rc))
    client.subscribe([(MQTT_TOPIC1, 0), (MQTT_TOPIC2, 0)])

# The callback for when a PUBLISH message is received from the ESP32.
def on_message(client, userdata, msg):
    print(f"Message received on topic {msg.topic}: {msg.payload.decode('utf-8')}")
    # Message is received as JSON
    try:
        payload = json.loads(msg.payload)

        location_info = payload.get('LocationInfo', "Unknown")
        flow_rate = payload.get('FlowRate', 0.0)
        water_used = payload.get('WaterUsed', 0.0)

        # Get NodeID from LocationInfo
        node_id = get_node_id(location_info)

        if node_id:
            # Insert sensor data into the database
            insert_sensor_data(node_id, flow_rate, water_used)
            print("Data inserted successfully")
        else:
            print("Invalid LocationInfo, data not inserted")

    except json.JSONDecodeError:
        print("Error decoding JSON from MQTT message")

# Initialize MQTT client
client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

client.connect(MQTT_BROKER, MQTT_PORT, 60)

# Blocking call that processes network traffic, dispatches callbacks, and handles reconnecting.
client.loop_forever()
