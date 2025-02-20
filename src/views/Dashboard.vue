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

      <!-- 🔒 Si l'élève n'est pas connecté -->
      <div v-else-if="!isLoggedIn" class="content text-center">
        <h2 class="mb-4">Bienvenue sur l'application SunBassSchool !</h2>
        <p class="text-muted mb-5">Pour accéder à vos informations, vous devez vous connecter ou vous inscrire.</p>
        
        <div class="d-flex justify-content-center gap-4">
          <button @click="redirectToRegisterform" class="btn btn-primary">S'inscrire</button>
          <button @click="redirectToLogin" class="btn btn-secondary">Se connecter</button>
        </div>
      </div>

      <!-- ✅ Contenu principal si l'élève est connecté -->
      <div v-else class="content">

        <div 
          v-for="(card, index) in cards" 
          :key="index" 
          class="fade-in position-relative"
          :class="{ 'first-card': index === 0 }"
        >
          <div class="dashboard-card rounded-3 p-4 d-flex align-items-center">
            <i :class="card.icon" class="icon me-3"></i>
            <div>
              <h3 class="h5 mb-1 d-flex align-items-center">
                {{ card.title }}

                <!-- 🔄 Bouton mise à jour visible uniquement sur la première carte -->
                <button 
  v-if="index === 0 || index === 1" 
  @click="forceUpdateCache" 
  class="update-cache-btn ms-2"
>
  <i class="bi bi-arrow-clockwise"></i>
</button>


              </h3>
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
      cacheDuration: 24 * 60 * 60 * 1000, // ⏳ Durée du cache : 5 minutes
    };
  },
  computed: {
   isLoggedIn() {
      let jwt = sessionStorage.getItem("jwt");

      console.log("🔍 Vérification JWT dans sessionStorage :", jwt);

      // 🚀 Vérifier aussi dans localStorage si jamais il a été restauré récemment
      if (!jwt) {
         console.log("⚠️ Aucun JWT en sessionStorage, tentative de récupération depuis localStorage...");
         jwt = localStorage.getItem("jwt");

         if (jwt) {
            sessionStorage.setItem("jwt", jwt); // 🔄 Restaurer dans sessionStorage
            console.log("✅ JWT restauré depuis localStorage :", jwt);
         } else {
            console.warn("❌ Aucun JWT trouvé.");
            return false;
         }
      }

      try {
         const decoded = jwtDecode(jwt);
         return decoded.exp * 1000 > Date.now(); // 🔥 Vérifie si le JWT est expiré
      } catch (error) {
         console.error("🚨 JWT invalide :", error);
         return false;
      }
   
}
,
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
    async forceUpdateCache() {
    console.log("🔄 Mise à jour forcée des données...");
    
    // Supprimer les données mises en cache
    const cacheKey = `dashboard_${this.email}_${this.prenom}`;
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(`${cacheKey}_timestamp`);

    // Recharger les données depuis l'API
    this.isLoading = true;
    await this.fetchStudentData();
  },
    async fetchStudentData() {
      const cacheKey = `dashboard_${this.email}_${this.prenom}`;
  const cachedData = localStorage.getItem(cacheKey);
  const cacheTimestamp = localStorage.getItem(`${cacheKey}_timestamp`);

  if (cachedData && cacheTimestamp && Date.now() - cacheTimestamp < this.cacheDuration) {
  console.log("⚡ Chargement des données depuis le cache :", cachedData);

  try {
    const parsedData = JSON.parse(cachedData);
    
    if (this.isCacheValid(parsedData)) {
      this.updateData(parsedData);
      this.isLoading = false;
      return;
    } else {
      console.log("⚠️ Cache corrompu détecté :", parsedData);
    }
  } catch (error) {
    console.error("❌ Erreur lors du parsing du cache : ", error);
  }
}


  // 🔥 Si le cache est corrompu ou manquant, récupérer les données depuis l'API
  try {
    console.log("🌐 Récupération des données depuis l'API...");
    const response = await fetch(`https://script.google.com/macros/s/AKfycbyONssEhZB8DzTkDij1hwvUXVdNSCe3JnqjAs88hCVC1-oNHSS9cPthQGA0ZJaNVlrZfA/exec?route=planning&email=${this.email}&prenom=${this.prenom}`);
    const data = await response.json();

    // 🚫 Vérifier si l'API retourne une erreur et ne pas l'enregistrer
    if (data.status === "error") {
      console.error("❌ Erreur API détectée :", data.message);
      return;
    }

    // Sauvegarde propre dans le cache
    localStorage.setItem(cacheKey, JSON.stringify(data));
    localStorage.setItem(`${cacheKey}_timestamp`, Date.now());
    this.updateData(data);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des données : ", error);
    this.displayError();
  }

  this.isLoading = false;
}
,

  // Fonction de validation du cache
  isCacheValid(data) {
  if (!data || typeof data !== "object") return false;

  // 🚨 Vérifier si l'API a renvoyé une erreur critique
  if (data.status === "error" || data.error) {
    if (data.error === "Aucun lien Meet trouvé") {
      console.warn("⚠️ Avertissement : Aucun lien Meet trouvé, mais ce n'est pas une erreur bloquante.");
      return true; // ✅ Accepter quand même ces données
    }

    console.error("❌ Cache invalide détecté :", data.error || data.message);
    return false;
  }

  const hasValidProchainCours =
    data.prochainCours &&
    typeof data.prochainCours === "object" &&
    typeof data.prochainCours.date === "string" &&
    typeof data.prochainCours.cours === "string";

  const hasValidObjectif = typeof data.objectif === "string";

  return hasValidProchainCours || hasValidObjectif;
}
,

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
/* 🔄 Bouton de mise à jour du cache */
.update-cache-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  font-size: 1rem;
  color: #007bff;
  cursor: pointer;
  transition: opacity 0.3s ease-in-out;
}

.update-cache-btn:hover {
  opacity: 0.7;
}

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
