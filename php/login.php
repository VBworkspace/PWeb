<?php
require_once "db_access.php";
session_start();
header('Content-Type: application/json');

// Connessione al database
$conn = mysqli_connect(DBHOST, DBUSER, DBPASS, DBNAME);

if (!$conn) {
    echo json_encode(['success' => false, 'message' => 'Errore connessione DB: ' . mysqli_connect_error()]);
    exit;
}

// Funzione di sanitizzazione per prevenire XSS
function sanitize_input($data) {
    $data = trim($data); // Rimuove gli spazi iniziali e finali
    $data = stripslashes($data); // Rimuove le backslashes
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8'); // Escapes HTML special characters
    return $data;
}

// Verifica che siano stati inviati 'username' e 'password'
if (!isset($_POST['username'], $_POST['password'])) {
    echo json_encode(['success' => false, 'message' => 'Dati mancanti']);
    exit;
}

$username = sanitize_input($_POST['username']); // Sanitizzazione dell'input per prevenire XSS
$password = $_POST['password']; // Password non ha bisogno di sanitizzazione in quanto non verrà visualizzata

// Validazione username (solo caratteri alfanumerici e underscore)
if (!preg_match('/^[a-zA-Z0-9_]{4,16}$/', $username)) {
    echo json_encode(['success' => false, 'message' => 'Il nome utente deve contenere solo lettere, numeri e underscore (_), con una lunghezza tra 4 e 16 caratteri.']);
    exit;
}

// Preparazione della query per il login dell'utente
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
    
    // Verifica se la password corrisponde
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
