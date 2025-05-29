document.addEventListener("DOMContentLoaded", () => {
    const sezioni = ["loginDiv", "registrazioneDiv", "schermataInizialeDiv", "shopDiv", "anteDiv"];

    function mostraSolo(idDaMostrare) {
        sezioni.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add("hidden");
        });
        const target = document.getElementById(idDaMostrare);
        if (target) target.classList.remove("hidden");
    }


    const giocaBtn = document.getElementById("giocaBtn");

    if (giocaBtn) {
        giocaBtn.addEventListener("click", () => {
            mostraSolo("shopDiv");
        });
    }

    const punteggioTotaleSpan = document.getElementById('punteggioTotale');

    function aggiornaPunteggio() {
        fetch('../php/ante.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ action: 'caricaStato' })
        })
        .then(res => res.json())
        .then(data => {
            punteggioTotaleSpan.textContent = data.punteggioMassimo ?? 0;
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

    const vaiGiocoBtn = document.getElementById("vaiGioco");
    vaiGiocoBtn.addEventListener('click', async () => {
        fetch('../php/ante.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ action: 'vaiAdAnte' })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.targetDiv) {
                mostraSolo(data.targetDiv);
            } else {
                alert(data.message || 'Errore durante il passaggio alla fase Ante.'); 
            }
        });
    });


    //resetGameBtn.addEventListener('click', () => {
    //    fetch('../php/ante.php', {
    //        method: 'POST',
    //        headers: { 'Content-Type': 'application/json' },
    //        body: JSON.stringify({ action: 'reset' })
    //    })
    //    .then(() => {
    //        alert('Gioco resettato!');
    //        aggiornaPunteggio();
    //    });
    //});
});