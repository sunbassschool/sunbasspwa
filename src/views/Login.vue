<template>
  <Layout>
    <div class="container d-flex justify-content-center align-items-center mt-5">
      <div class="row justify-content-center w-200">
        <div class="w-100 mx-auto">
          <div class="card shadow p-5">
            <h2 class="text-center mb-4">🔐 Connexion</h2>

            <!-- Spinner pendant le chargement -->
            <div v-if="isLoading" class="text-center">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Chargement...</span>
              </div>
              <p class="mt-3">Connexion en cours...</p>
            </div>

            <!-- Formulaire de connexion -->
            <form v-else @submit.prevent="login">
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

              <button type="submit" class="btn btn-primary w-100">Se connecter</button>
            </form>

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

export default {
  name: "Login",
  components: { Layout },
  data() {
    return {
      email: localStorage.getItem("email") || "", 
      prenom: localStorage.getItem("prenom") || "",  
      password: "",
      message: "",
      messageType: "",
      isLoading: false,
      apiURL: "https://script.google.com/macros/s/AKfycbwSslNUA5ExkZkxyp_2DAdyGlEJsFXppLses1B4ueyMjm7_naew9ZQR-917eq2dhr7tNA/exec",
      refreshURL: "https://thingproxy.freeboard.io/fetch/https://script.google.com/macros/s/AKfycbwSslNUA5ExkZkxyp_2DAdyGlEJsFXppLses1B4ueyMjm7_naew9ZQR-917eq2dhr7tNA/exec", 
      updateURL: "https://thingproxy.freeboard.io/fetch/https://script.google.com/macros/s/AKfycbwSslNUA5ExkZkxyp_2DAdyGlEJsFXppLses1B4ueyMjm7_naew9ZQR-917eq2dhr7tNA/exec",
      maxAttempts: 5,
      lockoutTime: 30 * 60 * 1000, 
      lockoutKey: "login_lockout_time",
      attemptsKey: "login_attempts"
    };
  },

  mounted() {
    if (this.$route.path !== "/login") { 
      this.startTokenRefreshLoop(); // ✅ Démarrer le rafraîchissement uniquement si on N'EST PAS sur /login
    }
  },

  methods: {
    async login() {
      console.time("⏳ Début login");
      this.isLoading = true;

      if (!this.email || !this.password) {
        this.message = "Veuillez remplir tous les champs.";
        this.messageType = "alert-danger";
        this.isLoading = false;
        return;
      }

      // Vérification du nombre de tentatives
      const lastLockoutTime = localStorage.getItem(this.lockoutKey);
      const loginAttempts = localStorage.getItem(this.attemptsKey) || 0;

      if (loginAttempts >= this.maxAttempts && lastLockoutTime && Date.now() - lastLockoutTime < this.lockoutTime) {
        this.message = "❌ Vous avez dépassé le nombre de tentatives autorisées. Essayez plus tard.";
        this.messageType = "alert-danger";
        this.isLoading = false;
        return;
      }

      try {
        console.time("🔐 Hachage SHA-256");
        const hashedPassword = await this.sha256(this.password);
        console.timeEnd("🔐 Hachage SHA-256");

        // Log de l'email et mot de passe encodés
        console.log("Email encodé : ", encodeURIComponent(this.email));  // Vérifier l'email encodé
        console.log("Mot de passe encodé : ", encodeURIComponent(hashedPassword));  // Vérifier le mot de passe encodé

        // Construction de l'URL et log
       const url = `${this.refreshURL}?route=refresh&email=${encodeURIComponent(this.email)}&refreshToken=${encodeURIComponent(this.refreshToken)}`;
        console.log("URL envoyée : ", url); // Afficher l'URL construite

        console.time("📡 Envoi de la requête /login");
        const response = await fetch(url);
        
        // Log de la réponse brute avant de la parser
        const text = await response.text(); // Lire la réponse brute
        console.log("Réponse brute : ", text); // Afficher la réponse avant de la traiter

        const result = JSON.parse(text);
        console.timeEnd("📡 Envoi de la requête /login");

        if (result.error) {
            throw new Error(result.error || "Erreur inconnue");
        }

        // Réinitialiser les tentatives après une connexion réussie
        localStorage.setItem(this.attemptsKey, 0);
        localStorage.removeItem(this.lockoutKey);

        console.time("💾 Stockage LocalStorage");
        localStorage.setItem("prenom", result.user.prenom?.trim() || "");
        localStorage.setItem("email", result.user.email?.trim() || "");
        localStorage.setItem("token", result.token || "");
        localStorage.setItem("refreshToken", result.refreshToken || "");
        console.timeEnd("💾 Stockage LocalStorage");

        this.prenom = result.user.prenom?.trim() || "";
        this.email = result.user.email?.trim() || "";

        console.log("✅ Connexion réussie :", this.prenom, this.email);

        this.message = "✅ Connexion réussie !";
        this.messageType = "alert-success";

        console.time("📡 Mise à jour dernière connexion");
        await (this.updateURL, "POST", { email: this.email, hashedPassword });
        console.timeEnd("📡 Mise à jour dernière connexion");

        this.isLoading = false;
        this.startTokenRefreshLoop(); // ✅ Démarrer l'auto-refresh du token après connexion

        console.time("➡️ Redirection vers dashboard");
        if (this.$router) {
          this.$router.push('/dashboard');
        }
        console.timeEnd("➡️ Redirection vers dashboard");

      } catch (error) {
        console.error("🚨 Erreur lors de la connexion :", error);

        // Incrémentation des tentatives échouées
        const attempts = parseInt(localStorage.getItem(this.attemptsKey) || "0", 10) + 1;
        localStorage.setItem(this.attemptsKey, attempts);

        // Bloquer l'utilisateur après un certain nombre d'échecs
        if (attempts >= this.maxAttempts) {
          localStorage.setItem(this.lockoutKey, Date.now()); // Enregistrer l'heure du dernier échec
          this.message = "❌ Trop de tentatives échouées. Veuillez réessayer dans 30 minutes.";
        } else {
          this.message = `❌ Erreur : ${error.message}`;
        }

        this.messageType = "alert-danger";
        this.isLoading = false;
      }

      console.timeEnd("⏳ Début login");
    },

    async fetchWithAuth(url, method = "GET", body = null) {
  let token = localStorage.getItem("token");

  if (!token) {
    console.warn("⚠️ Pas de token disponible.");
    this.logout();
    return { error: "Non authentifié." };
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
    const response = await fetch(url, options);

    // Vérifiez si la réponse est correcte
    if (!response.ok) {
      console.error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      this.message = `Erreur ${response.status}: ${response.statusText}`;
      this.messageType = "alert-danger";
      this.isLoading = false;
      return { error: `Erreur HTTP : ${response.status}` };
    }

    // Lire la réponse comme texte brut pour la déboguer
    const text = await response.text();
    console.log("Réponse brute : ", text); // Afficher la réponse avant de la traiter

    let result;
    try {
      result = JSON.parse(text); // Tenter de parser la réponse JSON
    } catch (error) {
      console.error("Erreur de parsing JSON : ", error);
      this.message = "Erreur de connexion : réponse mal formée.";
      this.messageType = "alert-danger";
      this.isLoading = false;
      return { error: "Erreur de parsing JSON" };
    }

    return result;

  } catch (error) {
    console.error("🚨 Erreur API :", error);
    this.message = "Erreur de connexion.";
    this.messageType = "alert-danger";
    this.isLoading = false;
    return { error: "Erreur de connexion." };
  }
}
,

    async refreshToken() {
      const email = localStorage.getItem("email");
      const refreshToken = localStorage.getItem("refreshToken");

      if (!email || !refreshToken) {
        console.warn("⚠️ Impossible de rafraîchir le token.");
        this.logout();
        return null;
      }

      try {
        const response = await fetch(`${this.refreshURL}&email=${encodeURIComponent(email)}&refreshToken=${encodeURIComponent(refreshToken)}`);
        const data = await response.json();

        if (data.status === "success" && data.token) {
          localStorage.setItem("token", data.token);
          console.log("🔄 ✅ Token rafraîchi !");
          return data.token;
        } else {
          console.error("🚨 Rafraîchissement échoué :", data);
          this.logout();
          return null;
        }
      } catch (error) {
        console.error("🚨 Erreur lors du rafraîchissement :", error);
        this.logout();
        return null;
      }
    },

    startTokenRefreshLoop() {
      this.refreshToken(); // ✅ Rafraîchir immédiatement au démarrage
      setInterval(() => {
        this.refreshToken();
      }, 50 * 60 * 1000); // ⏳ Rafraîchir toutes les 50 minutes
    },

    logout() {
      localStorage.removeItem("prenom");
      localStorage.removeItem("email");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");

      this.prenom = "";
      this.email = "";
      this.message = "Vous êtes déconnecté.";
      this.messageType = "alert-info";

      if (this.$router) {
        this.$router.push("/login"); // ✅ Redirection via Vue Router (sans reload)
      }
    },

    async sha256(text) {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
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
