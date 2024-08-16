<?php
// include database connection
require("config.php");

// perform GET query to retrieve sensor data along with location from dB
$get_sql = $con->prepare("
    SELECT 
        sensordata.SensorID, 
        sensordata.NodeID, 
        sensordata.FlowRate, 
        sensordata.WaterUsed, 
        sensordata.TimeRecorded,
        nodeinfo.LocationInfo AS Location
    FROM 
        sensordata
    JOIN 
        nodeinfo 
    ON 
        sensordata.NodeID = nodeinfo.NodeID
");
$get_sql->execute();
$result = $get_sql->get_result();
$data = array();

// check if there are any results
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
}

$con->close();

// return data as a JSON
header("Content-Type: application/json");
echo json_encode($data);
?>
