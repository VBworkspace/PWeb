"use strict";
document.addEventListener('DOMContentLoaded', () => {
    let numeroSelezionate = 0;

    const elementi = ["loginDiv", "registrazioneDiv", "shopDiv", "anteDiv", "schermataInizialeDiv"];
    function mostraSolo(idDaMostrare) {
        elementi.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add("hidden");
        });
        const target = document.getElementById(idDaMostrare);
        if (target) target.classList.remove("hidden");
    }

    const areaScarti = document.querySelector('.area-scarti');
    const areaCentrale = document.querySelector('.carte-centrali');
    const areaMano = document.querySelector('.area-mano');
    const giocaButton = document.getElementById('giocaButton');
    const scartaButton = document.getElementById('scartaButton');
    const manoPokerDiv = document.querySelector('.manoPoker');
    const contatoreScarti = document.querySelector('.contatore-scarti');
    const punteggioSpan = document.getElementById('punteggio');
    const punteggioMinimoSpan = document.getElementById('punteggioMinimo');
    const maniRimasteSpan = document.getElementById('maniRimaste');
    const scartiDisponibiliSpan = document.getElementById('scartiDisponibili');
    const ordinaNumeroBtn = document.getElementById('ordinaNumero');
    const ordinaSemeRankBtn = document.getElementById('ordinaSemeRank');

    const MAX_CARTE = 5;

    let carteScartate = [];
    let carteCentrali = [];  // <-- variabile globale per tracciare le carte correnti nell'area centrale

    // === HUD ===
    const punteggiMinimi = [300, 450, 500, 650, 800, 1000];
    let roundCorrente = 0;
    let punteggioMinimo = punteggiMinimi[roundCorrente];
    let punteggio = 0;
    let maniRimaste = 3;
    let scartiDisponibili = 2;

    function aggiornaHUD() {
        punteggioSpan.textContent = punteggio;
        punteggioMinimoSpan.textContent = punteggioMinimo;
        maniRimasteSpan.textContent = maniRimaste;
        scartiDisponibiliSpan.textContent = scartiDisponibili;
    }

    function updatePilaScarti() {
        contatoreScarti.textContent = carteScartate.length;
    }

    // Mappa semi per ordine: cuori > quadri > fiori > picche
    const ordineSemi = {
        'cuori': 4,
        'quadri': 3,
        'fiori': 2,
        'picche': 1
    };

    // Ordina per numero decrescente
    function ordinaPerNumero(arr) {     //DEFAULT
        numeroSelezionate = 0;
        return arr.sort((a, b) => b.numero - a.numero);
    }

    // Ordina per seme (decrescente) e numero (decrescente)
    function ordinaPerSemeERank(arr) {
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
            ordinaPerNumero(carte);
            areaCentrale.appendChild(img);
        });
    }

    // Event listener bottoni ordina
    ordinaNumeroBtn.addEventListener('click', () => {
        carteCentrali = ordinaPerNumero(carteCentrali);
        renderCarte(carteCentrali);
    });

    ordinaSemeRankBtn.addEventListener('click', () => {
        carteCentrali = ordinaPerSemeERank(carteCentrali);
        renderCarte(carteCentrali);
    });

            // Resto del codice...

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
                .filter(c => !c.classList.contains('selezionata'))  // Esclude quelle appena giocate
                .map(c => ({
                    numero: parseInt(c.dataset.numero),
                    seme: c.dataset.seme
                }));
                carteCentrali = carteAttuali.concat(data.carte); // AGGIORNA carteCentrali!
                renderCarte(carteCentrali);
            }
        });
        carteScartate = [];
    }

    // Carica stato da sessione
    function caricaStatoDaSessione() {
        return fetch('../php/ante.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'caricaStato' })
        })
        .then(res => res.json())
        .then(data => {
            if (data.round !== undefined) roundCorrente = data.round;
            if (data.punteggioMassimo !== undefined) punteggio = data.punteggioMassimo;
            punteggioMinimo = punteggiMinimi[roundCorrente] || punteggiMinimi[punteggiMinimi.length - 1];
            aggiornaHUD();
        })
        .catch(() => {
            punteggioMinimo = punteggiMinimi[roundCorrente];
            aggiornaHUD();
        });
    }

    // Salva stato in sessione
    function salvaStatoInSessione() {
        return fetch('../php/ante.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'salvaStato',
                round: roundCorrente,
                punteggioMassimo: punteggio
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
        maniRimaste--;
        aggiornaHUD();
    
        // Effetto visivo di scarto per giocate
        document.querySelectorAll('.carta.selezionata').forEach(c => {
            c.classList.add('animazione-scarto');
            setTimeout(() => c.remove(), 600);
        });
    
        // Anche per eventuali carte scartate già rimosse
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
                    punteggio += data.punteggio;
                }
    
                const numeroDaPescare = (data.scartiEffettivi ?? carteScartate.length) + carteGiocate.length;
                pescaNuoveCarte(numeroDaPescare);
                numeroSelezionate = 0;
                updatePilaScarti();
                aggiornaHUD();
    
                // Controlli di fine round
                if (punteggio >= punteggioMinimo) {
                    alert("Hai raggiunto il punteggio minimo per questo round! Vai allo shop.");
                    roundCorrente++;
                    punteggioMinimo = punteggiMinimi[roundCorrente] || punteggioMinimo;
                    carteScartate = [];
                    salvaStatoInSessione();
                    fetch('../php/ante.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'vaiAdShop' })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (!data.success) {
                            throw new Error("Errore nella richiesta al server di passare allo shop.");
                        }
                        //return data.json(); // opzionale
                    })
                    .catch(error => {
                        console.error("Errore nel fetch:", error);
                        alert("Errore nella comunicazione con il server per andare allo shop.");
                    });
                    mostraSolo('shopDiv');

                    //mostraSolo("shopDiv");
                } else if (maniRimaste === 0) {
                    alert("Hai perso! Punteggio insufficiente.");
                    carteScartate = [];
                    salvaStatoInSessione();
                    fetch('../php/ante.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'vaiASchermataIniziale' })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if(!data.success){
                            throw new Error("Errore nella richiesta al server di tornare alla schermata iniziale");
                        }
                        return data.json();
                    })
                    .catch(error => {
                        console.error("Errore nel fetch:", error);
                        alert("Errore nella comunicazione con il server per andare a schermata iniziale.");
                    });
                    mostraSolo(then.targetDiv);
                }
            });
        }, 600);
    });
    
            

    // Fetch iniziale carte centrali
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
    
        scartiDisponibili--;
        aggiornaHUD();
    
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
            updatePilaScarti();
            numeroSelezionate = 0;
            pescaNuoveCarte(selezionate.length); // 👈 Qui viene pescato lo stesso numero di carte
        }, 600);
    });
    caricaStatoDaSessione();
});