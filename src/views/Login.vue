<template>
  <Layout>
    <div class="container d-flex justify-content-center align-items-center mt-5">
      <div class="row justify-content-center w-200">
        <div class="w-100 mx-auto">
          <div class="card shadow p-5">
            <h2 class="text-center mb-4">🔐 Connexion</h2>
            <form @submit.prevent="login">
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
      jwt: localStorage.getItem("jwt") || "",  
      refreshjwt: localStorage.getItem("refreshjwt") || "",
      apiBaseURL: "https://cors-anywhere.herokuapp.com/https://script.google.com/macros/s/AKfycbze7GQsS-5ptUUTwAcjry5mLOzKVDbaEJ_fkr0jBVM45ab9UafMtcTUtwkEKp0HHVh5mg/exec"
    };
  },
  mounted() {
    console.log("✅ Page montée, vérification des valeurs stockées :");
    console.log("LocalStorage - prenom:", localStorage.getItem("prenom"));
    console.log("LocalStorage - email:", localStorage.getItem("email"));
  },
  watch: {
    email(newEmail, oldEmail) {
      if (newEmail && newEmail !== oldEmail) {
        localStorage.setItem("email", newEmail);
      }
    },
    prenom(newPrenom, oldPrenom) {
      if (newPrenom && newPrenom !== oldPrenom) {
        localStorage.setItem("prenom", newPrenom);
      }
    }
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

  try {
    console.log("📡 Envoi de la requête de connexion...");
    const response = await fetch(`${this.apiBaseURL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
      },
      body: JSON.stringify({
        route: "login",  // Spécifie que la route est "login"
        email: this.email,
        password: hashedPassword  // Envoie le mot de passe haché pour plus de sécurité
      })
    });

    const data = await response.json();
    console.log("🔍 Réponse API :", data);

    if (data.status === 'error') {
      this.message = `❌ ${data.message}`;
      this.messageType = "alert-danger";
      return;
    }

    // ✅ Stockage des tokens dans localStorage
    localStorage.setItem("jwt", data.data.jwt);  // Stocke le JWT
    localStorage.setItem("refreshjwt", data.data.refreshToken);  // Stocke le refreshToken
    this.jwt = data.data.jwt;
    this.refreshjwt = data.data.refreshToken;

    // ✅ Stocke aussi les infos utilisateur
    this.prenom = data.data.prenom || "Utilisateur";
    this.email = data.data.email;

    localStorage.setItem("prenom", this.prenom);
    localStorage.setItem("email", this.email);

    this.message = "✅ Connexion réussie";
    this.messageType = "alert-success";

    // 🔥 Récupération des infos utilisateur
    await this.fetchUserInfo();  // Si nécessaire, cette méthode peut être adaptée pour afficher des infos supplémentaires

  } catch (error) {
    console.error("🚨 Erreur lors de la connexion :", error);
    this.message = `Erreur de connexion : ${error.message}`;
    this.messageType = "alert-danger";
  }
},

async fetchUserInfo() {
  try {
    console.log("📡 Récupération des infos utilisateur...");
    const response = await fetch(`${this.apiBaseURL}?route=getUser&jwt=${this.jwt}`, {
      headers: {
        "X-Requested-With": "XMLHttpRequest"
      }
    });

    if (!response.ok) throw new Error("Erreur lors de la récupération des données");

    const userInfo = await response.json();
    console.log("👤 Infos utilisateur :", userInfo);

    // Stocke les informations récupérées
    this.prenom = userInfo.data.prenom || "";
    this.email = userInfo.data.email || "";

    localStorage.setItem("prenom", this.prenom);
    localStorage.setItem("email", this.email);

    this.message = "✅ Connexion réussie";
    this.messageType = "alert-success";

    // 🔥 Redirection après connexion
    this.$router.push('/dashboard');

  } catch (error) {
    console.error("🚨 Erreur lors de la récupération des infos utilisateur :", error);
    this.message = "Erreur lors de la récupération des infos utilisateur.";
    this.messageType = "alert-danger";
    }
  },

  logout() {
    localStorage.removeItem("jwt");
    localStorage.removeItem("refreshjwt");
    localStorage.removeItem("prenom");
    localStorage.removeItem("email");

    this.jwt = "";
    this.refreshjwt = "";
    this.prenom = "";
    this.email = "";

    this.message = "Vous êtes déconnecté.";
    this.messageType = "alert-info";
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
