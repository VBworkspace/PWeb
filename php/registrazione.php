<?php
require_once "db_access.php";
session_start();
header('Content-Type: application/json');

// Connessione al database
$connection = mysqli_connect(DBHOST, DBUSER, DBPASS, DBNAME);

if ($connection->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Errore connessione DB']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Metodo non consentito']);
    exit;
}

// Funzione di sanitizzazione per prevenire XSS
function sanitize_input($data) {
    $data = trim($data); // Rimuove gli spazi iniziali e finali
    $data = stripslashes($data); // Rimuove le backslashes
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8'); // Escapes HTML special characters
    return $data;
}

// Sanitizzazione dei dati in ingresso
$username = sanitize_input($_POST['username'] ?? '');
$password = $_POST['password'] ?? '';

// Validazione dell'username (lunghezza e caratteri validi)
if (!preg_match('/^[a-zA-Z0-9_]{4,16}$/', $username)) {
    echo json_encode(['success' => false, 'message' => 'Il nome utente deve contenere solo lettere, numeri e underscore (_), con una lunghezza tra 4 e 16 caratteri.']);
    exit;
}

// Validazione della password (lunghezza, maiuscole, minuscole, numeri)
if (!preg_match('/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)[A-Za-z\d]{4,16}$/', $password)) {
    echo json_encode(['success' => false, 'message' => 'La password deve avere una lunghezza compresa tra 4 e 16 caratteri, deve avere almeno una lettera maiuscola, una minuscola e un numero.']);
    exit;
}

// Validazione della lunghezza dell'username
if (strlen($username) < 4 || strlen($username) > 16) {
    echo json_encode(['success' => false, 'message' => 'Username deve essere tra 4 e 16 caratteri.']);
    exit;
}

// Validazione della lunghezza della password
if (strlen($password) < 4 || strlen($password) > 16) {
    echo json_encode(['success' => false, 'message' => 'Password deve essere tra 4 e 16 caratteri.']);
    exit;
}

// Verifica se l'username è già in uso nel database
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

// Hash della password
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

// Preparazione della query per l'inserimento dei dati nel database
$stmt = $connection->prepare("INSERT INTO giocatori (username, password) VALUES (?, ?)");
$stmt->bind_param("ss", $username, $passwordHash);

// Esecuzione della query e risposta
if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Registrazione completata.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Errore durante la registrazione.']);
}

$stmt->close();
$connection->close();
