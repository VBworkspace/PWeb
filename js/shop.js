const upgradeM = document.getElementById("upM");
const upgradeS = document.getElementById("upS");
export function addListeners() {
    upgradeM.addEventListener('click', compraM);
    upgradeS.addEventListener('click', compraS);
}

export function removeListeners() {
    upgradeM.removeEventListener('click', compraM);
    upgradeS.removeEventListener('click', compraS);
}

export async function compraM() {
    try {
        const res = await fetch('../php/ante.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'compraMano' })
        });
        const data = await res.json();
        if (!data.success) {
            alert("Non hai abbastanza punti per comprare l'upgrade");
            return;
        }
        alert("Hai comprato 1 Mano in più");

        const res2 = await aggiornaPunteggio();
        if(!res2.success){
            alert("Errore nel comprare mano");
            return;
        }
        document.getElementById("punteggioTotale").textContent = res2.punteggioTotale ?? 0;
        upgradeM.textContent = "Mano in più acquistata";
        upgradeM.removeEventListener('click', compraM);
    } catch (err) {
        alert(err.message);
    }
}

export async function compraS() {
    try {
        const res = await fetch('../php/ante.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'compraScarto' })
        });
        const data = await res.json();
        if (!data.success) {
            alert("Non hai abbastanza punti per comprare l'upgrade");
            return;
        }
        alert("Hai comprato 1 Scarto in più");
        const res2 = await aggiornaPunteggio();
        if(!res2.success){
            alert("Errore nel comprare scarto");
            return;
        }
        document.getElementById("punteggioTotale").textContent = res2.punteggioTotale ?? 0;
        upgradeS.textContent = "Scarto in più acquistata";
        upgradeS.removeEventListener('click', compraS);
    } catch (err) {
        alert(err.message);
    }
}

async function aggiornaPunteggio() {
    try {
        const res = await fetch('../php/ante.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'caricaStato' })
        });
        const data = await res.json();
        return data;
    } catch (err) {
        console.error("Errore nell'aggiornamento del punteggio:", err);
    }
}

function aggiornaHUD(valore, id) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = valore;
}

document.addEventListener("DOMContentLoaded", () => {

    const sezioni = ["loginDiv", "registrazioneDiv", "schermataInizialeDiv", "shopDiv", "anteDiv", "classificaDiv"];
    //const punteggioTotaleSpan = document.getElementById('punteggioTotale');
    const giocaBtn = document.getElementById("giocaBtn");
    const vaiGiocoBtn = document.getElementById("vaiGioco");
    const esci = document.getElementById("esci");
    const dial = document.getElementById("dial");
    
    const punteggiMinimi = [0,300, 450, 500, 650, 800, 1000, 2000, 3000, 5000];

    upgradeM.addEventListener('click', compraM);
    upgradeS.addEventListener('click', compraS);

    esci.addEventListener('click', async (e) => {
        e.preventDefault();
        dial.show();
        const conferma = document.getElementById("conferma");
        const annulla = document.getElementById("annulla");
        conferma.addEventListener('click', async (f) => {
            f.preventDefault();
            const res = await fetch('../php/ante.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'vaiASchermataIniziale' })
            });
            const resp = await res.json();
            if(resp.success){
                mostraSolo(resp.targetDiv);
                dial.close();
                aggiornaHUD(0, "punteggio");
                aggiornaHUD(0, "punteggioTotale");
                aggiornaHUD(0, "round-info");
                aggiornaHUD(3, "maniRimaste");
                aggiornaHUD(2, "scartiDisponibili");
                aggiornaHUD("[+1 Scarto (1000 punti)]", "upS");
                aggiornaHUD("[+1 Mano (1000 punti)]", "upM");
                addListeners();
                return;
            }
        });
        annulla.addEventListener('click',  () => {
            dial.close();
        });
    });

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

    aggiornaPunteggio();

    if (vaiGiocoBtn) {
        vaiGiocoBtn.addEventListener('click', async () => {
            try {
                const res = await fetch('../php/ante.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'vaiAdAnte' })
                });
                const data = await res.json();
                if(data.round == 9){
                    console.log("fine gioco");
                }
                if (data.success && data.targetDiv) {
                    mostraSolo(data.targetDiv);
                    console.log("round: " + data.round);
                    document.getElementById("scartiDisponibili").textContent = data.scartiTot;
                    document.getElementById("maniRimaste").textContent = data.maniTot;
                    document.getElementById("punteggio").textContent = "0";
                    document.getElementById("puntMinimo").textContent = punteggiMinimi[data.round];
                    //console.log("Sono in event listener in shop: " + punteggiMinimi[data.round]);
                } else {
                    alert(data.message || 'Errore durante il passaggio alla fase Ante.');
                }
            } catch (err) {
                alert("Errore nella transizione alla fase Ante: " + err.message);
            }
        });
    }
});
