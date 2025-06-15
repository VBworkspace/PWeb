document.addEventListener("DOMContentLoaded", () => {
    const elementi = ["loginDiv", "registrazioneDiv", "shopDiv", "anteDiv", "schermataInizialeDiv"];
    function mostraSolo(idDaMostrare) {
    elementi.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add("hidden");
    });
    const target = document.getElementById(idDaMostrare);
    if (target) target.classList.remove("hidden");
}
// Mostra un messaggio di benvenuto statico o personalizzato

    document.getElementById('welcome-message').textContent = 'Bentornato/a nel gioco !';

// Azione per il bottone GIOCA
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

            if (result.success && result.targetDiv && result2.success) {
                mostraSolo(result.targetDiv);
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

            if (result.success) {
                // Nascondo tutte le sezioni tranne classificaDiv
                const elementi = ["loginDiv", "registrazioneDiv", "shopDiv", "anteDiv", "schermataInizialeDiv"];
                elementi.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.classList.add("hidden");
                });
                const classificaDiv = document.getElementById('classificaDiv');
                classificaDiv.classList.remove("hidden");

                // Pulisco il contenuto precedente
                classificaDiv.innerHTML = '<h2>Classifica</h2>';

                // Creo una lista ordinata con i dati della classifica
                const ol = document.createElement('ol');

                result.classifica.forEach(entry => {
                    const li = document.createElement('li');
                    li.textContent = `${entry.giocatore} - Punteggio: ${entry.punteggio}`;
                    ol.appendChild(li);
                });

                classificaDiv.appendChild(ol);

            } else {
                alert(result.message || 'Errore nel caricamento della classifica.');
            }
        } catch (err) {
        console.error(err);
        alert('Errore di rete o del server.');
        }
    });
});