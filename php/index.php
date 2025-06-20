<?php
session_start();

// Verifica se 'round' esiste, altrimenti impostalo
if (!isset($_SESSION['round'])) {
    $_SESSION['round'] = 0;  // Imposta un valore di default per il round
    $_SESSION['punteggioTotale'] = 0;
    $_SESSION['mani_rimaste'] = 3;
    $_SESSION['scarti_disponibili'] = 2;
    $_SESSION['punteggioCorrente'] = 0;
}
?>



<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8" />
    <title>Login - Simple Balatro</title>
    <link rel="stylesheet" href="../css/stile.css" />
    <link rel="stylesheet" href="../css/ante.css" />
    <link rel="stylesheet" href="../css/shop.css" />
    <link rel="icon" href="../immagini/logo.svg" />
    <script src="../js/auth.js" defer></script>
    <script src="../js/schermataIniziale.js" defer></script>
    <script src="../js/shop.js" defer></script>
    <script src="../js/ante.js" defer></script>
</head>
<body>
    <div id="loginDiv">

        <h2>Login</h2>
        
        <form id="loginForm">
            <label>Nome utente:</label>
            <input type="text" name="username" required /><br />
            
            <label>Password:</label>
            <input type="password" name="password" required /><br />
            
            <button type="submit">Accedi</button>
        </form>
        <p>Non hai un account? <a href="#" class="vai-a-registrazione">Registrati qui</a></p>
        <p id="error" style="color:red;"></p>
    </div>

    <div id="registrazioneDiv">
        <h2>Registrazione</h2>
        <form id="registerForm">
            <label>Nome utente:</label><br>
            <input type="text" name="username" required /><br>

            <label>Password:</label><br>
            <input type="password" name="password" id="password" required /><br>

            <label>Ripeti Password:</label><br>
            <input type="password" name="confirmPassword" id="confirmPassword" required /><br>
            <button type="submit">Registrati</button>
        </form>

        <p id="msg" style="color:red;"></p>
        <p>Hai già un account? <a href="#" class="vai-a-login">Accedi qui</a></p>
        
    </div>

    <div id="schermataInizialeDiv">
        <div class="container">
            <!-- Logo BALATRO al centro -->
            <h1 class="balatro">BALATRO</h1>
    
            <!-- Bottone GIOCA in basso a sinistra -->
            <button class="gioca" id="giocaBtn">GIOCA</button>
    
            <!-- Bottone CLASSIFICA in basso a destra -->
            <button class="classifica" id="classificaBtn">CLASSIFICA</button>
    
            <!-- Icona utente in alto a destra -->
            <a href="profilo.php" class="user-icon">
                <img src="../immagini/user-icon.svg" alt="Icona Utente" />
            </a>
        </div>
    
        <h1 id="welcome-message">Caricamento...</h1>
    </div>

    <div id="shopDiv">
        <h1 id="round-info-h">Benvenuto nello Shop!</h1>

        <div class="shop-container">
            <!-- Sezione sinistra (Info partita) -->
            <div class="shop-info">
                <h1>SHOP</h1>

                <div class="score">
                    <p>Punteggio: <span id="punteggioTotale"> <?php echo $_SESSION['punteggioTotale']; ?></span></p>
                </div>

                <div class="bottom-info">
                    <p>Run Info</p>
                    
                    <p>Round: </p> <p id="round-info"><?php echo $_SESSION['round'];?> </p>
                </div>
            </div>

            <!-- Sezione destra (Acquisti + Powerup) -->
            <div class="shop-purchases">
                <button class="next-round" id="vaiGioco">Next Round</button>

                <div class="upgrades">
                    <h3>Upgrades disponibili</h3>
                    <div class="upgrade-list">
                        <div class="upgrade-slot" id="upM">[+1 Mano (1000 punti)]</div>
                        <div class="upgrade-slot" id="upS">[+1 Scarto (1000 punti)]</div>
                    </div>
                </div>
               
                <div class="upgrades-pianeti">
                    <h3>Upgrade Mani di Poker</h3>
                    <div class="pianeti">
                        <div class="pianeti-slot" id="sr">[Scala Reale]</div>
                        <div class="pianeti-slot" id="sc">[Scala Colore]</div>
                        <div class="pianeti-slot" id="p4">[Poker]</div>
                        <div class="pianeti-slot" id="fh">[Full House]</div>
                        <div class="pianeti-slot" id="cc">[Colore]</div>
                        <div class="pianeti-slot" id="ss">[Scala]</div>
                        <div class="pianeti-slot" id="p3">[Tris]</div>
                        <div class="pianeti-slot" id="p22">[Doppia Coppia]</div>
                        <div class="pianeti-slot" id="p2">[Coppia]</div>
                        <div class="pianeti-slot" id="ca">[Carta Alta]</div>
                    </div>
                </div>
                
            </div>
        </div>
    </div>

    <div id="anteDiv">
        <div class="griglia-ante">
            <div class="s">
                <div class="hud">
                    <h1>PUNTEGGI</h1>
                    <p>Scala Colore: 1000</p>
                    <p>Poker: 800</p>
                    <p>Full House: 600</p>
                    <p>Colore: 500</p>
                    <p>Scala: 400</p>
                    <p>Tris: 300</p>
                    <p>Doppia Coppia: 200</p>
                    <p>Coppia: 100</p>
                    <p>Carta Alta: 50</p>
                </div>
                <div class="hud">
                    <div class="stat"><strong>Punteggio:</strong> <span id="punteggio"> <?php echo $_SESSION['punteggioCorrente']?> </span></div>
                    <div class="stat"><strong>Punteggio minimo:</strong> <span id="puntMinimo"> 0 </span></div>
                    <div class="stat"><strong>Mani rimaste:</strong> <span id="maniRimaste"> <?php echo $_SESSION['mani_rimaste']?> </span></div>
                    <div class="stat"><strong>Scarti disponibili:</strong> <span id="scartiDisponibili"> <?php echo $_SESSION['scarti_disponibili']?> </span></div>
                </div>
                
            </div>
            <div class="c">
                <!-- BOTTONE ORDINA AGGIUNTI -->
                <div style="margin-bottom: 10px;">
                    <button id="ordinaNumero">Ordina per Numero</button>
                    <button id="ordinaSemeRank">Ordina per Colore</button>
                </div>
    
                <div class="carte-centrali"></div>
            </div>
    
            <div class="g">
                <button id="giocaButton">Gioca</button>
                <button id="scartaButton">Scarta</button>
                <div class="area-mano"></div>
                <div class="manoPoker"></div>
                <div class="status"></div>
                <div class="area-scarti">
                    <img id="dorsoScarti" src="../carte/dorso.svg" alt="Pila Scarti">
                    
                </div>
            </div>
        </div>
    </div>
</body>
</html>
