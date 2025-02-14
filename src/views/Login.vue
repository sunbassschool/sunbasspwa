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
      message: "", // ✅ Garder uniquement pour les erreurs
      isLoading: false, // 🚀 Gestion du spinner
      sheetURL: "https://script.google.com/macros/s/AKfycbz3mq5O5fnLXqIHgzVJS2eZhqEteR_4tGgRDjuTfvfRN3-ZHVcfUtVsTla714P2HLLP9g/exec",
      updateURL: "https://thingproxy.freeboard.io/fetch/https://script.google.com/macros/s/AKfycbz3mq5O5fnLXqIHgzVJS2eZhqEteR_4tGgRDjuTfvfRN3-ZHVcfUtVsTla714P2HLLP9g/exec"
    };
  },

  methods: {
    async login() {
      console.time("⏳ Début login");
      this.isLoading = true; // 🚀 Activation du spinner
      this.message = ""; // ✅ Effacer tout message précédent

      if (!this.email || !this.password) {
        this.message = "Veuillez remplir tous les champs.";
        this.isLoading = false;
        return;
      }

      try {
        console.time("🔐 Hachage SHA-256");
        const hashedPassword = await this.sha256(this.password);
        console.timeEnd("🔐 Hachage SHA-256");

        console.time("📡 Fetch getUsers");
        const response = await fetch(this.sheetURL);
        console.timeEnd("📡 Fetch getUsers");

        console.time("📂 JSON parsing");
        const users = await response.json();
        console.timeEnd("📂 JSON parsing");

        console.time("🔍 Recherche utilisateur");
        const user = users.find(user =>
          user.email?.trim() === this.email.trim() &&
          user.hashedCode?.trim() === hashedPassword
        );
        console.timeEnd("🔍 Recherche utilisateur");

        if (!user) {
          this.message = "❌ Identification échouée";
          this.isLoading = false;
          return;
        }

        console.time("💾 Stockage LocalStorage");
        localStorage.setItem("prenom", user.prenom?.trim() || "");
        localStorage.setItem("email", user.email?.trim() || "");
        console.timeEnd("💾 Stockage LocalStorage");

        this.prenom = user.prenom?.trim() || "";
        this.email = user.email?.trim() || "";

        console.time("📡 Mise à jour dernière connexion");
        await fetch(this.updateURL, {
          method: "POST",
          mode: "cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: this.email, hashedPassword })
        });
        console.timeEnd("📡 Mise à jour dernière connexion");

        this.isLoading = false; // 🚀 Désactivation du spinner

        console.time("➡️ Redirection vers dashboard");
        if (this.$router) {
          this.$router.push('/dashboard');
        }
        console.timeEnd("➡️ Redirection vers dashboard");

      } catch (error) {
        console.error("🚨 Erreur lors de la connexion :", error);
        this.message = "❌ Une erreur est survenue. Veuillez réessayer.";
        this.isLoading = false;
      }

      console.timeEnd("⏳ Début login");
    },

    logout() {
      localStorage.removeItem("prenom");
      localStorage.removeItem("email");

      this.prenom = "";
      this.email = "";
      this.message = "Vous êtes déconnecté.";
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
