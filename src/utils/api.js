export async function fetchWithAuth(url, method = "GET", body = null, attempt = 1) {
    let token = localStorage.getItem("jwt") || sessionStorage.getItem("jwt"); // 🔥 Harmonisation avec login()

    // ✅ Vérifier si le token est expiré AVANT d'envoyer la requête
    if (!token || isJwtExpired(token)) {
        console.warn("⚠️ Token expiré ou manquant. Tentative de rafraîchissement...");
        token = await refreshToken();
        if (!token) {
            console.error("🚨 Échec du rafraîchissement, déconnexion.");
            logout();
            return { error: "Session expirée." };
        }
    }

    let headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };

    let options = { method, headers };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        console.log(`🌐 Envoi de la requête : ${method} ${url}`);
        console.log("🛠️ JWT envoyé dans Authorization:", token);

        const response = await fetch(url, options);
        const data = await response.json();

        if (response.status === 401) {
            console.warn(`🔄 Tentative de rafraîchissement (${attempt}/3)...`);
            if (attempt < 3) {
                const newToken = await refreshToken();
                if (newToken) {
                    return fetchWithAuth(url, method, body, attempt + 1);
                }
            }
            console.error("🚨 Échec du rafraîchissement, déconnexion forcée.");
            logout();
            return { error: "Session expirée." };
        }

        return data;
    } catch (error) {
        console.error("🚨 Erreur API :", error);

        // ✅ Vérifie si l'utilisateur est hors ligne
        if (!navigator.onLine) {
            return { error: "Aucune connexion Internet." };
        }

        return { error: "Erreur de connexion au serveur. Veuillez réessayer plus tard." };
    }
}

// ✅ Vérifie si un JWT est expiré avant de l'utiliser
function isJwtExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split(".")[1])); // Décode le JWT
        return payload.exp * 1000 < Date.now(); // Compare l'expiration avec l'heure actuelle
    } catch (e) {
        return true; // Si une erreur survient, on considère le JWT comme expiré
    }
}

export async function refreshToken() {
    const email = sessionStorage.getItem("email");
    const storedRefreshToken = localStorage.getItem("refreshjwt"); // 🔥 Correspond à ce que login() stocke

    if (!email || !storedRefreshToken) {
        console.warn("⚠️ Impossible de rafraîchir le token : informations manquantes.");
        logout();
        return null;
    }

    try {
        console.log("🔄 Demande de refresh du token...");
        const response = await fetch(`https://script.google.com/macros/s/AKfycbza6bCBsbGipDOZv1fIGSkRTX3V4kzcmpBZ1cONSoNgAkpu5C4lUpLcj8aTjKy-AtmT_A/exec?route=refresh&email=${encodeURIComponent(email)}&refreshToken=${encodeURIComponent(storedRefreshToken)}`);
        const data = await response.json();

        if (data.status === "success" && data.token) {
            localStorage.setItem("jwt", data.token); // 🔥 Stockage dans localStorage pour que le routeur le voie
            sessionStorage.setItem("jwt", data.token);
            console.log("🔄 ✅ Token rafraîchi avec succès !");
            return data.token;
        } else {
            console.error("🚨 Rafraîchissement échoué :", data);
            logout();
            return null;
        }
    } catch (error) {
        console.error("🚨 Erreur lors du rafraîchissement du token :", error);
        logout();
        return null;
    }
}

export function logout() {
    console.warn("👋 Déconnexion en cours...");

    sessionStorage.clear();
    localStorage.clear();

    setTimeout(() => {
        window.location.href = "/login"; // 🔥 Redirection après nettoyage des données
    }, 500);
}

/**
 * 🔄 Gestion de la déconnexion après 30 minutes d'inactivité
 */
function resetSessionTimer() {
    sessionStorage.setItem("lastActivity", Date.now());
}

function checkInactivity() {
    const lastActivity = sessionStorage.getItem("lastActivity");
    if (lastActivity && Date.now() - lastActivity > 30 * 60 * 1000) { // 30 minutes
        console.warn("🚨 Session expirée après inactivité !");
        logout();
    }
}

// 🔄 Réinitialiser le timer à chaque interaction
window.addEventListener("mousemove", resetSessionTimer);
window.addEventListener("keydown", resetSessionTimer);
window.addEventListener("click", resetSessionTimer);

// ⏳ Vérifier l'inactivité toutes les 5 minutes
setInterval(checkInactivity, 5 * 60 * 1000);
