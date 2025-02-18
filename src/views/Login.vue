<template>
  <Layout>
    <div class="container d-flex justify-content-center align-items-center mt-5">
      <div class="row justify-content-center w-200">
        <div class="w-100 mx-auto">
          <div class="card shadow p-5">
            <h2 class="text-center mb-4">🔐 Connexion</h2>

            <form v-if="!loading" @submit.prevent="login">
              <div class="mb-3">
                <label for="email" class="form-label">Adresse e-mail</label>
                <input 
                  v-model="email" 
                  type="email" 
                  id="email"
                  name="email" 
                  class="form-control" 
                  required 
                  autocomplete="off"
                  spellcheck="false">
              </div>

              <div class="mb-3">
                <label for="password" class="form-label">Mot de passe</label>
                <input 
                  v-model="password" 
                  type="password" 
                  id="password" 
                  name="password"

                  class="form-control" 
                  required 
                  autocomplete="new-password"
                  spellcheck="false">
              </div>

              <input type="password"   name="password2"
              style="display:none" autocomplete="new-password">

              <button @click="login" :disabled="loading" class="btn btn-primary w-100">
                <span v-if="!loading">Se connecter</span>
                <span v-else>Connexion en cours...</span>
              </button>
            </form>

            <!-- Barre de chargement animée avec progression dynamique -->
            <div v-if="loading" class="loading-container mt-3">
              <div class="loading-bar" :style="{ width: progress + '%' }"></div>
            </div>

            <div v-if="message" class="alert mt-3" :class="messageType">{{ message }}</div>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script>
import Layout from "../views/Layout.vue";
import { jwtDecode } from "jwt-decode";

