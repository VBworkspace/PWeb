document.addEventListener("DOMContentLoaded", () => {
    const sezioni = ["loginDiv", "registrazioneDiv", "schermataInizialeDiv", "shopDiv", "anteDiv"];
    const upgradeM = document.getElementById("upM");
    const upgradeS = document.getElementById("upS");
    upgradeM.addEventListener('click', compraM);
    upgradeS.addEventListener('click', compraS);
    const pianeti = document.getElementsByClassName("pianeti-slot");
    const punteggioTotaleSpan = document.getElementById('punteggioTotale');
    const giocaBtn = document.getElementById("giocaBtn");
    const vaiGiocoBtn = document.getElementById("vaiGioco");

    const punteggiMinimi = [300, 450, 500, 650, 800, 1000, 2000, 3000, 5000];

    for(let e of pianeti){
        e.addEventListener('click', compraPianeta);
    }

    function compraPianeta(event){
        const pianeta = event.target;
        
    }

    function compraM(){
        fetch('../php/ante.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ action: 'compraMano' })
        })
        .then(response => response.json())
                    .then(data => {
                        if (!data.success) {
                            throw new Error("Non hai abbastanza punti per comprare l\'upgrade");
                        }
                        else{
                            alert("Hai comprato 1 Mano in più");
                            aggiornaPunteggio();
                            upgradeM.textContent = "Mano in più acquistata";
                            upgradeM.removeEventListener('click', compraM);
                            //data.punteggioAggiornato
                        }
                    })
    }

    function compraS(){
        fetch('../php/ante.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ action: 'compraScarto' })
        })
        .then(response => response.json())
                    .then(data => {
                        if (!data.success) {
                            throw new Error("Non hai abbastanza punti per comprare l\'upgrade");
                        }
                        else{
                            alert("Hai comprato 1 Scarto in più");
                            aggiornaPunteggio();
                            upgradeS.textContent = "Scarto in più acquistata";
                            upgradeS.removeEventListener('click', compraS);
                            //data.punteggioAggiornato
                        }
                    })
    }

    function mostraSolo(idDaMostrare) {
        sezioni.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add("hidden");
        });
        const target = document.getElementById(idDaMostrare);
        if (target) target.classList.remove("hidden");
    }


    if (giocaBtn) {
        giocaBtn.addEventListener("click", () => {
            mostraSolo("shopDiv");
        });
    }


    function aggiornaPunteggio() {
        fetch('../php/ante.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ action: 'caricaStato' })
        })
        .then(res => res.json())
        .then(data => {
            punteggioTotaleSpan.textContent = data.punteggioTotale ?? 0;
        });
    }

    aggiornaPunteggio();

    const items = document.querySelectorAll('.item');
    items.forEach(item => {
        item.addEventListener('click', () => {
            const costo = parseInt(item.dataset.costo);
            const oggetto = item.dataset.oggetto;
            fetch('../php/ante.php', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    action: 'compra',
                    costo,
                    oggetto
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert(`Hai acquistato: ${oggetto}`);
                    aggiornaPunteggio();
                } else {
                    alert('Punti insufficienti per l\'acquisto!');
                }
            });
        });
    });

    if (vaiGiocoBtn) {
        vaiGiocoBtn.addEventListener('click', () => {
            fetch('../php/ante.php', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ action: 'vaiAdAnte' })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success && data.targetDiv) {
                    mostraSolo(data.targetDiv);
                    const scartiDiv = document.getElementById("scartiDisponibili");
                    const maniDiv = document.getElementById("maniRimaste");
                    const puntiGioco = document.getElementById("punteggio");
                    scartiDiv.textContent = data.scartiTot;
                    maniDiv.textContent = data.maniTot;
                    puntiGioco.textContent = "0";
                    const puntMinimo = document.getElementById("puntMinimo");
                    
                } else {
                    alert(data.message || 'Errore durante il passaggio alla fase Ante.');
                }
            });
        });
    }

    // Opzionale: reset
    // const resetGameBtn = document.getElementById('resetGameBtn');
    // if (resetGameBtn) {
    //     resetGameBtn.addEventListener('click', () => {
    //         fetch('../php/ante.php', {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify({ action: 'reset' })
    //         })
    //         .then(() => {
    //             alert('Gioco resettato!');
    //             aggiornaPunteggio();
    //         });
    //     });
    // }
});
