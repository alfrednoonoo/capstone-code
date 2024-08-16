<?php

$servername= "localhost";
$username="root";
$password="";
$dbname="capstone";

$con =  new mysqli($servername,$username,$password,$dbname) or die ("could not connect database");

//check the connection:
if ($con->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}

?>