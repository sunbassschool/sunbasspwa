<template>
  <Layout>
  <div class="register-container">
    <h2 class="text-center mb-4">Inscription SunBassSchool</h2>
    <form @submit.prevent="submitForm" class="card p-4 shadow">
      <!-- Adresse e-mail -->
      <div class="mb-3">
        <label class="form-label">Adresse e-mail</label>
        <input v-model="email" type="email" class="form-control" required />
      </div>

      <!-- Prénom -->
      <div class="mb-3">
        <label class="form-label">Prénom</label>
        <input v-model="prenom" type="text" class="form-control" required />
      </div>

      <!-- Code d'accès -->
      <div class="mb-3">
        <label class="form-label">Code d'accès</label>
        <input v-model="codeAcces" type="password" class="form-control" required />
      </div>

      <!-- Bouton de soumission -->
      <button type="submit" class="btn btn-primary w-100">S'inscrire</button>

      <!-- Message de confirmation -->
      <p v-if="message" class="mt-3 text-success">{{ message }}</p>
    </form>
  </div>
</layout>
</template>

<script>
import Layout from "../views/Layout.vue";
export default {
  name: "Registerform",
  components: { Layout },
  data() {
    return {
      email: "",
      prenom: "",
      codeAcces: "",
      message: "",
    };
  },
  methods: {
    async submitForm() {
      try {
        const response = await fetch(
          `https://script.google.com/macros/s/AKfycbxkIJaFUJlTgsoFC9yui2GmmGT6nAH2aJE77xvt3QGzDItBwPUcu4CFNSsvd37_724m-A/exec?route=register&email=${encodeURIComponent(this.email)}&prenom=${encodeURIComponent(this.prenom)}&codeAcces=${encodeURIComponent(this.codeAcces)}`,
          { method: "GET" }
        );

        const result = await response.json();

        if (result.success) {
          this.message = "Inscription réussie !";
          localStorage.setItem("user", JSON.stringify({
            email: this.email,
            prenom: this.prenom,
            id: result.id
          }));

          this.email = "";
          this.prenom = "";
          this.codeAcces = "";

          setTimeout(() => {
            this.$router.push('/dashboard');
          }, 1500);
        } else {
          this.message = "Erreur lors de l'inscription.";
        }
      } catch (error) {
        console.error("Erreur :", error);
        this.message = "Impossible de contacter le serveur.";
      }
    },
  },
};
</script>

<style scoped>
.register-container {
  max-width: 400px;
  margin: 0 auto;
}
</style>
