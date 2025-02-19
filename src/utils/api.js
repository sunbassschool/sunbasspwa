const PROXY_URL = "https://cors-proxy-37yu.onrender.com/";
const API_BASE_URL = "https://script.google.com/macros/s/AKfycbySfC71M5ThshHntBVXvf3g0ggo9ruMqHngNUG56SLweACEv3eHRI__uloWW0M2zekfvA/exec";

export async function fetchWithAuth(url, method = "GET", body = null, attempt = 1) {
    let token = getToken();

    console.log(`🔍 Tentative de requête ${method} à ${url}`);
    console.log("📦 JWT récupéré :", token ? "✅ Présent" : "❌ Absent");

    if (!token || isJwtExpired(token)) {
        console.warn("⚠️ Token expiré ou manquant. Tentative de rafraîchissement...");
        token = await refreshToken();
        if (!token) {
            console.error("🚨 Échec du rafraîchissement, déconnexion forcée.");
            console.warn("🛑 refreshToken a échoué ! JWT supprimé ?");
            console.warn("📦 RefreshToken AVANT suppression :", localStorage.getItem("refreshjwt"));

            logout();
            return { error: "Session expirée." };
        }
    }

    let headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };

    let options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    try {
        console.log(`🌐 Envoi de la requête : ${method} ${url}`);
        console.log("🛠️ JWT envoyé dans Authorization:", token);

        const response = await fetch(url, options);
        const data = await response.json();

        console.log("📡 Réponse reçue :", data);

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

        if (!navigator.onLine) {
            console.warn("⚠️ Pas de connexion Internet !");
            return { error: "Aucune connexion Internet." };
        }

        return { error: "Erreur de connexion au serveur. Veuillez réessayer plus tard." };
    }
}

function getToken() {
    const token = localStorage.getItem("jwt") || sessionStorage.getItem("jwt");
    console.log("🔍 Récupération du token :", token ? "✅ Trouvé" : "❌ Introuvable");
    return token;
}

function isJwtExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const expirationTime = payload.exp * 1000;
        console.log(`⏳ JWT expire dans : ${Math.round((expirationTime - Date.now()) / 1000)}s`);
        return expirationTime < Date.now();
    } catch (e) {
        console.error("❌ Erreur lors du décodage du JWT :", e);
        return true;
    }
}

export async function refreshToken() {
    const email = sessionStorage.getItem("email");
    const storedRefreshToken = localStorage.getItem("refreshjwt");

    console.log("📦 RefreshToken AVANT envoi :", storedRefreshToken ? `✅ ${storedRefreshToken}` : "❌ Absent");

    if (!email || !storedRefreshToken) {
        console.warn("⚠️ Impossible de rafraîchir le token : informations manquantes.");
        logout(false);
        return null;
    }

    try {
        console.log("🔄 Demande de refresh du token...");

        const url = `${PROXY_URL}${API_BASE_URL}?route=refresh&email=${encodeURIComponent(email)}&refreshToken=${encodeURIComponent(storedRefreshToken)}`;
        console.log("🌎 Requête envoyée à :", url);

        const response = await fetch(url);
        const data = await response.json();

        console.log("✅ Réponse API du refresh :", data);

        if (data.status === "success" && data.data.jwt) {
            console.log("🔄 ✅ Nouveau JWT reçu :", data.data.jwt);

            console.log("🔄 📦 RefreshToken RENVOYÉ PAR L'API :", data.data.refreshToken ? `✅ ${data.data.refreshToken}` : "❌ Non fourni");

            // ✅ Comparer l'ancien et le nouveau refreshToken
            if (data.data.refreshToken) {
                if (data.data.refreshToken !== storedRefreshToken) {
                    console.error("🛑 MISMATCH ENTRE LES REFRESH TOKENS !");
                    console.warn(`🆕 RefreshToken reçu: ${data.data.refreshToken}`);
                    console.warn(`🔄 RefreshToken stocké: ${storedRefreshToken}`);
                }

                // 🔄 Mise à jour du refreshToken
                localStorage.setItem("refreshjwt", data.data.refreshToken);
                console.log("🔄 ✅ RefreshToken mis à jour !");
            } else {
                console.warn("⚠️ Aucun nouveau refreshToken reçu !");
            }

            // ✅ Stockage du nouveau JWT
            localStorage.setItem("jwt", data.data.jwt);
            sessionStorage.setItem("jwt", data.data.jwt);
            
            // 🚀 Vérification immédiate
            console.log("📦 JWT après stockage :", localStorage.getItem("jwt"));
            console.log("📦 RefreshToken après stockage :", localStorage.getItem("refreshjwt"));

            return data.data.jwt;
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


export function logout(clearRefresh = true) {
    console.warn("👋 Déconnexion en cours...");

    sessionStorage.clear();
    localStorage.removeItem("jwt");

    if (clearRefresh) {
        console.log("🛑 Suppression refreshToken DETECTÉE !", localStorage.getItem("refreshjwt"));
        localStorage.removeItem("refreshjwt");
    }

    setTimeout(() => {
        window.location.href = "/login";
    }, 500);
}

function resetSessionTimer() {
    sessionStorage.setItem("lastActivity", Date.now());
}

function checkInactivity() {
    const lastActivity = sessionStorage.getItem("lastActivity");
    if (lastActivity && Date.now() - lastActivity > 30 * 60 * 1000) {
        console.warn("🚨 Session expirée après inactivité !");
        logout();
    }
}

window.addEventListener("mousemove", resetSessionTimer);
window.addEventListener("keydown", resetSessionTimer);
window.addEventListener("click", resetSessionTimer);

setInterval(checkInactivity, 5 * 60 * 1000);
