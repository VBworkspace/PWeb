<?php
require_once "db_access.php";
session_start();
$input = json_decode(file_get_contents('php://input'), true);
$connection = mysqli_connect(DBHOST, DBUSER, DBPASS, DBNAME);

if ($connection->connect_error) {
    die("Connection failed: " . $connection->connect_error);
}

header('Content-Type: application/json');
//$input = json_decode(file_get_contents('php://input'), true);
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

function controllaScala(array $numeri): bool {
    sort($numeri); // Ordina le carte
    $numeri = array_values(array_unique($numeri)); // Elimina duplicati

    // Serve esattamente 5 carte distinte
    if (count($numeri) !== 5) return false;

    // Scala normale
    for ($i = 1; $i < 5; $i++) {
        if ($numeri[$i] !== $numeri[$i - 1] + 1) {
            break;
        }
        if ($i === 4) return true;
    }

    // Scala bassa (A-2-3-4-5)
    if ($numeri === [1, 2, 3, 4, 5]) return true;

    // Scala alta (10-J-Q-K-A) → A è rappresentato da 1
    $convertiti = array_map(fn($n) => $n === 1 ? 14 : $n, $numeri);
    sort($convertiti);
    return $convertiti === [10, 11, 12, 13, 14];
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

        $isScala = controllaScala($numeri);

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
        else{
            $tipo = "Carta alta";
            $punteggio = 50;
        }

        echo json_encode(['result' => $tipo, 'punteggio' => $punteggio]);
        //error_log("DEBUG: mano giocata: " . $tipo);
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
        error_log("entrato in inizializza");
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
        $_SESSION['upgrade_mani'] = 0;
        $_SESSION['upgrade_scarti'] = 0;
        $_SESSION['fase'] = 'shop';
        //error_log(print_r($_SESSION['upgrade_mani'], true));     // ->OK
        //error_log(print_r($_SESSION['upgrade_scarti'], true));
                
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
        $_SESSION['mani_rimaste'] = 3;
        $_SESSION['scarti_rimasti'] = 2;
        echo json_encode(['success' => true, 'targetDiv' => 'shopDiv']);
        break;
    

    //case 'checkUpdates':
    //    error_log($_SESSION['upgrade_mani'], $_SESSION['upgrade_scarti']);
    //    echo json_encode(['manoInPiu' => $_SESSION['upgrade_mani'], 'scartoInPiu' => $_SESSION['upgrade_scarti']]);
    //break;

    case 'vaiAdAnte':
        // Controllo che l'utente sia loggato (opzionale ma consigliato)
        if (!isset($_SESSION['giocatore_id'])) {
            echo json_encode(['success' => false, 'message' => 'Non autenticato', 'targetDiv' => 'loginDiv']);
            exit;
        }
        error_log("in vaiAdAnte");
        error_log($_SESSION['fase']);
            
        if ($_SESSION['fase'] === 'shop') {     //mettendoci anche !isset($_SESSION['fase]) non va
            $_SESSION['fase'] = 'ante';
            error_log("cambiata fase in ante");
            $_SESSION['mani_rimaste'] = 3;
            $_SESSION['scarti_rimasti'] = 2;
            
            echo json_encode(['success' => true, 'targetDiv' => 'anteDiv', ]);
        } else {
            error_log("DEBUG: qualcosa è andato storto in vaiAdAnte");
            echo json_encode(['success' => false, 'message' => 'Accesso non consentito', 'targetDiv' => 'loginDiv']);
        }
        //error_log(print_r($_SESSION, true));
        break;
        
    case 'vaiAdShop':
        if (!isset($_SESSION['giocatore_id'])) {
            echo json_encode(['success' => false, 'message' => 'Non autenticato', 'targetDiv' => 'loginDiv']);
            exit;
        }
    
        if (!isset($_SESSION['fase']) || $_SESSION['fase'] === 'ante') {
            $_SESSION['fase'] = 'shop';
            $_SESSION['mani_rimaste'] = 3;
            $_SESSION['scarti_rimasti'] = 2;
            $_SESSION['punteggio_round'] = 0;
            $_SESSION['round'] = ($_SESSION['round'] ?? 1) + 1;
            echo json_encode(['success' => true, 'targetDiv' => 'shopDiv']);
        } else {
            error_log("DEBUG: qualcosa è andato storto in vaiAdShop");
            echo json_encode(['success' => false, 'message' => 'Accesso non consentito', 'targetDiv' => 'loginDiv']);
        }
        //error_log(print_r($_SESSION, true));
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
