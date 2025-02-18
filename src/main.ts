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

// ✅ Vérification du token au démarrage
(async () => {
  console.log("🔍 Vérification de l'authentification au démarrage...");
  let jwt = localStorage.getItem("jwt") || sessionStorage.getItem("jwt");
  const refreshjwt = localStorage.getItem("refreshjwt");

  console.log("📦 JWT actuel:", jwt);
  console.log("📦 RefreshToken disponible:", refreshjwt);

  if (!jwt && refreshjwt) {
    console.warn("⚠️ Aucun JWT trouvé, tentative de rafraîchissement...");
    jwt = await refreshToken();
    if (jwt) {
      console.log("✅ Token rafraîchi avec succès !");
    } else {
      console.error("🚨 Rafraîchissement échoué, utilisateur non authentifié.");
    }
  }
})();

// ✅ Enregistrement du Service Worker avec gestion des mises à jour
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("✅ Service Worker enregistré", reg);

        // 🔄 Écoute les mises à jour du Service Worker
        reg.onupdatefound = () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.onstatechange = () => {
              if (newWorker.state === "installed") {
                if (navigator.serviceWorker.controller) {
                  console.log("🚀 Nouvelle version disponible !");
                  window.location.reload(); // 🔄 Recharge automatiquement l'application
                }
              }
            };
          }
        };
      })
      .catch((err) => console.error("❌ Erreur Service Worker", err));
  });

  // 🔥 Forcer la mise à jour immédiate si un SW est déjà en place
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    console.log("🚀 Nouvelle version active ! Rechargement...");
    window.location.reload();
  });
}

// ✅ Gestion de l'installation PWA
window.addEventListener("beforeinstallprompt", (event) => {
  console.log("👍 PWA installable !");
  event.preventDefault(); // Nécessaire pour stocker l'événement
  (window as any).deferredPrompt = event;
});
