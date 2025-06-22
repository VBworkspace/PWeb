import { compraM, compraS, addListeners, removeListeners } from './shop.js';
const upgradeM = document.getElementById("upM");
const upgradeS = document.getElementById("upS");

document.addEventListener("DOMContentLoaded", () => {
    const elementi = ["loginDiv", "registrazioneDiv", "shopDiv", "anteDiv", "schermataInizialeDiv", "classificaDiv"];


    function mostraSolo(idDaMostrare) {
        elementi.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add("hidden");
        });
        const target = document.getElementById(idDaMostrare);
        if (target) target.classList.remove("hidden");
    }

    document.getElementById('welcome-message').textContent = 'Bentornato/a nel gioco !';
    const logoutBtn = document.getElementById("logout-icon");
    logoutBtn.addEventListener('click', logout);

    async function logout() {
        try {
            const response = await fetch('../php/logout.php', {
                method: 'POST',
            });
            const result = await response.json();
            if (result.success) {
                mostraSolo("loginDiv");
                removeListeners();
                addListeners();

                alert("Logout eseguito con successo!");
            } else {
                alert('Errore durante il logout');
            }
        } catch (err) {
            console.error('Errore di rete durante il logout:', err);
        }
    }
    
    document.getElementById('giocaBtn').addEventListener('click', async () => {
        try {
            const response = await fetch('../php/ante.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'startGame' })
            });
            const result = await response.json();

            const response2 = await fetch('../php/ante.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'inizializza' })
            });
            const result2 = await response2.json();

            if (result.success && result2.success) {    // && result.targetDiv
                mostraSolo(result.targetDiv);
                fetch('../php/ante.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'caricaStatus',  })
                });
            } else {
                alert(result.message || 'Errore durante l\'avvio del gioco.'); 
            }
        } catch (err) {
            console.error(err);
            alert('Errore di rete o del server.');
        }
    });

    document.getElementById('classificaBtn').addEventListener('click', async () => {
        try {
            const response = await fetch('../php/ante.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'mostraClassifica' })
            });

            const result = await response.json();
            if(!result.success){
                return;
            }
            const classifica = result.classifica;
            const tabella = document.getElementById("righeClassifica");
            removeAllChildren(tabella);
            for(let i = 0; i < classifica.length; i++){
                console.log(classifica[i].username);
                console.log(classifica[i].data);
                console.log(classifica[i].punteggio);
                const riga = document.createElement('tr');
                const cella0 = document.createElement('td');
                cella0.textContent = classifica[i].username;
                const cella1 = document.createElement('td');
                cella1.textContent = classifica[i].punteggio;
                const cella2 = document.createElement('td');
                cella2.textContent = classifica[i].data;
                riga.appendChild(cella0);
                riga.appendChild(cella1);
                riga.appendChild(cella2);
                tabella.appendChild(riga);
            }
            mostraSolo("classificaDiv");
            const indietro = document.getElementById("schermataDaClassifica");
            indietro.addEventListener('click', tornaSchermata);
            
        } catch (err) {
            console.error(err);
            alert('Errore di rete o del server.');
        }
    });

    function removeAllChildren(element){
        while(element.firstChild){
            element.removeChild(element.firstChild);
        }
    }

    async function tornaSchermata(){
        const res = await fetch('../php/ante.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'vaiASchermataIniziale' })
        });
        const resp = await res.json();
        if(!resp.success){
            alert("Qualcosa è andato storto nel tornare alla schermata principale");
            return;
        }
        mostraSolo("schermataInizialeDiv");
    }
});