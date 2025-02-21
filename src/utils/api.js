const PROXY_URL = "https://cors-proxy-37yu.onrender.com/";
const API_BASE_URL = "https://script.google.com/macros/s/AKfycbyaXWbAryyHp1t7HmdCHN7EuQwVlwol5u3WTtULrtN6yY9JFxjikiExxvQrakD56QRHyw/exec";

let isRefreshing = false;
let refreshPromise = null;
import axios from 'axios';

export async function checkAdminAccess() {
    try {
        const token = sessionStorage.getItem("jwt");
        if (!token) {
            throw new Error("Token manquant");
        }

        const response = await axios.get('/api/check-admin-access', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        return response.data;
    } catch (error) {
        throw new Error("Erreur lors de la vérification de l'accès : " + error.message);
    }
}

export async function fetchWithAuth(url, method = "GET", body = null, attempt = 1) {
    let token = getToken();

    if (!token || isJwtExpired(token)) {
        console.warn("⚠️ Token expiré ou manquant. Tentative de rafraîchissement...");
        token = await refreshToken();
        if (!token) {
            console.error("🚨 Token introuvable après rafraîchissement !");
            return { error: "Session expirée, merci de vous reconnecter." };
        }
    }

    let headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };

    let options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    try {
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

        if (!navigator.onLine) {
            return { error: "Aucune connexion Internet." };
        }

        return { error: "Erreur de connexion au serveur. Veuillez réessayer plus tard." };
    }
}

function getToken() {
    return localStorage.getItem("jwt") || sessionStorage.getItem("jwt");
}

function isJwtExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (!payload.exp) {
            console.warn("⚠️ Le JWT n'a pas d'expiration définie !");
            return false;
        }
        return payload.exp * 1000 < Date.now();
    } catch (e) {
        console.error("❌ Erreur lors du décodage du JWT :", e);
        return true;
    }
}

export async function refreshToken() {
    if (isRefreshing) {
        return refreshPromise;
    }

    isRefreshing = true;
    refreshPromise = new Promise(async (resolve, reject) => {
        try {
            const storedRefreshToken = localStorage.getItem("refreshjwt");
            if (!storedRefreshToken) {
                logout(false);
                isRefreshing = false;
                return reject(null);
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
            refreshPromise = null;
        }
    });
    return refreshPromise;
}

autoRefreshJWT();

function autoRefreshJWT() {
    setInterval(async () => {
        const token = getToken();
        if (token && isJwtExpired(token)) {
            await refreshToken();
        }
    }, 15 * 60 * 1000);
}

export function logout(clearRefresh = true) {
    sessionStorage.clear();
    localStorage.removeItem("jwt");

    if (clearRefresh) {
        localStorage.removeItem("refreshjwt");
    }

    setTimeout(() => {
        window.location.href = "/login";
    }, 500);
}

export function getUserRole() {
    const token = getToken();
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.role || null;
    } catch (error) {
        console.error("❌ Erreur lors de la récupération du rôle :", error);
        return null;
    }
}

function resetSessionTimer() {
    sessionStorage.setItem("lastActivity", Date.now());
}

function checkInactivity() {
    const lastActivity = sessionStorage.getItem("lastActivity");
    if (!lastActivity) {
        resetSessionTimer();
        return;
    }
    const inactivityDuration = Date.now() - Number(lastActivity);
    if (inactivityDuration > 7 * 24 * 60 * 60 * 1000) {
        logout();
    }
}

window.addEventListener("mousemove", resetSessionTimer);
window.addEventListener("keydown", resetSessionTimer);
window.addEventListener("click", resetSessionTimer);
setInterval(checkInactivity, 5 * 60 * 1000);
checkInactivity();
