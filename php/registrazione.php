<?php
require_once "db_access.php";
session_start();
header('Content-Type: application/json');

$connection = mysqli_connect(DBHOST, DBUSER, DBPASS, DBNAME);

if ($connection->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Errore connessione DB']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Metodo non consentito']);
    exit;
}

$username = trim($_POST['username'] ?? '');
$password = $_POST['password'] ?? '';

if (strlen($username) < 3) {
    echo json_encode(['success' => false, 'message' => 'Username deve essere almeno 3 caratteri.']);
    exit;
}

if (strlen($password) < 4) {
    echo json_encode(['success' => false, 'message' => 'Password deve essere almeno 4 caratteri.']);
    exit;
}

$stmt = $connection->prepare("SELECT id FROM giocatori WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'Username già utilizzato.']);
    $stmt->close();
    $connection->close();
    exit;
}

$passwordHash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $connection->prepare("INSERT INTO giocatori (username, password) VALUES (?, ?)");
$stmt->bind_param("ss", $username, $passwordHash);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Registrazione completata.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Errore durante la registrazione.']);
}

$stmt->close();
$connection->close();
