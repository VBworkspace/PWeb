<?php
require_once "db_access.php";
session_start();

// Sicurezza: disattiva errori visibili, abilita logging
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

$input = json_decode(file_get_contents('php://input'), true);
$connection = mysqli_connect(DBHOST, DBUSER, DBPASS, DBNAME);

if (!$connection) {
    echo json_encode(['success' => false, 'message' => 'Errore di connessione al database']);
    exit;
}

header('Content-Type: application/json');

$action = $input['action'] ?? null;
if (!isset($_SESSION['round'])) {
    $_SESSION['round'] = 1; 
    $_SESSION['punteggioTotale'] = 0;
    $_SESSION['mani_rimaste'] = 3;
    $_SESSION['scarti_disponibili'] = 2;
    $_SESSION['punteggioCorrente'] = 0;
}

function pescaCarte($quanti = 1) {
    if (!isset($_SESSION['mazzo']) || count($_SESSION['mazzo']) < $quanti) {
        $semi = ['cuori', 'quadri', 'fiori', 'picche'];
        $valori = range(1, 13);
        $_SESSION['mazzo'] = [];
        foreach ($semi as $seme) {
            foreach ($valori as $valore) {
                $_SESSION['mazzo'][] = ['numero' => $valore, 'seme' => $seme];
            }
        }
        shuffle($_SESSION['mazzo']);
    }
    return array_splice($_SESSION['mazzo'], 0, $quanti);
}

function controllaScala(array $numeri): bool {
    $unici = array_unique($numeri);
    sort($unici);
    if (count($unici) !== 5) {
        return false;
    }
    if ($unici === [1, 2, 3, 4, 5]) {
        return true;
    }
    $convertiti = array_map(fn($n) => $n === 1 ? 14 : $n, $unici);
    sort($convertiti);
    for ($i = 1; $i < 5; $i++) {
        if ($convertiti[$i] !== $convertiti[$i - 1] + 1) {
            return false;
        }
    }
    return true;
}

function mostraClassifica() {
    $conn = connessioneDb();

    $query = "SELECT g.username AS giocatore, h.punteggio 
              FROM highscore h
              JOIN giocatori g ON h.giocatore_id = g.id
              ORDER BY h.punteggio DESC";

    $result = $conn->query($query);
    $classifica = [];

    while ($row = $result->fetch_assoc()) {
        $classifica[] = $row;
    }
    echo json_encode(['success' => true, 'classifica' => $classifica]);
}

