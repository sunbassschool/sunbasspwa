export async function fetchWithAuth(url, method = "GET", body = null, attempt = 1) {
    let token = sessionStorage.getItem("token");

    if (!token) {
        console.warn("⚠️ Pas de token disponible. Tentative de rafraîchissement...");
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
        const response = await fetch(url, options);
        
        // ✅ Vérifier si la réponse est bien un JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const errorText = await response.text();
            console.error("🚨 Réponse non JSON reçue :", errorText);
            return { error: "Réponse invalide du serveur." };
        }

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
        return { error: "Erreur de connexion au serveur." };
    }
}

export async function refreshToken() {
    const email = sessionStorage.getItem("email");
    const storedRefreshToken = localStorage.getItem("refreshToken"); // 🔥 Stocke le refreshToken dans localStorage

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
            sessionStorage.setItem("token", data.token); // 🔥 Stocke le token mis à jour dans sessionStorage
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
    sessionStorage.removeItem("prenom");
    sessionStorage.removeItem("email");
    sessionStorage.removeItem("token");
    localStorage.removeItem("refreshToken"); // 🔥 Supprime aussi le refreshToken pour plus de sécurité

    window.location.href = "/login"; // 🔥 Redirection immédiate vers la page de connexion
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
