const PROXY_URL = "https://cors-proxy-37yu.onrender.com/";
const API_BASE_URL = "https://script.google.com/macros/s/AKfycbyaXWbAryyHp1t7HmdCHN7EuQwVlwol5u3WTtULrtN6yY9JFxjikiExxvQrakD56QRHyw/exec";

let isRefreshing = false;
let refreshPromise = null; // ✅ Stocker la promesse du refresh pour éviter plusieurs appels
import axios from 'axios';
export async function checkAdminAccess() {
    try {
      const token = sessionStorage.getItem("jwt"); // Récupérer le JWT depuis sessionStorage
      if (!token) {
        throw new Error("Token manquant");
      }
  
      const response = await axios.get('/api/check-admin-access', {
        headers: {
          Authorization: `Bearer ${token}` // Envoi du JWT dans l'en-tête
        }
      });
  
      return response.data; // Retourne la réponse avec `isAdmin`
    } catch (error) {
      throw new Error("Erreur lors de la vérification de l'accès : " + error.message);
    }
  }
// ✅ Fonction générique pour envoyer des requêtes avec un JWT valide
export async function fetchWithAuth(url, method = "GET", body = null, attempt = 1) {
    let token = getToken();

    console.log(`🔍 Tentative de requête ${method} à ${url}`);
    console.log("📦 JWT récupéré :", token ? "✅ Présent" : "❌ Absent");

    if (!token || isJwtExpired(token)) {
        console.warn("⚠️ Token expiré ou manquant. Tentative de rafraîchissement...");
        token = await refreshToken();
        if (!token) {
            console.error("🚨 Échec du rafraîchissement, déconnexion forcée.");
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

// ✅ Récupération du JWT stocké
function getToken() {
    const token = localStorage.getItem("jwt") || sessionStorage.getItem("jwt");
    console.log("🔍 Récupération du token :", token ? "✅ Trouvé" : "❌ Introuvable");
    return token;
}

// ✅ Vérification de l'expiration du JWT
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

// ✅ Rafraîchir le JWT (avec attente des autres appels)
export async function refreshToken() {
    if (isRefreshing) {
        console.warn("🔄 Une tentative de refresh est déjà en cours... Attente du premier refresh.");
        return refreshPromise; // ✅ Attendre la promesse en cours au lieu de bloquer
    }

    isRefreshing = true; // ✅ Bloque les autres appels
    refreshPromise = new Promise(async (resolve, reject) => {
        try {
            console.log("🔄 📡 Envoi de la requête de rafraîchissement du JWT...");
            const storedRefreshToken = localStorage.getItem("refreshjwt");

            if (!storedRefreshToken) {
                console.warn("⚠️ RefreshToken manquant, déconnexion.");
                logout(false);
                isRefreshing = false;
                reject(null);
            }

            const url = `${PROXY_URL}${API_BASE_URL}?route=refresh&refreshToken=${encodeURIComponent(storedRefreshToken)}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.status === "success" && data.data.jwt) {
                localStorage.setItem("jwt", data.data.jwt);
                sessionStorage.setItem("jwt", data.data.jwt);

                if (data.data.refreshToken && data.data.refreshToken !== storedRefreshToken) {
                    localStorage.setItem("refreshjwt", data.data.refreshToken);
                }

                console.log("✅ Token rafraîchi avec succès !");
                resolve(data.data.jwt);
            } else {
                console.error("🚨 Rafraîchissement échoué :", data);
                logout();
                reject(null);
            }
        } catch (error) {
            console.error("🚨 Erreur lors du rafraîchissement :", error);
            logout();
            reject(null);
        } finally {
            isRefreshing = false;
            refreshPromise = null; // ✅ Réinitialiser après le refresh
        }
    });

    return refreshPromise;
}

// ✅ Rafraîchissement automatique toutes les 15 minutes
function autoRefreshJWT() {
    setInterval(async () => {
        console.log("🔄 Vérification automatique du JWT...");
        const token = getToken();
        
        if (token && isJwtExpired(token)) {
            console.warn("⚠️ Token expiré, tentative de rafraîchissement...");
            await refreshToken();
        } else {
            console.log("✅ Token encore valide, pas de refresh nécessaire.");
        }
    }, 15 * 60 * 1000); // Toutes les 15 minutes
}

// ✅ Lancer le rafraîchissement automatique
autoRefreshJWT();

// ✅ Déconnexion de l'utilisateur
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
export function getUserRole() {
    const token = localStorage.getItem("jwt") || sessionStorage.getItem("jwt");
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split(".")[1])); // Décoder le JWT
        console.log("🎫 JWT Payload :", payload); // ✅ Vérifie le rôle dans la console
        return payload.role || null; // Retourne le rôle ou null si non défini
    } catch (error) {
        console.error("❌ Erreur lors de la récupération du rôle :", error);
        return null;
    }
}


// ✅ Gestion de l'inactivité (déconnexion après 7 jours)
function resetSessionTimer() {
    const now = Date.now();
    sessionStorage.setItem("lastActivity", now);
    console.log("✅ Activité détectée, mise à jour de lastActivity :", new Date(now).toLocaleString());
}
function checkInactivity() {
    const lastActivity = sessionStorage.getItem("lastActivity");
    console.log("🕒 Valeur brute de lastActivity :", lastActivity);

    console.log("⏳ Vérification de l'inactivité...");
    console.log("🕒 Dernière activité enregistrée :", lastActivity ? new Date(Number(lastActivity)).toLocaleString() : "❌ Aucune activité détectée");

    if (lastActivity && (Date.now() - Number(lastActivity)) > 7 * 24 * 60 * 60 * 1000) { // 7 jours
        console.warn("🚨 Session expirée après inactivité !");
        logout();
    } else {
        console.log("✅ Session encore valide !");
    }
}



// ✅ Écoute les événements utilisateur pour reset le timer d’inactivité
window.addEventListener("mousemove", resetSessionTimer);
window.addEventListener("keydown", resetSessionTimer);
window.addEventListener("click", resetSessionTimer);

// ✅ Vérification toutes les 5 minutes
setInterval(checkInactivity, 5 * 60 * 1000);
checkInactivity(); // 🔥 Vérification immédiate de l'inactivité au chargement

