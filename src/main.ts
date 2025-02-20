import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';

import './assets/main.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import { refreshToken } from './utils/api'; // 🔥 Vérifie bien que le chemin est correct

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount('#app'); // ✅ Vérifie bien que ton index.html contient un élément avec id="app"

// 🔄 Variable globale pour gérer le statut du refresh
let isRefreshing = false;

// 🔄 Vérification et rafraîchissement automatique du JWT
setInterval(async () => {
  let jwt = localStorage.getItem("jwt") || sessionStorage.getItem("jwt");
  let refreshjwt = localStorage.getItem("refreshjwt");

  if (jwt && refreshjwt) {  // 🔥 Vérifier que le refreshToken existe
    const payload = JSON.parse(atob(jwt.split(".")[1]));
    const expirationTime = payload.exp * 1000;
    const timeLeft = expirationTime - Date.now();

    console.log(`⏳ Temps restant avant expiration du JWT : ${timeLeft / 1000} secondes`);

    if (timeLeft < 120000 && !isRefreshing) { // 🔥 Si le JWT expire dans moins de 2 minutes
      console.log("🔄 Rafraîchissement du JWT avant expiration...");
      
      isRefreshing = true; // 🔄 Début du refresh
      const newData = await refreshToken().catch(err => {
        console.error("❌ Erreur lors du rafraîchissement du JWT :", err);
        return null;
      });
      isRefreshing = false; // ✅ Fin du refresh
      
      if (newData && newData.jwt) {
        console.log("✅ JWT rafraîchi automatiquement !");
        localStorage.setItem("jwt", newData.jwt);
        sessionStorage.setItem("jwt", newData.jwt);
      } else {
        console.warn("🚨 Impossible de rafraîchir le JWT, utilisateur peut être déconnecté.");
      }
    }
  }
}, 60000); // ⏳ Vérifie toutes les 60 secondes

// ✅ Vérification du token au démarrage
(async () => {
  console.log("🔍 Vérification de l'authentification au démarrage...");
  let jwt = localStorage.getItem("jwt") || sessionStorage.getItem("jwt");
  const refreshjwt = localStorage.getItem("refreshjwt");

  console.log("📦 JWT actuel:", jwt);
  console.log("📦 RefreshToken disponible:", refreshjwt);

  if (!jwt && refreshjwt) {
    console.warn("⚠️ Aucun JWT trouvé, tentative de rafraîchissement...");
    
    isRefreshing = true; // 🔄 Début du refresh
    const newData = await refreshToken();
    isRefreshing = false; // ✅ Fin du refresh
    
    if (newData && newData.jwt) {
      localStorage.setItem("jwt", newData.jwt);
      sessionStorage.setItem("jwt", newData.jwt);
      console.log("✅ Token rafraîchi avec succès !");
    } else {
      console.error("🚨 Rafraîchissement échoué, utilisateur non authentifié.");
    }
  }
})();