export default {
  name: "Login",
  components: { Layout },
  data() {
    return {
      email: "",
      password: "",
      message: "",
      messageType: "",
      jwt: sessionStorage.getItem("jwt") || "",  
      refreshjwt: localStorage.getItem("refreshjwt") || "",  
      apiBaseURL: "https://cors-proxy-37yu.onrender.com/https://script.google.com/macros/s/AKfycbxGCCibB7xk6fG9O_zAzlAVgiyf1AdSD58LUWV90fFWu3tHstfTqRs0KjOkSZKBGki-Rg/exec",
      loading: false,
      progress: 0,
      progressInterval: null,
      tokenCheckInterval: null,
    };
  },
  computed: {
    prenom() {
      return sessionStorage.getItem("prenom") || ""; 
    }
  },
  mounted() {
    console.log("✅ Vérification du JWT au chargement...");
    this.checkExistingSession();

    // Vérifie l'expiration du JWT toutes les 60 secondes
    this.tokenCheckInterval = setInterval(this.checkTokenExpiration, 60000);
  },
  beforeUnmount() {
    clearInterval(this.tokenCheckInterval);
  },
  methods: {
    async sha256(text) {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hashBuffer))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
    },

    async login() {
      if (!this.email || !this.password) {
        this.setMessage("Veuillez remplir tous les champs.", "alert-danger");
        return;
      }

      this.loading = true;
      this.progress = 0;
      this.startProgressBar();
      const startTime = performance.now();
      const hashedPassword = await this.sha256(this.password);

      try {
        console.log("📡 Envoi de la requête de connexion...");
        const response = await fetch(this.apiBaseURL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest"
          },
          body: JSON.stringify({
            route: "login",
            email: this.email,
            password: hashedPassword
          })
        });

        const data = await response.json();
        const duration = (performance.now() - startTime).toFixed(2);
        console.log(`⏳ Temps de connexion : ${duration} ms`);
        console.log("🔍 Réponse API :", data);

        if (data.status === 'error') {
          this.setMessage(`❌ ${data.message}`, "alert-danger");
        } else {
          this.storeSession(data.data);
          this.setMessage("✅ Connexion réussie", "alert-success");
          this.$router.push('/dashboard');
        }
      } catch (error) {
        console.error("🚨 Erreur lors de la connexion :", error);
        this.setMessage(`Erreur de connexion : ${error.message}`, "alert-danger");
      } finally {
        this.finishProgressBar();
      }
    },

    startProgressBar() {
      this.progress = 0;
      this.progressInterval = setInterval(() => {
        if (this.progress < 90) {
          this.progress += Math.random() * 10;
        }
      }, 500);
    },

    finishProgressBar() {
      clearInterval(this.progressInterval);
      this.progress = 100;
      setTimeout(() => {
        this.loading = false;
        this.progress = 0;
      }, 300);
    },

    storeSession(data) {
      sessionStorage.setItem("jwt", data.jwt);
      localStorage.setItem("jwt", data.jwt); // ✅ Stockage persistant
      localStorage.setItem("refreshjwt", data.refreshToken);
      this.jwt = data.jwt;
      this.refreshjwt = data.refreshToken;
      this.decodeJWT(data.jwt);
    },

    decodeJWT(jwt) {
      try {
        const decoded = jwtDecode(jwt);
        console.log("🎫 JWT décodé :", decoded);
        sessionStorage.setItem("prenom", decoded.prenom || "");
        sessionStorage.setItem("email", decoded.email || "");
      } catch (error) {
        console.error("🚨 Erreur lors du décodage du JWT :", error);
      }
    },

    checkExistingSession() {
      const jwt = sessionStorage.getItem("jwt");
      if (jwt) {
        console.log("🔄 Décodage du JWT pour récupérer les infos...");
        this.decodeJWT(jwt);
        this.checkTokenExpiration();
      }
    },

    checkTokenExpiration() {
      if (!this.jwt) return;

      try {
        const decoded = jwtDecode(this.jwt);
        const expTime = decoded.exp * 1000; // Convertir en millisecondes
        const currentTime = Date.now();

        if (currentTime >= expTime) {
          console.log("🔄 Le JWT a expiré. Tentative de rafraîchissement...");
          this.refreshToken();
        }
      } catch (error) {
        console.error("❌ Erreur lors de la vérification du JWT :", error);
        this.logout();
      }
    },

    async refreshToken() {
      if (!this.refreshjwt) {
        console.log("❌ Aucun refresh token disponible.");
        this.logout();
        return;
      }

      try {
        const response = await fetch(this.apiBaseURL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            route: "refreshToken",
            refreshToken: this.refreshjwt,
          }),
        });

        const data = await response.json();
        if (data.status === "success") {
          console.log("✅ JWT rafraîchi !");
          this.storeSession(data.data);
        } else {
          console.error("🚨 Impossible de rafraîchir le JWT :", data.message);
          this.logout();
        }
      } catch (error) {
        console.error("🚨 Erreur lors du rafraîchissement du JWT :", error);
        this.logout();
      }
    },

    logout() {
      sessionStorage.clear();
      localStorage.removeItem("refreshjwt");
      this.jwt = "";
      this.refreshjwt = "";
      this.setMessage("Vous êtes déconnecté.", "alert-info");
      this.$router.push('/login');
    },

    setMessage(msg, type) {
      this.message = msg;
      this.messageType = type;
    }
  }
};
</script>



<style scoped>

.loading-container {
  width: 100%;
  height: 4px;
  background-color: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
}

.loading-bar {
  height: 100%;
  background-color: #ff5e00 !important; /* Forçage de la couleur */
  transition: width 0.3s ease-in-out;
}


@keyframes loadingAnimation {
  0% { width: 0; }
  50% { width: 100%; }
  100% { width: 0; }
}

/* Largeur et centrage */
.card {
  border-radius: 10px;
  max-width: 600px;
  width: 100%;
}

/* Supprime tout débordement */
.container {
  margin-top: 50px;
}

/* Empêcher Chrome de stocker les mots de passe */
input:-webkit-autofill {
  background-color: transparent !important;
}
</style>
