"use strict";
document.addEventListener('DOMContentLoaded', () => {
    
    const elementi = ["loginDiv", "registrazioneDiv", "shopDiv", "anteDiv", "schermataInizialeDiv"];
    function mostraSolo(idDaMostrare) {
        elementi.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add("hidden");
        });
        const target = document.getElementById(idDaMostrare);
        if (target) target.classList.remove("hidden");
    }
    
    const areaCentrale = document.querySelector('.carte-centrali');
    const giocaButton = document.getElementById('giocaButton');
    const scartaButton = document.getElementById('scartaButton');
    const manoPokerDiv = document.querySelector('.manoPoker');
    const punteggioSpan = document.getElementById('punteggio');
    const maniRimasteSpan = document.getElementById('maniRimaste');
    const scartiDisponibiliSpan = document.getElementById('scartiDisponibili');
    const ordinaNumeroBtn = document.getElementById('ordinaNumero');
    const ordinaSemeRankBtn = document.getElementById('ordinaSemeRank');
    
    const punteggiMinimi = [300, 450, 500, 650, 800, 1000, 2000, 3000, 5000];
    
    let roundCorrente = 0;
    let punteggioMinimo = punteggiMinimi[roundCorrente];
    let punteggioCorrente = 0;
    let maniRimaste = 3;
    let scartiDisponibili = 2;
    let carteScartate = [];
    let carteCentrali = []; 
    let numeroSelezionate = 0;

    function aggiornaHUD(valore, id) {
        const elemento = document.getElementById(id);
        if(elemento) elemento.textContent = valore;
    }

    function ordinaPerNumero(arr) {    
        numeroSelezionate = 0;
        return arr.sort((a, b) => b.numero - a.numero);
    }

    function ordinaPerSemeERank(arr) {
        const ordineSemi = {
            'cuori': 4,
            'quadri': 3,
            'fiori': 2,
            'picche': 1
        };
        return arr.sort((a, b) => {
            if (ordineSemi[b.seme] !== ordineSemi[a.seme]) {
                return ordineSemi[b.seme] - ordineSemi[a.seme];
            }
            numeroSelezionate = 0;
            return b.numero - a.numero;
        });
    }

    function renderCarte(carte) {
        areaCentrale.innerHTML = '';
        carte.forEach(carta => {
            const img = document.createElement('img');
            img.src = `../carte/${carta.seme}/${carta.numero}.svg`;
            img.alt = `Carta ${carta.numero} di ${carta.seme}`;
            img.classList.add('carta');
            img.dataset.numero = carta.numero;
            img.dataset.seme = carta.seme;
            img.addEventListener('click', () => {
                if(numeroSelezionate == 5 && !img.classList.contains('selezionata')){
                    return;
                }
                if(img.classList.contains('selezionata')){
                    numeroSelezionate--;
                    img.classList.toggle('selezionata');
                }
                else{
                    img.classList.toggle('selezionata');
                    numeroSelezionate++;
                }
            });
            areaCentrale.appendChild(img);
        });
    }

    ordinaNumeroBtn.addEventListener('click', () => {
        carteCentrali = ordinaPerNumero(carteCentrali);
        renderCarte(carteCentrali);
    });

    ordinaSemeRankBtn.addEventListener('click', () => {
        carteCentrali = ordinaPerSemeERank(carteCentrali);
        renderCarte(carteCentrali);
    });

    function pescaNuoveCarte(n) {
        fetch('../php/ante.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'pesca', quanti: n })
        })
        .then(res => res.json())
        .then(data => {
            if (data.carte) {
                const carteAttuali = [...areaCentrale.querySelectorAll('.carta')]
                    .filter(c => !c.classList.contains('selezionata'))
                    .map(c => ({
                        numero: parseInt(c.dataset.numero),
                        seme: c.dataset.seme
                    }));
                carteCentrali = carteAttuali.concat(data.carte);
                renderCarte(carteCentrali);
            }
        });
        carteScartate = [];
    }

    function caricaStatoDaSessione() {
        return fetch('../php/ante.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'caricaStato' })
        })
        .then(res => res.json())
        .then(data => {
            if (data.round !== undefined) roundCorrente = data.round;
            if (data.punteggioTotale !== undefined) punteggioCorrente = data.punteggioTotale;
            punteggioMinimo = punteggiMinimi[roundCorrente] || punteggiMinimi[punteggiMinimi.length - 1];
            aggiornaHUD(Number(punteggioMinimo), "puntMinimo");
            aggiornaHUD(punteggioCorrente, "punteggio");
            aggiornaHUD(data.mani ?? maniRimaste, "maniRimaste");
            aggiornaHUD(data.scarti ?? scartiDisponibili, "scartiDisponibili");
        })
        .catch(() => {
            punteggioMinimo = punteggiMinimi[roundCorrente];
            aggiornaHUD(Number(punteggioMinimo), "puntMinimo");
        });
    }

    function salvaStatoInSessione() {
        return fetch('../php/ante.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'salvaStato',
                round: roundCorrente,
                punteggioTotale: punteggioCorrente
            })
        });
    }

    giocaButton.addEventListener('click', () => {
        const carteGiocate = [...document.querySelectorAll('.carte-centrali .carta.selezionata')].map(carta => ({
            numero: parseInt(carta.dataset.numero, 10),
            seme: carta.dataset.seme
        }));

        if (carteGiocate.length === 0 && carteScartate.length === 0) {
            alert("Gioca o scarta almeno una carta!");
            return;
        }

        maniRimaste = Number(maniRimasteSpan.textContent);
        maniRimaste--;
        aggiornaHUD(maniRimaste, "maniRimaste");

        //fetch('../php/ante.php',{           //per aggiornare la sessione
        //    method: 'POST',
        //    headers: { 'Content-Type': 'application/json' },
        //    body: JSON.stringify({action: 'usaMano'})
        //})

        document.querySelectorAll('.carta.selezionata').forEach(c => {
            c.classList.add('animazione-scarto');
            setTimeout(() => c.remove(), 600);
        });

        setTimeout(() => {
            fetch('../php/ante.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'valutaMano',
                    carte: carteGiocate,
                    scarti: carteScartate
                })
            })
            .then(res => res.json())
            .then(data => {
                manoPokerDiv.textContent = 'Mano: ' + (data.result ?? 'N/A');

                if (data.punteggio) {
                    punteggioCorrente += data.punteggio;
                }

                const numeroDaPescare = (data.scartiEffettivi ?? carteScartate.length) + carteGiocate.length;
                pescaNuoveCarte(numeroDaPescare);
                numeroSelezionate = 0;
                aggiornaHUD(punteggioCorrente, "punteggio");

                if (punteggioCorrente >= punteggioMinimo) {
                    alert("Hai raggiunto il punteggio minimo per questo round! Vai allo shop.");
                    roundCorrente++;
                    punteggioMinimo = punteggiMinimi[roundCorrente] || punteggiMinimi[punteggiMinimi.length - 1];    
                    carteScartate = [];
                    carteCentrali = [];

                    // SALVATAGGIO del punteggio prima di resettare
                    salvaStatoInSessione()
                    .then(() => {
                        // Reset del gioco lato server
                        return fetch('../php/ante.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'resetGame' })
                        });
                    })
                    .then(res => res.json())
                    .then(result => {
                        if (!result.success) {
                            alert("Errore durante l'inizializzazione del gioco");
                            return;
                        }
                        // Aggiorna dati locali
                        scartiDisponibili = result.scarti;
                        maniRimaste = result.mani;
                        aggiornaHUD(maniRimaste, "maniRimaste");
                        aggiornaHUD(scartiDisponibili, "scartiDisponibili");

                        // Reset punteggio locale e aggiornamento HUD
                        punteggioCorrente = 0;
                        aggiornaHUD(0, "punteggio");

                        // Passa allo shop
                        return fetch('../php/ante.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'vaiAdShop' })
                        });
                    })
                    .then(res => res.json())
                    .then(dataShop => {
                        if (!dataShop.success) throw new Error("Errore nella richiesta al server di passare allo shop.");

                        // Aggiorna i valori visualizzati nello shop
                        const maniSpan = document.getElementById('maniRimaste');
                        const scartiSpan = document.getElementById('scarti');
                        const punteggioRoundSpan = document.getElementById('punteggioRound');
                        const punteggioTotaleSpan = document.getElementById('punteggioTotale');

                        if (maniSpan) maniSpan.textContent = dataShop.maniRimaste ?? maniRimaste;
                        if (scartiSpan) scartiSpan.textContent = dataShop.scarti ?? scartiDisponibili;
                        if (punteggioRoundSpan) punteggioRoundSpan.textContent = dataShop.punteggioRound ?? 0;

                        // Carica lo stato per punteggio totale aggiornato
                        return fetch('../php/ante.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'caricaStato' })
                        });
                    })
                    .then(res => res.json())
                    .then(dataStato => {
                        const punteggioTotaleSpan = document.getElementById('punteggioTotale');
                        if (punteggioTotaleSpan) punteggioTotaleSpan.textContent = dataStato.punteggioTotale ?? 0;

                        // Mostra lo shop
                        mostraSolo('shopDiv');
                    })
                    .catch(error => {
                        console.error("Errore nel processo di fine round:", error);
                        alert("Errore nella comunicazione con il server.");
                    });

                } else if (maniRimaste === 0) {
                    alert("Hai perso! Punteggio insufficiente.");
                    roundCorrente = 0;
                    punteggioMinimo = punteggiMinimi[roundCorrente];    
                    carteScartate = [];
                    carteCentrali = [];
                    punteggioCorrente = 0;
                    aggiornaHUD(0, "punteggio");

                    salvaStatoInSessione()
                    .then(() => {
                        return fetch('../php/ante.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'vaiASchermataIniziale' })
                        });
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (!data.success) {
                            throw new Error("Errore nella richiesta al server di tornare alla schermata iniziale");
                        }
                        mostraSolo("schermataInizialeDiv");
                    })
                    .catch(error => {
                        console.error("Errore nel fetch:", error);
                        alert("Errore nella comunicazione con il server per andare a schermata iniziale.");
                    });
                }
            });
        }, 600);
    });

    fetch('../php/ante.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getCarteCentrali' })
    })
    .then(res => res.json())
    .then(data => {
        if(data.carte) {
            carteCentrali = data.carte;
            renderCarte(carteCentrali);
        }
    });

    scartaButton.addEventListener('click', () => {
        if (scartiDisponibili <= 0) {
            alert("Hai esaurito gli scarti disponibili!");
            return;
        }
    
        const selezionate = [...document.querySelectorAll('.carta.selezionata')].filter(carta => {
            return areaCentrale.contains(carta);
        });
    
        if (selezionate.length === 0) {
            alert("Seleziona almeno una carta da scartare!");
            return;
        }
    
        scartiDisponibili = Number(scartiDisponibiliSpan.textContent);
        scartiDisponibili--;
        aggiornaHUD(scartiDisponibili, "scartiDisponibili");
    
        selezionate.forEach(carta => {
            const cartaObj = {
                numero: parseInt(carta.dataset.numero),
                seme: carta.dataset.seme
            };
            carteScartate.push(cartaObj);
            carta.classList.add('animazione-scarto');
        });
    
        setTimeout(() => {
            selezionate.forEach(carta => carta.remove());
            numeroSelezionate = 0;
            pescaNuoveCarte(selezionate.length);
        }, 500);
    });

    caricaStatoDaSessione();
});
