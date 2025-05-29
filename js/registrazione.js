document.addEventListener("DOMContentLoaded", () => {
    const sezioni = ["loginDiv", "registrazioneDiv", "schermataInizialeDiv", "shopDiv", "anteDiv"];

    // Funzione per mostrare solo una sezione
    function mostraSolo(idDaMostrare) {
        sezioni.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add("hidden");
        });
        const target = document.getElementById(idDaMostrare);
        if (target) target.classList.remove("hidden");
    }

    // Mostra schermata di registrazione all’avvio
    mostraSolo("registrazioneDiv");

    // Gestione form di registrazione
    const form = document.getElementById("registerForm");
    const msg = document.getElementById("msg");

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const formData = new FormData(form);
            const data = {
                username: formData.get("username"),
                password: formData.get("password")
            };

            try {
                const response = await fetch("../php/registrazione.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    msg.style.color = "green";
                    msg.textContent = "Registrazione completata! Ora puoi effettuare il login.";
                    form.reset();
                } else {
                    msg.style.color = "red";
                    msg.textContent = result.message || "Registrazione fallita.";
                }
            } catch (error) {
                msg.style.color = "red";
                msg.textContent = "Errore di rete, riprova più tardi.";
                console.error(error);
            }
        });
    }
});
