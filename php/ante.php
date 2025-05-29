<?php
require_once "db_access.php";
session_start();
$input = json_decode(file_get_contents('php://input'), true);
$connection = mysqli_connect(DBHOST, DBUSER, DBPASS, DBNAME);

if ($connection->connect_error) {
    die("Connection failed: " . $connection->connect_error);
}

header('Content-Type: application/json');
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? null;

function redirect($url) {
    header('Content-Type: text/html');
    header("Location: $url");
    exit;
}

function pescaCarte($quanti = 1) {
    if (!isset($_SESSION['mazzo']) || count($_SESSION['mazzo']) < $quanti) {
        // Ricrea mazzo se finito
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
    $pescate = array_splice($_SESSION['mazzo'], 0, $quanti);
    return $pescate;
}

switch ($action) {
    case 'getCarteCentrali':
        if (!isset($_SESSION['carte_centrali'])) {
            $_SESSION['carte_centrali'] = pescaCarte(8);
        }
        echo json_encode(['carte' => $_SESSION['carte_centrali']]);
        break;

    case 'pesca':
        $quanti = $input['quanti'] ?? 1;
        $nuove = pescaCarte($quanti);
        $_SESSION['carte_centrali'] = array_merge($_SESSION['carte_centrali'] ?? [], $nuove);
        echo json_encode(['carte' => $nuove]);
        break;

    case 'valutaMano':
        $carte = $input['carte'] ?? [];

        // Ordina carte per numero
        usort($carte, fn($a, $b) => $a['numero'] <=> $b['numero']);

        $numeri = array_column($carte, 'numero');
        $semi = array_column($carte, 'seme');
        $conteggio = array_count_values($numeri);
        $conteggioValori = array_values($conteggio);

        $isScala = true;
        if(count($carte) !== 5) $isScala = false;
        for ($i = 1; $i < count($numeri); $i++) {
            if ($numeri[$i] !== $numeri[$i - 1] + 1) {
                $isScala = false;
                break;
            }
        }
        $isColore = count(array_unique($semi)) === 1 && count($carte) === 5;
        $isPoker = in_array(4, $conteggioValori);
        $isFull = in_array(3, $conteggioValori) && in_array(2, $conteggioValori);
        $isTris = in_array(3, $conteggioValori);
        $isDoppia = count(array_filter($conteggioValori, fn($n) => $n === 2)) === 2;
        $isCoppia = in_array(2, $conteggioValori);

        $tipo = "Nessuna mano valida";
        $punteggio = 0;

        if ($isScala && $isColore) {
            $tipo = "Scala colore";
            $punteggio = 1000;
        } elseif ($isPoker) {
            $tipo = "Poker";
            $punteggio = 800;
        } elseif ($isFull) {
            $tipo = "Full House";
            $punteggio = 600;
        } elseif ($isColore) {
            $tipo = "Colore";
            $punteggio = 500;
        } elseif ($isScala) {
            $tipo = "Scala";
            $punteggio = 400;
        } elseif ($isTris) {
            $tipo = "Tris";
            $punteggio = 300;
        } elseif ($isDoppia) {
            $tipo = "Doppia coppia";
            $punteggio = 200;
        } elseif ($isCoppia) {
            $tipo = "Coppia";
            $punteggio = 100;
        }

        echo json_encode(['result' => $tipo, 'punteggio' => $punteggio]);
        break;

    case 'caricaStato':
        echo json_encode([
            'round' => $_SESSION['round'] ?? 0,
            'punteggioMassimo' => $_SESSION['punteggioMassimo'] ?? 0
        ]);
        break;

    case 'salvaStato':
        $_SESSION['round'] = $input['round'] ?? $_SESSION['round'] ?? 0;
        $_SESSION['punteggioMassimo'] = $input['punteggioMassimo'] ?? $_SESSION['punteggioMassimo'] ?? 0;
        echo json_encode(['success' => true]);
        break;

    // Altri casi esistenti (inizializza, login, etc.)
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
        echo json_encode(['success' => true]);
        break;

    case 'mostraClassifica':
        $stmt = $connection->prepare("SELECT giocatore, punteggio FROM classifica ORDER BY punteggio DESC LIMIT 10");
        $stmt->execute();
        $result = $stmt->get_result();
    
        $classifica = [];
        while ($row = $result->fetch_assoc()) {
            $classifica[] = [
                'giocatore' => $row['giocatore'],
                'punteggio' => (int)$row['punteggio']
            ];
        }
    
        echo json_encode(['success' => true, 'classifica' => $classifica]);
        $stmt->close();
        break;
        

    case 'startGame':
        $_SESSION['fase'] = 'shop';
        $_SESSION['round'] = 1;
        echo json_encode(['success' => true, 'targetDiv' => 'shopDiv']);
        break;

        case 'vaiAdAnte':
            // Controllo che l'utente sia loggato (opzionale ma consigliato)
            if (!isset($_SESSION['giocatore_id'])) {
                echo json_encode(['success' => false, 'message' => 'Non autenticato', 'targetDiv' => 'loginDiv']);
                exit;
            }
        
            // Se la fase è shop o non definita, permetti di andare ad ante
            if (!isset($_SESSION['fase']) || $_SESSION['fase'] === 'shop') {
                $_SESSION['fase'] = 'ante';
                echo json_encode(['success' => true, 'targetDiv' => 'anteDiv']);
            } else {
                error_log("DEBUG: qualcosa è andato storto in vaiAdAnte");
                echo json_encode(['success' => false, 'message' => 'Accesso non consentito', 'targetDiv' => 'loginDiv']);
            }
            break;
        
        case 'vaiAdShop':
            if (!isset($_SESSION['giocatore_id'])) {
                echo json_encode(['success' => false, 'message' => 'Non autenticato', 'targetDiv' => 'loginDiv']);
                exit;
            }
        
            if (!isset($_SESSION['fase']) || $_SESSION['fase'] === 'ante') {
                $_SESSION['fase'] = 'shop';
                $_SESSION['round'] = ($_SESSION['round'] ?? 1) + 1;
                echo json_encode(['success' => true, 'targetDiv' => 'shopDiv']);
            } else {
                error_log("DEBUG: qualcosa è andato storto in vaiAdShop");
                echo json_encode(['success' => false, 'message' => 'Accesso non consentito', 'targetDiv' => 'loginDiv']);
            }
            break;
            
        case 'vaiASchermataIniziale':
            if (!isset($_SESSION['giocatore_id'])) {
                echo json_encode(['success' => false, 'message' => 'Non autenticato', 'targetDiv' => 'loginDiv']);
                exit;
            }
        
            if (!isset($_SESSION['fase']) || $_SESSION['fase'] === 'ante') {
                $_SESSION['fase'] = 'schermataIniziale';
                $_SESSION['round'] = 0;
                echo json_encode(['success' => true, 'targetDiv' => 'schermataInizialeDiv']);
            } else {
                error_log("DEBUG: qualcosa è andato storto in vaiASchermataIniziale");
                echo json_encode(['success' => false, 'message' => 'Accesso non consentito', 'targetDiv' => 'loginDiv']);
            }
            break;
        

    default:
        echo json_encode(['success' => false, 'message' => 'Azione non riconosciuta']);
        break;
}
