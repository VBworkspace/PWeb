const upgradeM = document.getElementById("upM");
const upgradeS = document.getElementById("upS");
import { compraM, compraS, addListeners, removeListeners } from './shop.js';
const punteggiMinimi = [0,300, 450, 500, 650, 800, 1000, 2000, 3000, 4000, 5000, 7000, 10000, 20000];

"use strict";
document.addEventListener('DOMContentLoaded', () => {
    
    const elementi = ["loginDiv", "registrazioneDiv", "shopDiv", "anteDiv", "schermataInizialeDiv", "classificaDiv"];
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
    //const punteggioSpan = document.getElementById('punteggio');
    const maniRimasteSpan = document.getElementById('maniRimaste');
    //const scartiDisponibiliSpan = document.getElementById('scartiDisponibili');
    const ordinaNumeroBtn = document.getElementById('ordinaNumero');
    const ordinaSemeRankBtn = document.getElementById('ordinaSemeRank');
    const roundInfo = document.getElementById("round-info");
    //const punteggioRoundSpan = document.getElementById('puntMinimo');
    //const punteggioTotaleSpan = document.getElementById('punteggioTotale');

    let roundCorrente = 1;
    let punteggioMinimo = punteggiMinimi[1];
    let punteggioCorrente = 0;
    let maniRimaste = 3;
    let scartiDisponibili = 2;
    let carteScartate = [];
    let carteCentrali = [];
    let numeroSelezionate = 0;

    function aggiornaHUD(valore, id) {
        const elemento = document.getElementById(id);
        if (elemento) elemento.textContent = valore;
    }

    function ordinaPerNumero(arr) {
        numeroSelezionate = 0;
        return arr.sort((a, b) => b.numero - a.numero);
    }

    function ordinaPerSemeERank(arr) {
        const ordineSemi = { 'cuori': 4, 'quadri': 3, 'fiori': 2, 'picche': 1 };
        numeroSelezionate = 0;
        return arr.sort((a, b) => ordineSemi[b.seme] - ordineSemi[a.seme] || b.numero - a.numero);
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
                if (numeroSelezionate === 5 && !img.classList.contains('selezionata')) return;
                img.classList.toggle('selezionata');
                numeroSelezionate += img.classList.contains('selezionata') ? 1 : -1;
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

    async function pescaNuoveCarte(n) {
        try {
            const res = await fetch('../php/ante.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'pesca', quanti: n })
            });
            const data = await res.json();
            if (data.carte) {
                const carteAttuali = [...areaCentrale.querySelectorAll('.carta')].filter(c => !c.classList.contains('selezionata')).map(c => ({
                    numero: parseInt(c.dataset.numero),
                    seme: c.dataset.seme
                }));
                carteCentrali = carteAttuali.concat(data.carte);
                renderCarte(carteCentrali);
            }
            carteScartate = [];
            numeroSelezionate = 0;
        } catch (error) {
            console.error("Errore durante la pesca delle carte:", error);
        }
    }    

    async function caricaStatoDaSessione() {
        try {
            const res = await fetch('../php/ante.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'caricaStato' })
            });
            const data = await res.json();
            if (data.round !== undefined) roundCorrente = data.round;
            punteggioMinimo = punteggiMinimi[data.round] || punteggiMinimi.at(-1);
            //console.log("Sono in ante, punt minimo: " + punteggioMinimo);
            aggiornaHUD(punteggioMinimo, "puntMinimo");
            aggiornaHUD(punteggioCorrente, "punteggio");
            aggiornaHUD(data.mani ?? maniRimaste, "maniRimaste");
            aggiornaHUD(data.scarti ?? scartiDisponibili, "scartiDisponibili");
        } catch (e) {
            punteggioMinimo = punteggiMinimi[roundCorrente];
            aggiornaHUD(punteggioMinimo, "puntMinimo");
        }
    }

    async function salvaStatoInSessione() {
        try {
            await fetch('../php/ante.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'salvaStato',
                    round: roundCorrente,
                    punteggioCorr: punteggioCorrente
                })
            });
        } catch (e) {
            console.error("Errore durante il salvataggio della sessione:", e);
        }
    }

    giocaButton.addEventListener('click', giocaCarte);
    scartaButton.addEventListener('click', scartaCarte);

    async function giocaCarte() {
        const carteGiocate = getCarteGiocate();
    
        if (!puoiGiocare(carteGiocate)) return;
        decrementaMani();
        animaScartoCarte();
        giocaButton.removeEventListener('click', giocaCarte);
        scartaButton.removeEventListener('click', scartaCarte);
    
        setTimeout(async () => {
            try {
                const valutazione = await valutaMano(carteGiocate);
                await pescaNuoveCarte(valutazione.numeroDaPescare);
                aggiornaHUD(punteggioCorrente, "punteggio");
                const resPunti = await fetch('../php/ante.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({action: 'caricaStato'})
                });
                const data = await resPunti.json();
                //console.log("mani rimaste: " + maniRimasteSpan.textContent);
                //console.log("scarti rimasti: " + scartiDisponibiliSpan.textContent);
                giocaButton.addEventListener('click', giocaCarte);
                scartaButton.addEventListener('click', scartaCarte);
                numeroSelezionate = 0;
                if (punteggioCorrente >= punteggiMinimi[data.round]) {
                    await gestisciVittoriaRound();
                } else if (maniRimaste === 0) {
                    await gestisciSconfitta();
                }
            } catch (e) {
                console.error("Errore in giocaCarte:", e);
                alert("Errore nella comunicazione con il server.");
            }
        }, 600);
    }

    async function scartaCarte(){
        giocaButton.removeEventListener('click', giocaCarte);
        scartaButton.removeEventListener('click', scartaCarte);
        if (scartiDisponibili <= 0) {
            alert("Hai esaurito gli scarti disponibili!");
            giocaButton.addEventListener('click', giocaCarte);
            scartaButton.addEventListener('click', scartaCarte);
            return;
        }

        const selezionate = [...document.querySelectorAll('.carta.selezionata')].filter(carta => areaCentrale.contains(carta));
        if (selezionate.length === 0) {
            alert("Seleziona almeno una carta da scartare!");
            giocaButton.addEventListener('click', giocaCarte);
            scartaButton.addEventListener('click', scartaCarte);
            return;
        }

        scartiDisponibili--;
        aggiornaHUD(scartiDisponibili, "scartiDisponibili");

        selezionate.forEach(carta => {
            carteScartate.push({
                numero: parseInt(carta.dataset.numero),
                seme: carta.dataset.seme
            });
            carta.classList.add('animazione-scarto');
        });

        setTimeout(async () => {
            selezionate.forEach(carta => carta.remove());
            numeroSelezionate = 0;
            await pescaNuoveCarte(selezionate.length);
            giocaButton.addEventListener('click', giocaCarte);
            scartaButton.addEventListener('click', scartaCarte);
            numeroSelezionate = 0;
        }, 500);
    }
    
    function getCarteGiocate() {
        return [...document.querySelectorAll('.carte-centrali .carta.selezionata')].map(carta => ({
            numero: parseInt(carta.dataset.numero, 10),
            seme: carta.dataset.seme
        }));
    }
    
    function puoiGiocare(carteGiocate) {
        if (carteGiocate.length === 0 && carteScartate.length === 0) {
            alert("Gioca o scarta almeno una carta!");
            return false;
        }
        return true;
    }
    
    function decrementaMani() {
        maniRimaste = Number(maniRimasteSpan.textContent) - 1;
        aggiornaHUD(maniRimaste, "maniRimaste");
    }
    
    function animaScartoCarte() {
        document.querySelectorAll('.carta.selezionata').forEach(c => {
            c.classList.add('animazione-scarto');
            setTimeout(() => c.remove(), 600);
        });
    }
    
    async function valutaMano(carteGiocate) {
        const res = await fetch('../php/ante.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'valutaMano',
                carte: carteGiocate,
                scarti: carteScartate
            })
        });
        const data = await res.json();
        manoPokerDiv.textContent = 'Mano: ' + (data.result ?? 'N/A');
        if (data.punteggio) punteggioCorrente += data.punteggio;
        const numeroDaPescare = (data.scartiEffettivi ?? carteScartate.length) + carteGiocate.length;
        return { numeroDaPescare };
    }

    async function fetchHighscore() {
        try {
            const res = await fetch('../php/ante.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'salvaHighscore' })
            });
            const data = await res.json();
            if (data.success) {
                console.log("Highscore:", data.highscore);
                console.log(data.username);
            } else {
                console.error("Errore nel recuperare l'highscore");
            }
        } catch (error) {
            console.error("Errore durante la fetch dell'highscore:", error);
        }
    }
    
    
    async function gestisciVittoriaRound() {
        alert("Hai raggiunto il punteggio minimo per questo round! Vai allo shop.");
        carteScartate = [];
        carteCentrali = [];
    
        const stato = await caricaStatoRound();
        roundCorrente = stato.round;
        punteggioMinimo = punteggiMinimi[roundCorrente] || punteggiMinimi.at(-1);
        aggiornaHUD(punteggioMinimo, "puntMinimo");
        await salvaStatoInSessione();
        punteggioCorrente = 0;
        
        const reset = await fetchJson({ action: 'resetGame' });
        if (!reset.success) throw new Error("Errore durante resetGame");
        
        roundInfo.textContent = "Round: " + reset.round;
        scartiDisponibili = reset.scarti;
        maniRimaste = reset.mani;
        aggiornaHUD(maniRimaste, "maniRimaste");
        aggiornaHUD(scartiDisponibili, "scartiDisponibili");
        aggiornaHUD(0, "punteggio");
        manoPokerDiv.textContent = " ";
        const dataShop = await fetchJson({ action: 'vaiAdShop' });
        if (!dataShop.success) throw new Error("Errore shop");
        //await caricaStatoDaSessione();
        //aggiornaHUD(dataShop.maniRimaste ?? maniRimaste, "maniRimaste");
        aggiornaHUD(dataShop.punteggioRound, "puntMinimo");
        //aggiornaHUD(dataShop.scarti ?? scartiDisponibili, "scartiDisponibili");
        //aggiornaHUD(dataShop.round, "round-info");
        //punteggioRoundSpan.textContent = dataShop.punteggioRound ?? 0;    ///////////////////
        const finale = await caricaStatoRound();
        aggiornaHUD(finale.punteggioTotale, "punteggioTotale");
        //punteggioTotaleSpan.textContent = finale.punteggioTotale ?? 0;    ///////////////////
        mostraSolo('shopDiv');
        areaCentrale.innerHTML = '';
        carteCentrali = [];
        await pescaNuoveCarte(8, true); 
        numeroSelezionate = 0;  
        //renderCarte(carteCentrali);
        await fetchHighscore();
    }
    
    async function gestisciSconfitta() {
        alert("Hai perso! Punteggio insufficiente.");
        roundCorrente = 1;
        carteScartate = [];
        carteCentrali = [];
        punteggioCorrente = 0;
        scartiDisponibili = 2;
        maniRimaste = 3;
        aggiornaHUD(0, "punteggio");
        aggiornaHUD(0, "punteggioTotale");
        aggiornaHUD(0, "round-info");
        aggiornaHUD(3, "maniRimaste");
        aggiornaHUD(2, "scartiDisponibili");
        removeListeners();
        addListeners();
        aggiornaHUD("[+1 Scarto (1000 punti)]", "upS");
        aggiornaHUD("[+1 Mano (1000 punti)]", "upM");
        areaCentrale.innerHTML = '';
        carteCentrali = [];
        await pescaNuoveCarte(8, true); 
        await salvaStatoInSessione();
        const data = await fetchJson({ action: 'vaiASchermataIniziale' });
        if (!data.success) throw new Error("Errore tornare schermata iniziale");
        await caricaStatoDaSessione();
        mostraSolo("schermataInizialeDiv");
    }

    async function caricaStatoRound() {
        const res = await fetch('../php/ante.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'caricaStato' })
        });
        return await res.json();
    }
    
    async function fetchJson(payload) {
        const res = await fetch('../php/ante.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return await res.json();
    }

    (async () => {
        await caricaStatoDaSessione();
        try {
            const res = await fetch('../php/ante.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getCarteCentrali' })
            });
            const data = await res.json();
            if (data.carte) {
                carteCentrali = data.carte;
                renderCarte(carteCentrali);
            }
        } catch (e) {
            console.error("Errore nel caricamento carte iniziali:", e);
        }
    })();
});