<?php
require_once "db_access.php";
session_start();
session_destroy();
session_start();
header('Content-Type: application/json');
$conn = mysqli_connect(DBHOST, DBUSER, DBPASS, DBNAME);

if (!$conn) {
    echo json_encode(['success' => false, 'message' => 'Errore connessione DB: ' . mysqli_connect_error()]);
    exit;
}

function sanitize_input($data) {
    $data = trim($data); 
    $data = stripslashes($data); 
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8'); 
    return $data;
}

if (!isset($_POST['username'], $_POST['password'])) {
    echo json_encode(['success' => false, 'message' => 'Dati mancanti']);
    exit;
}

$username = sanitize_input($_POST['username']); 
$password = $_POST['password']; 

if (!preg_match('/^[a-zA-Z0-9_]{4,16}$/', $username)) {
    echo json_encode(['success' => false, 'message' => 'Il nome utente deve contenere solo lettere, numeri e underscore (_), con una lunghezza tra 4 e 16 caratteri.']);
    exit;
}

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
        $_SESSION['username'] = $username;
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Password errata']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Utente non trovato']);
}

$stmt->close();
$conn->close();
