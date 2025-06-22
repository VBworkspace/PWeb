document.addEventListener("DOMContentLoaded", () => {
    const sezioni = ["loginDiv", "registrazioneDiv", "schermataInizialeDiv", "shopDiv", "anteDiv", "classificaDiv"];

    function mostraSolo(idDaMostrare) {
        sezioni.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add("hidden");
        });
        const target = document.getElementById(idDaMostrare);
        if (target) target.classList.remove("hidden");
    }

    // Mostra login all'avvio
    mostraSolo("loginDiv");

    // Navigazione tra login e registrazione
    document.querySelectorAll(".vai-a-registrazione").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            mostraSolo("registrazioneDiv");
        });
    });

    document.querySelectorAll(".vai-a-login").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            mostraSolo("loginDiv");
        });
    });

    const loginForm = document.getElementById("loginForm");
    const loginError = document.getElementById("error");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const formData = new FormData(loginForm);

            try {
                const response = await fetch("../php/login.php", {
                    method: "POST",
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    mostraSolo("schermataInizialeDiv");
                } else {
                    loginError.textContent = result.message || "Credenziali errate.";
                }
            } catch (err) {
                loginError.textContent = "Errore di connessione al server.";
                console.error(err);
            }
        });
    }

    const registerForm = document.getElementById("registerForm");
    const registerMsg = document.getElementById("msg");

    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const username = registerForm.username.value.trim();
            const password = registerForm.password.value;
            const confirmPassword = registerForm.confirmPassword.value;

            // Validazione lato client
            if (password !== confirmPassword) {
                registerMsg.style.color = "red";
                registerMsg.textContent = "Le password non coincidono.";
                return;
            }
            if (!/^[a-zA-Z0-9_]{4,16}$/.test(username)) {
                registerMsg.style.color = "red";
                registerMsg.textContent = "Il nome utente deve contenere solo lettere, numeri e underscore (_), con una lunghezza tra 4 e 16 caratteri.";
                return;
            }

            if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)[A-Za-z\d]{4,16}$/.test(password)) {
                registerMsg.style.color = "red";
                registerMsg.textContent = "La password deve avere una lunghezza compresa tra 4 e 16, deve avere una lettera maiuscola, una minuscola e un numero.";
                return;
            }

            const formData = new FormData();
            formData.append("username", username);
            formData.append("password", password);

            try {
                const response = await fetch("../php/registrazione.php", {
                    method: "POST",
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    registerMsg.style.color = "green";
                    registerMsg.textContent = "Registrazione completata! Ora puoi effettuare il login.";
                    registerForm.reset();
                } else {
                    registerMsg.style.color = "red";
                    registerMsg.textContent = result.message || "Registrazione fallita.";
                }
            } catch (err) {
                registerMsg.style.color = "red";
                registerMsg.textContent = "Errore di rete, riprova più tardi.";
                console.error(err);
            }
        });
    }
});
