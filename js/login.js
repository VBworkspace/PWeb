document.addEventListener("DOMContentLoaded", () => {
    const sezioni = ["loginDiv", "registrazioneDiv", "schermataInizialeDiv", "shopDiv", "anteDiv"];

    // Funzione per mostrare una sola sezione
    function mostraSolo(idDaMostrare) {
        sezioni.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add("hidden");
        });
        const target = document.getElementById(idDaMostrare);
        if (target) target.classList.remove("hidden");
    }

    // Mostra il login all'avvio
    mostraSolo("loginDiv");

    // Gestione del form di login
    const form = document.getElementById("loginForm");
    const errorMsg = document.getElementById("error");

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const formData = new FormData(form);
            const data = {
                username: formData.get("username"),
                password: formData.get("password")
            };

            try {
                const response = await fetch("../php/login.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    mostraSolo("schermataInizialeDiv");
                } else {
                    errorMsg.textContent = result.message || "Credenziali errate.";
                }
            } catch (err) {
                errorMsg.textContent = "Errore di connessione al server.";
                console.error(err);
            }
        });
    }
});
