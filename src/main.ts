import './assets/main.css'
import 'bootstrap/dist/css/bootstrap.min.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import '@fortawesome/fontawesome-free/css/all.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("✅ Service Worker enregistré", reg))
      .catch((err) => console.error("❌ Erreur Service Worker", err));
  });
}
window.addEventListener("beforeinstallprompt", (event) => {
  console.log("👍 PWA installable !");
  event.preventDefault(); // Nécessaire pour stocker l'événement
  (window as any).deferredPrompt = event;
});

