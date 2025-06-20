    document.addEventListener("DOMContentLoaded", () => {
        const sezioni = ["loginDiv", "registrazioneDiv", "schermataInizialeDiv", "shopDiv", "anteDiv"];
        const upgradeM = document.getElementById("upM");
        const upgradeS = document.getElementById("upS");
        const pianeti = document.getElementsByClassName("pianeti-slot");
        const punteggioTotaleSpan = document.getElementById('punteggioTotale');
        const giocaBtn = document.getElementById("giocaBtn");
        const vaiGiocoBtn = document.getElementById("vaiGioco");

        const punteggiMinimi = [300, 450, 500, 650, 800, 1000, 2000, 3000, 5000];

        for (let e of pianeti) {
            e.addEventListener('click', compraPianeta);
        }

        function compraPianeta(event) {
            const pianeta = event.target;
            // Funzionalità da completare
        }

        upgradeM.addEventListener('click', compraM);
        upgradeS.addEventListener('click', compraS);

        async function compraM() {
            try {
                const res = await fetch('../php/ante.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'compraMano' })
                });

                const data = await res.json();
                if (!data.success) {
                    throw new Error("Non hai abbastanza punti per comprare l'upgrade");
                }

                alert("Hai comprato 1 Mano in più");
                await aggiornaPunteggio();
                upgradeM.textContent = "Mano in più acquistata";
                upgradeM.removeEventListener('click', compraM);

            } catch (err) {
                alert(err.message);
            }
        }

        async function compraS() {
            try {
                const res = await fetch('../php/ante.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'compraScarto' })
                });

                const data = await res.json();
                if (!data.success) {
                    throw new Error("Non hai abbastanza punti per comprare l'upgrade");
                }

                alert("Hai comprato 1 Scarto in più");
                await aggiornaPunteggio();
                upgradeS.textContent = "Scarto in più acquistata";
                upgradeS.removeEventListener('click', compraS);

            } catch (err) {
                alert(err.message);
            }
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

        async function aggiornaPunteggio() {
            try {
                const res = await fetch('../php/ante.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'caricaStato' })
                });

                const data = await res.json();
                punteggioTotaleSpan.textContent = data.punteggioTotale ?? 0;

            } catch (err) {
                console.error("Errore nell'aggiornamento del punteggio:", err);
            }
        }

        aggiornaPunteggio();

        const items = document.querySelectorAll('.item');
        items.forEach(item => {
            item.addEventListener('click', async () => {
                const costo = parseInt(item.dataset.costo);
                const oggetto = item.dataset.oggetto;

                try {
                    const res = await fetch('../php/ante.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'compra', costo, oggetto })
                    });

                    const data = await res.json();
                    if (data.success) {
                        alert(`Hai acquistato: ${oggetto}`);
                        await aggiornaPunteggio();
                    } else {
                        alert('Punti insufficienti per l\'acquisto!');
                    }

                } catch (err) {
                    alert("Errore durante l'acquisto: " + err.message);
                }
            });
        });

        if (vaiGiocoBtn) {
            vaiGiocoBtn.addEventListener('click', async () => {
                try {
                    const res = await fetch('../php/ante.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'vaiAdAnte' })
                    });

                    const data = await res.json();
                    if (data.success && data.targetDiv) {
                        mostraSolo(data.targetDiv);
                        document.getElementById("scartiDisponibili").textContent = data.scartiTot;
                        document.getElementById("maniRimaste").textContent = data.maniTot;
                        document.getElementById("punteggio").textContent = "0";
                        document.getElementById("puntMinimo").textContent = punteggiMinimi[data.round];
                    } else {
                        alert(data.message || 'Errore durante il passaggio alla fase Ante.');
                    }

                } catch (err) {
                    alert("Errore nella transizione alla fase Ante: " + err.message);
                }
            });
        }

    });
