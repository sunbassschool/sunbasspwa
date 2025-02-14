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
      email: localStorage.getItem("email") || "",  // ✅ Récupération dès le début
      prenom: localStorage.getItem("prenom") || "",  // ✅ Récupération dès le début
      password: "",
      message: "",
      messageType: "",
      sheetURL: "https://script.google.com/macros/s/AKfycbxHbFX8z5qQa46v_nfX4N85_U-XmjPbfrI1n_CNLTPe16j_jwA-sj30jgeaShWdWC5Mqg/exec",
      updateURL: "https://thingproxy.freeboard.io/fetch/https://script.google.com/macros/s/AKfycbxHbFX8z5qQa46v_nfX4N85_U-XmjPbfrI1n_CNLTPe16j_jwA-sj30jgeaShWdWC5Mqg/exec"
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
        console.log("📡 Envoi de la requête pour récupérer les utilisateurs...");
        const response = await fetch(this.sheetURL);

        if (!response.ok) {
          const errorText = await response.text(); // Récupérer le message d'erreur du serveur
          throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
        }

        const users = await response.json();
        console.log("🔍 Données récupérées :", users);

        if (!Array.isArray(users)) {
          throw new Error("Données inattendues : la réponse n'est pas un tableau.");
        }

        // Vérifier la présence des champs avant de faire un .trim()
        const user = users.find(user =>
          user.email?.trim() === this.email.trim() &&
          user.hashedCode?.trim() === hashedPassword
        );

        if (!user) {
          console.error("❌ Aucun utilisateur trouvé avec cet email et ce mot de passe !");
          this.message = "❌ Identification échouée";
          this.messageType = "alert-danger";
          return;
        }

        // ✅ Stockage dans localStorage et mise à jour immédiate
        localStorage.setItem("prenom", user.prenom?.trim() || "");
        localStorage.setItem("email", user.email?.trim() || "");

        this.prenom = user.prenom?.trim() || "";
        this.email = user.email?.trim() || "";

        this.message = "✅ Identifiant OK";
        this.messageType = "alert-success";

        // 🔥 Mise à jour de la dernière connexion
        await fetch(this.updateURL, {
          method: "POST",
          mode: "cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: this.email, hashedPassword })
        });

        // ✅ Sécurisation de la redirection
        if (this.$router) {
          this.$router.push('/dashboard');
        } else {
          console.warn("🚨 Redirection échouée : Vue Router non disponible !");
        }

      } catch (error) {
        console.error("🚨 Erreur lors de la récupération des utilisateurs :", error);
        this.message = `Erreur de connexion : ${error.message}`;
        this.messageType = "alert-danger";
      }
    },

    logout() {
      localStorage.removeItem("prenom");
      localStorage.removeItem("email");

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