switch ($action) {
    case 'getCarteCentrali':
        if (!isset($_SESSION['carte_centrali'])) {
            $_SESSION['carte_centrali'] = pescaCarte(8);
        }
        echo json_encode(['carte' => $_SESSION['carte_centrali']]);
        exit;

    case 'pesca':
        $quanti = $input['quanti'] ?? 1;
        $nuove = pescaCarte($quanti);
        $_SESSION['carte_centrali'] = array_merge($_SESSION['carte_centrali'] ?? [], $nuove);
        echo json_encode(['carte' => $nuove]);
        exit;

    case 'valutaMano':
        $carte = $input['carte'] ?? [];
        usort($carte, function ($a, $b) {
            $valA = $a['numero'] === 1 ? 14 : $a['numero'];
            $valB = $b['numero'] === 1 ? 14 : $b['numero'];
            return $valA <=> $valB;
        });
    
        $numeriOriginali = array_column($carte, 'numero');
        $semi = array_column($carte, 'seme');
    
        $numeriPerValutazione = array_map(fn($n) => $n === 1 ? 14 : $n, $numeriOriginali);
    
        $conteggio = array_count_values($numeriPerValutazione);
        $conteggioValori = array_values($conteggio);
    
        $isScala = controllaScala($numeriOriginali);
        $isColore = count(array_unique($semi)) === 1 && count($carte) === 5;
        $isPoker = in_array(4, $conteggioValori);
        $isFull = in_array(3, $conteggioValori) && in_array(2, $conteggioValori);
        $isTris = in_array(3, $conteggioValori);
        $isDoppia = count(array_filter($conteggioValori, fn($n) => $n === 2)) === 2;
        $isCoppia = in_array(2, $conteggioValori);
    
        $tipo = "Nessuna mano valida";
        $punteggio = 0;
    
        if ($isScala && $isColore) {
            $tipo = "Scala colore"; $punteggio = 1000;
        } elseif ($isPoker) {
            $tipo = "Poker"; $punteggio = 800;
        } elseif ($isFull) {
            $tipo = "Full House"; $punteggio = 600;
        } elseif ($isColore) {
            $tipo = "Colore"; $punteggio = 500;
        } elseif ($isScala) {
            $tipo = "Scala"; $punteggio = 400;
        } elseif ($isTris) {
            $tipo = "Tris"; $punteggio = 300;
        } elseif ($isDoppia) {
            $tipo = "Doppia coppia"; $punteggio = 200;
        } elseif ($isCoppia) {
            $tipo = "Coppia"; $punteggio = 100;
        } else {
            $tipo = "Carta alta"; $punteggio = 50;
        }
        echo json_encode(['result' => $tipo, 'punteggio' => $punteggio]);
        exit;

    case 'caricaStato':
        echo json_encode([
            'round' => $_SESSION['round'] ?? 1,
            'punteggioTotale' => $_SESSION['punteggioTotale'] ?? 0,
            'mani' => $_SESSION['mani_rimaste'],
            'scarti' => $_SESSION['scarti_disponibili'],
            'success' => true
        ]);
        exit;

    case 'salvaStato':
        $_SESSION['round'] = $input['round'] ?? $_SESSION['round'] ?? 0;
        $_SESSION['punteggioTotale'] += $input['punteggioCorr'];
        echo json_encode(['success' => true]);
        exit;

    case 'inizializza':
        if (!isset($_SESSION['mazzo'])) {
            $semi = ['cuori', 'quadri', 'fiori', 'picche'];
            $valori = range(1, 13);
            $_SESSION['mazzo'] = [];
            foreach ($semi as $seme) {
                foreach ($valori as $valore) {
                    $_SESSION['mazzo'][] = ['numero' => $valore, 'seme' => $seme];
                }
            }
            shuffle($_SESSION['mazzo']);
        }
        //$_SESSION['punteggio_totale'] = 0;
        $_SESSION['fase'] = 'shop';    
        echo json_encode(['success' => true]);
        exit;

    case 'resetGame':
        $semi = ['cuori', 'quadri', 'fiori', 'picche'];
            $valori = range(1, 13);
            $_SESSION['mazzo'] = [];
            foreach ($semi as $seme) {
                foreach ($valori as $valore) {
                    $_SESSION['mazzo'][] = ['numero' => $valore, 'seme' => $seme];
                }
            }
            shuffle($_SESSION['mazzo']);
            $_SESSION['round'] += 1;
            echo json_encode(['success' => true, 'scarti' => $_SESSION['scarti_disponibili'], 'mani' => $_SESSION['mani_rimaste'], 'round' => $_SESSION['round']]);
        exit;
        
    case 'startGame':
        $_SESSION['fase'] = 'shop';
        $_SESSION['round'] = 1;
        $_SESSION['mani_rimaste'] = 3;
        $_SESSION['scarti_disponibili'] = 2;
        $_SESSION['punteggioTotale'] = 0;               // non era punteggioTotale?
        echo json_encode(['success' => true, 'targetDiv' => 'shopDiv']);
        exit;

    //case 'sconfitta':
    //    $_SESSION['fase'] = 'schermataIniziale';
    //    $_SESSION['round'] = 1;
    //    $_SESSION['mani_rimaste'] = 3;
    //    $_SESSION['scarti_disponibili'] = 2;
    //    $_SESSION['punteggioTotale'] = 0; 
    //    $_SESSION['punteggioCorrente'] = 0; 
    //    echo json_encode(['success' => true, 'targetDiv' => 'schermataInizialeDiv']);   
    //    exit;

    case 'mostraClassifica':
        if (!$connection) {
            echo json_encode(['success' => false, 'message' => 'Connessione al DB non riuscita']);
            exit;
        }
        $stmt = $connection->prepare("SELECT username, punteggio, data_h FROM highscore ORDER BY punteggio DESC LIMIT 10");
        if (!$stmt) {
            error_log("Errore prepare mostraClassifica: " . $connection->error);
            echo json_encode(['success' => false, 'message' => 'Errore nella preparazione della query']);
            exit;
        }
        if (!$stmt->execute()) {
            error_log("Errore execute mostraClassifica: " . $stmt->error);
            echo json_encode(['success' => false, 'message' => 'Errore nell\'esecuzione della query']);
            exit;
        }
        $result = $stmt->get_result();
        if (!$result) {
            error_log("Errore get_result mostraClassifica: " . $stmt->error);
            echo json_encode(['success' => false, 'message' => 'Errore nel recupero dei dati']);
            exit;
        }
        file_put_contents('debug.log', "File PHP raggiunto\n", FILE_APPEND);

        $classifica = [];
        while ($row = $result->fetch_assoc()) {
            $classifica[] = [
                'username' => $row['username'],
                'punteggio' => (int)$row['punteggio'],
                'data' => $row['data_h']
            ];
        }
        $stmt->close();
        file_put_contents('debug.log', print_r($input, true), FILE_APPEND);
        echo json_encode(['success' => true, 'classifica' => $classifica]);
        exit;
    

    case 'vaiAdAnte':   //da snellire
        if (!isset($_SESSION['giocatore_id'])) {
            echo json_encode(['success' => false, 'message' => 'Non autenticato', 'targetDiv' => 'loginDiv']);
            exit;
        }
        if ($_SESSION['fase'] === 'shop') {
            $_SESSION['fase'] = 'ante';
            $_SESSION['punteggioCorrente'] = 0;
            echo json_encode(['success' => true,
            'maniTot' => $_SESSION['mani_rimaste'],
            'scartiTot' => $_SESSION['scarti_disponibili'],
            'round' => $_SESSION['round'],
            'targetDiv' => 'anteDiv',
            'puntCorrente' => $_SESSION['punteggioCorrente'],
            ]);
            exit;
        } else {
            echo json_encode(['success' => false, 'message' => 'Accesso non consentito', 'targetDiv' => 'loginDiv']);
            exit;
        }

    case 'vaiAdShop':
        if (!isset($_SESSION['giocatore_id'])) {
            echo json_encode(['success' => false, 'message' => 'Non autenticato', 'targetDiv' => 'loginDiv']);
            exit;
        }
        if ($_SESSION['fase'] === 'ante') {
            //$_SESSION['punteggioTotale'] += $input['puntiTot'] ?? 0;
            //$_SESSION['mani_rimaste'] = 3;
            //$_SESSION['scarti_disponibili'] = 2;
            //$_SESSION['round'] = $_SESSION['round'] + 1;      //eliminato perchè aumentava il round 2 volte
            $_SESSION['punteggioCorrente'] = 0;
            $_SESSION['fase'] = 'shop';
            $_SESSION['punteggio_round'] = 0;
            echo json_encode(['success' => true, 'targetDiv' => 'shopDiv', 'round' => $_SESSION['round']]);
            exit;
        } else {
            echo json_encode(['success' => false, 'message' => 'Accesso non consentito', 'targetDiv' => 'loginDiv']);
            exit;
        }

    case 'vaiASchermataIniziale':
        if (!isset($_SESSION['giocatore_id'])) {
            echo json_encode(['success' => false, 'message' => 'Non autenticato', 'targetDiv' => 'loginDiv']);
            exit;
        }

        if (!isset($_SESSION['fase']) || $_SESSION['fase'] === 'ante') {
            $_SESSION['fase'] = 'schermataIniziale';
            $_SESSION['round'] = 0;
            echo json_encode(['success' => true, 'targetDiv' => 'schermataInizialeDiv']);
            exit;
        }
        if($_SESSION['fase']){
            $_SESSION['fase'] = 'schermataIniziale';
            $_SESSION['round'] = 1;
            $_SESSION['punteggioCorrente'] = 0;
            $_SESSION['punteggio_round'] = 0;
            $_SESSION['mani_rimaste'] = 3;
            $_SESSION['scarti_disponibili'] = 2;
            file_put_contents('debug.log', print_r($_SESSION, true), FILE_APPEND);
            echo json_encode(['success' => true, 'targetDiv' => 'schermataInizialeDiv']);
            exit;
        } else {
            echo json_encode(['success' => false, 'message' => 'Accesso non consentito', 'targetDiv' => 'loginDiv']);
            exit;
        }

    case 'compraMano':
        if (!isset($_SESSION['giocatore_id'])) {
            echo json_encode(['success' => false, 'message' => 'Non autenticato']);
            exit;
        }
        if($_SESSION['punteggioTotale'] < 1000){
            echo json_encode(['success' => false, 'message' => 'Non hai abbastanza punti per comprare l\'upgrade']);
            exit;
        }
        $_SESSION['punteggioTotale'] = $_SESSION['punteggioTotale'] - 1000;
        $_SESSION['mani_rimaste'] = 4;
        echo json_encode(['success' => true, 'punteggioAggiornato' => $_SESSION['punteggioTotale']]);
        exit;

    case 'compraScarto':
        if (!isset($_SESSION['giocatore_id'])) {
            echo json_encode(['success' => false, 'message' => 'Non autenticato']);
            exit;
        }
        if($_SESSION['punteggioTotale'] < 1000){
            echo json_encode(['success' => false, 'message' => 'Non hai abbastanza punti per comprare l\'upgrade']);
            exit;
        }
        $_SESSION['punteggioTotale'] = $_SESSION['punteggioTotale'] - 1000;
        $_SESSION['scarti_disponibili'] = 3;
        echo json_encode(['success' => true, 'punteggioAggiornato' => $_SESSION['punteggioTotale']]);
        exit;
    
    case 'salvaHighscore':
        if (!isset($_SESSION['username'])) {
            echo json_encode(['success' => false, 'message' => 'Giocatore non autenticato.']);
            exit;
        }
    
        $username = $_SESSION['username'];
        $punteggioTotale = $_SESSION['punteggioTotale'] ?? 0;
    
        $stmt = $connection->prepare("SELECT punteggio FROM highscore WHERE username = ?");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $result = $stmt->get_result();
    
        if ($result && $result->num_rows > 0) {
            $row = $result->fetch_assoc();
            $punteggioSalvato = $row['punteggio'];
    
            if ($punteggioTotale > $punteggioSalvato) {
                $updateStmt = $connection->prepare("UPDATE highscore SET punteggio = ?, data_h = NOW() WHERE username = ?");
                $updateStmt->bind_param("is", $punteggioTotale, $username);
                $updateStmt->execute();
            }
        } else {
            $insertStmt = $connection->prepare("INSERT INTO highscore (username, punteggio, data_h) VALUES (?, ?, NOW())");
            $insertStmt->bind_param("si", $username, $punteggioTotale);
            $insertStmt->execute();
        }
        //var_dump($_SESSION['username']);
        file_put_contents('debug.log', print_r($_SESSION['username'], true), FILE_APPEND);
        echo json_encode(['success' => true, 'highscore' => $punteggioTotale, 'username' => $_SESSION['username']]);
        exit;
        
    

    default:
        echo json_encode(['success' => false, 'message' => 'Azione non riconosciuta']);
        exit;

}
