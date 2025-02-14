<template>
  <Layout>
    <div class="container d-flex flex-column align-items-center justify-content-center">
      <div v-if="!isLoggedIn" class="content text-center">
        <!-- Message d'accueil pour l'élève non connecté -->
        <h2 class="mb-4">Bienvenue sur l'application SunBassSchool !</h2>
        <p class="text-muted mb-5">Pour accéder à vos informations, vous devez vous connecter ou vous inscrire.</p>
        
        <div class="d-flex justify-content-center gap-4">
          <button @click="redirectToRegisterform" class="btn btn-primary">S'inscrire</button>
          <button @click="redirectToLogin" class="btn btn-secondary">Se connecter</button>
        </div>
      </div>

      <!-- Contenu principal, si l'élève est connecté -->
      <div v-else class="content">
        <div 
          v-for="(card, index) in cards" 
          :key="index" 
          class="fade-in"
          :class="{ 'first-card': index === 0 }"
        >
          <!-- Carte -->
          <div class="dashboard-card rounded-3 p-4 d-flex align-items-center">
            <i :class="card.icon" class="icon me-3"></i>
            <div>
              <h3 class="h5 mb-1">{{ card.title }}</h3>
              <p class="text-muted mb-0">{{ card.text }}</p>
            </div>
          </div>

          <!-- Séparateur sauf pour la dernière carte -->
          <div v-if="index < cards.length - 1" class="separator"></div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script>
import Layout from "../views/Layout.vue";
import axios from "axios"; // Pour récupérer les données API

export default {
  name: "Home",
  components: {
    Layout,
  },
  data() {
    return {
      cards: [],
      nomEleve: "",
      objectif: "",
      prochainCours: "",
      isLoggedIn: false, // L'élève n'est pas connecté par défaut
      cacheDuration: 5 * 60 * 1000, // ⏳ Durée du cache : 5 minutes (en millisecondes)
    };
  },
  mounted() {
    const email = localStorage.getItem("email");
    const prenom = localStorage.getItem("prenom");

    if (email && prenom) {
      this.isLoggedIn = true;
      this.fetchStudentData(email, prenom);
    }
  },
  methods: {
    async fetchStudentData(email, prenom) {
      // Vérifier si les données sont déjà en cache
      const cacheKey = `planning_${email}_${prenom}`;
      const cachedData = localStorage.getItem(cacheKey);
      const cacheTimestamp = localStorage.getItem(`${cacheKey}_timestamp`);

      // 🔹 Vérifier si le cache est valide (moins de 5 minutes)
      if (cachedData && cacheTimestamp && Date.now() - cacheTimestamp < this.cacheDuration) {
        console.log("⚡ Chargement des données depuis le cache");
        this.updateData(JSON.parse(cachedData));
        return;
      }

      try {
        console.log("🌐 Récupération des données depuis l'API...");
        const response = await axios.get("https://script.google.com/macros/s/AKfycbyONssEhZB8DzTkDij1hwvUXVdNSCe3JnqjAs88hCVC1-oNHSS9cPthQGA0ZJaNVlrZfA/exec", {
          params: { route: "planning", email, prenom },
        });

        const data = response.data;
        
        // ✅ Stocker les données dans le cache local
        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(`${cacheKey}_timestamp`, Date.now());

        this.updateData(data);
      } catch (error) {
        console.error("❌ Erreur lors de la récupération des données : ", error);
        this.displayError();
      }
    },

    updateData(data) {
      this.nomEleve = data.nom || "Nom inconnu";
      this.objectif = data.objectif || "Aucun objectif défini";
      this.prochainCours = data.prochainCours ? `${data.prochainCours.date} - ${data.prochainCours.cours}` : "Pas de cours prévu.";

      this.cards = [
        {
          icon: "bi bi-calendar-event",
          title: "Prochain Cours",
          text: this.prochainCours,
        },
        {
          icon: "bi bi-flag",
          title: "Objectif actuel",
          text: `Ton objectif : ${this.objectif}`,
        },
      ];
    },

    displayError() {
      this.cards = [
        {
          icon: "bi bi-calendar-event",
          title: "Prochain Cours",
          text: "Impossible de récupérer les données du prochain cours.",
        },
        {
          icon: "bi bi-flag",
          title: "Objectif actuel",
          text: "Impossible de récupérer l'objectif de l'élève.",
        },
      ];
    },

    redirectToSignUp() {
      window.location.href = "/signup"; 
    },
    redirectToRegisterform() {
      this.$router.push("/Registerform");
    },
    redirectToLogin() {
      window.location.href = "/login";
    },
  },
};
</script>


<style scoped>
/* Conteneur principal */
.container {
  padding: 40px 0;
}

/* Contenu centré et limité */
.content {
  width: 100%;
  max-width: 800px;
}

/* Message d'accueil */
.text-center {
  text-align: center;
}

/* Ajout de la marge uniquement sur la première carte */
.first-card {
  margin-top: 10px;
}

/* Cartes */
.dashboard-card {
  background: white;
  border: 1px solid #e0e0e0;
  min-height: 120px;
  display: flex;
  align-items: center;
  transition: transform 0.2s ease-in-out, background-color 0.3s ease-in-out;
}

/* Effet de survol */
.dashboard-card:hover {
  transform: translateY(-3px);
  background-color: #f8f9fa;
}

/* Icônes plus visibles */
.icon {
  font-size: 2.5rem;
  color: #007bff;
}

/* Séparateur sobre */
.separator {
  height: 1px;
  background-color: #e0e0e0;
  margin: 20px 0;
}

/* Effet d'apparition fluide */
.fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Style des boutons d'inscription et de connexion */
button {
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 5px;
}

.btn-primary {
  background-color: #007bff;
  border: none;
  color: white;
}

.btn-secondary {
  background-color: #6c757d;
  border: none;
  color: white;
}

button:hover {
  opacity: 0.8;
}
</style>
