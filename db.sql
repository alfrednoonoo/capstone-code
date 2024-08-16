-- Create the capstone database
CREATE DATABASE capstone;

-- Create the nodeinfo table to store information about smart nodes
CREATE TABLE nodeinfo (
    NodeID INT PRIMARY KEY AUTO_INCREMENT,
    LocationInfo VARCHAR(255) -- LocationInfo relates to Node ID in sensordata table
);

-- Create the sensordata table to store sensor data
CREATE TABLE sensordata (
    SensorID INT PRIMARY KEY AUTO_INCREMENT,
    NodeID INT,
    FlowRate FLOAT,
    WaterUsed FLOAT,
    TimeRecorded TIMESTAMP,
    FOREIGN KEY (NodeID) REFERENCES nodeinfo(NodeID),
);
