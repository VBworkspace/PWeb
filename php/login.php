<?php
require_once "db_access.php";
session_start();
header('Content-Type: application/json');

$conn = mysqli_connect(DBHOST, DBUSER, DBPASS, DBNAME);

if (!$conn) {
    echo json_encode(['success' => false, 'message' => 'Errore connessione DB: ' . mysqli_connect_error()]);
    exit;
}

if (!isset($_POST['username'], $_POST['password'])) {
    echo json_encode(['success' => false, 'message' => 'Dati mancanti']);
    exit;
}

$username = trim($_POST['username']);
$password = $_POST['password'];

$stmt = $conn->prepare("SELECT id, password FROM giocatori WHERE username = ?");
if (!$stmt) {
    echo json_encode(['success' => false, 'message' => 'Errore nella query']);
    exit;
}

$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $row = $result->fetch_assoc();
    if (password_verify($password, $row['password'])) {
        $_SESSION['giocatore_id'] = $row['id'];
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Password errata']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Utente non trovato']);
}

$stmt->close();
$conn->close();
