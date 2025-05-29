<?php
$servername = "localhost";
$username = "root"; // o il tuo utente mysql
$password = ""; // o la tua password mysql
$dbname = "balatro_db";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connessione fallita: " . $conn->connect_error);
}
?>
