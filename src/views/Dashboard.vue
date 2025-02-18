<template>
  <Layout>
    <div class="container d-flex flex-column align-items-center justify-content-center">
      
      <!-- 🔄 Spinner affiché pendant le chargement -->
      <div v-if="isLoading" class="text-center mt-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Chargement...</span>
        </div>
        <p class="mt-3">Chargement en cours...</p>
      </div>

      <!-- Si l'élève n'est pas connecté -->
      <div v-else-if="!isLoggedIn" class="content text-center">
        <h2 class="mb-4">Bienvenue sur l'application SunBassSchool !</h2>
        <p class="text-muted mb-5">Pour accéder à vos informations, vous devez vous connecter ou vous inscrire.</p>
        
        <div class="d-flex justify-content-center gap-4">
          <button @click="redirectToRegisterform" class="btn btn-primary">S'inscrire</button>
          <button @click="redirectToLogin" class="btn btn-secondary">Se connecter</button>
        </div>
      </div>

      <!-- Contenu principal si l'élève est connecté -->
      <div v-else class="content">
        <div 
          v-for="(card, index) in cards" 
          :key="index" 
          class="fade-in"
          :class="{ 'first-card': index === 0 }"
        >
          <div class="dashboard-card rounded-3 p-4 d-flex align-items-center">
            <i :class="card.icon" class="icon me-3"></i>
            <div>
              <h3 class="h5 mb-1">{{ card.title }}</h3>
              <p class="text-muted mb-0" v-html="card.text"></p>

            </div>
          </div>
          <div v-if="index < cards.length - 1" class="separator"></div>
        </div>
      </div>

    </div>
  </Layout>
</template>

<script>
import Layout from "../views/Layout.vue";
import { jwtDecode } from "jwt-decode"; // 📌 Ajout du décodage du JWT

export default {
  name: "Home",
  components: { Layout },
  data() {
    return {
      cards: [],
      isLoading: true, // 🚀 Ajout du spinner au chargement
      cacheDuration: 5 * 60 * 1000, // ⏳ Durée du cache : 5 minutes
    };
  },
  computed: {
    isLoggedIn() {
      const jwt = sessionStorage.getItem("jwt");
      if (!jwt) return false;

      try {
        const decoded = jwtDecode(jwt);
        return decoded.exp * 1000 > Date.now(); // 🔥 Vérifie si le JWT est expiré
      } catch (error) {
        console.error("🚨 JWT invalide :", error);
        return false;
      }
    },
    email() {
      return sessionStorage.getItem("email") || "";
    },
    prenom() {
      return sessionStorage.getItem("prenom") || "";
    }
  },
  mounted() {
    console.log("✅ Vérification du JWT au chargement...");
    if (this.isLoggedIn) {
      this.fetchStudentData();
    } else {
      this.isLoading = false;
    }
  },
  methods: {
  async fetchStudentData() {
    const cacheKey = `planning_${this.email}_${this.prenom}`;
    const cachedData = localStorage.getItem(cacheKey);
    const cacheTimestamp = localStorage.getItem(`${cacheKey}_timestamp`);

    // Vérifie si le cache existe et est valide
    if (cachedData && cacheTimestamp && Date.now() - cacheTimestamp < this.cacheDuration) {
      console.log("⚡ Chargement des données depuis le cache");

      try {
        const parsedData = JSON.parse(cachedData);
        
        // Vérifie l'intégrité des données
        if (this.isCacheValid(parsedData)) {
          this.updateData(parsedData);
          this.isLoading = false;
          return;
        } else {
          console.log("⚠️ Cache corrompu détecté. Récupération des données depuis l'API...");
        }
      } catch (error) {
        console.error("❌ Erreur lors du parsing du cache : ", error);
        console.log("⚠️ Cache corrompu détecté. Récupération des données depuis l'API...");
      }
    }

    // Si les données sont manquantes ou corrompues, on appelle l'API
    try {
      console.log("🌐 Récupération des données depuis l'API...");
      const response = await fetch(`https://script.google.com/macros/s/AKfycbyONssEhZB8DzTkDij1hwvUXVdNSCe3JnqjAs88hCVC1-oNHSS9cPthQGA0ZJaNVlrZfA/exec?route=planning&email=${this.email}&prenom=${this.prenom}`);
      const data = await response.json();

      // Sauvegarde les nouvelles données dans le cache
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(`${cacheKey}_timestamp`, Date.now());

      this.updateData(data);
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des données : ", error);
      this.displayError();
    }

    this.isLoading = false;
  },

  // Fonction de validation du cache
  isCacheValid(data) {
  if (!data || typeof data !== "object") return false;

  // Vérifie si "prochainCours" existe et est bien structuré
  const hasValidProchainCours =
    data.prochainCours &&
    typeof data.prochainCours === "object" &&
    typeof data.prochainCours.date === "string" &&
    typeof data.prochainCours.cours === "string";

  // Vérifie si "objectif" existe et est une chaîne
  const hasValidObjectif = typeof data.objectif === "string";

  return hasValidProchainCours || hasValidObjectif; // On valide si au moins un des deux est correct
},

  updateData(data) {
    const prochainCours = data.prochainCours
      ? `${data.prochainCours.date} - ${data.prochainCours.cours} Lien d'accès : <a href="${data.prochainCours.meet}" target="_blank">Lien Meet</a>`
      : "Pas de cours prévu.";

    this.cards = [
      { 
        icon: "bi bi-calendar-event", 
        title: "Prochain Cours", 
        text: prochainCours 
      },
      { 
        icon: "bi bi-flag", 
        title: "Objectif actuel", 
        text: `${data.objectif || "Aucun objectif défini"}` 
      }
    ];
  },

  displayError() {
    this.cards = [
      { icon: "bi bi-calendar-event", title: "Prochain Cours", text: "Impossible de récupérer les données du prochain cours." },
      { icon: "bi bi-flag", title: "Objectif actuel", text: "Impossible de récupérer l'objectif de l'élève." },
    ];
    },

    redirectToRegisterform() {
      this.$router.push("/registerform");
    },
    redirectToLogin() {
      this.$router.push("/login");
    }
  }
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
