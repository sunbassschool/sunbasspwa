<template>
  <Layout>
    <div class="container d-flex justify-content-center align-items-center mt-5">
      <div class="row justify-content-center w-200">
        <div class="w-100 mx-auto">
          <div class="card shadow p-5">
            <h2 class="text-center mb-4">🔐 Connexion</h2>

            <!-- 🔥 Afficher le formulaire SEULEMENT si loading est false -->
            <form v-if="!loading" @submit.prevent="login">
              <div class="mb-3">
                <label for="email" class="form-label">Adresse e-mail</label>
                <input 
                  v-model="email" 
                  type="email" 
                  id="email" 
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
                  class="form-control" 
                  required 
                  autocomplete="new-password"
                  spellcheck="false">
              </div>

              <input type="password" style="display:none" autocomplete="new-password">

              <button type="submit" class="btn btn-primary w-100">
                Se connecter
              </button>
            </form>

            <!-- 🔥 Afficher le spinner si loading est true -->
            <div v-if="loading" class="text-center">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Connexion en cours...</span>
              </div>
              <p class="mt-3 fw-bold">Connexion en cours...</p>
            </div>

            <div v-if="message" class="alert mt-3" :class="messageType">{{ message }}</div>

            <div v-if="prenom && email" class="alert alert-info mt-3">
              ✅ Connecté en tant que {{ prenom }} ({{ email }})
              <button @click="logout" class="btn btn-danger btn-sm ms-3">Se déconnecter</button>
            </div>
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
      apiBaseURL: "https://cors-proxy-37yu.onrender.com/https://script.google.com/macros/s/AKfycbxWgrMJAgTxqfWeH5lKT0LFW_rURlpmLIxKTx7CEGfuJCYd_IDVq4QnC9HWoKix4ClteA/exec",
      loading: false
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
  },
  methods: {
    async sha256(text) {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    },

    async login() {
      if (!this.email || !this.password) {
        this.message = "Veuillez remplir tous les champs.";
        this.messageType = "alert-danger";
        return;
      }

      const hashedPassword = await this.sha256(this.password);

      this.loading = true;  // Début de la connexion

      try {
        console.log("📡 Envoi de la requête de connexion...");
        const response = await fetch(`${this.apiBaseURL}`, {
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
        console.log("🔍 Réponse API :", data);

        if (data.status === 'error') {
          this.message = `❌ ${data.message}`;
          this.messageType = "alert-danger";
        } else {
          // ✅ Stockage des tokens
          sessionStorage.setItem("jwt", data.data.jwt);
          localStorage.setItem("refreshjwt", data.data.refreshToken);
          this.jwt = data.data.jwt;
          this.refreshjwt = data.data.refreshToken;

          // ✅ Décoder le JWT pour récupérer les infos utilisateur
          this.decodeJWT(data.data.jwt);

          this.message = "✅ Connexion réussie";
          this.messageType = "alert-success";

          // 🔥 Redirection après connexion
          this.$router.push('/dashboard');
        }
      } catch (error) {
        console.error("🚨 Erreur lors de la connexion :", error);
        this.message = `Erreur de connexion : ${error.message}`;
        this.messageType = "alert-danger";
      } finally {
        this.loading = false;  // Fin de la connexion
      }
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
      }
    },

    logout() {
      sessionStorage.clear(); 
      localStorage.removeItem("refreshjwt");

      this.jwt = "";
      this.refreshjwt = "";

      this.message = "Vous êtes déconnecté.";
      this.messageType = "alert-info";

      this.$router.push('/login');
    }
  }
};
</script>

<style scoped>
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
