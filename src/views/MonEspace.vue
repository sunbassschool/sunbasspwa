<template>
  <Layout>
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="w-100 mx-auto">
          <div class="card glass-card p-4 text-center animated-card">
            <h2 class="mb-3 text-primary">🎸 Mon Espace Personnel</h2>

            <!-- Affichage en cas de chargement -->
            <div v-if="loading" class="text-center">
              <div class="spinner-border text-primary" role="status"></div>
              <p class="mt-2 text-muted">Chargement des données...</p>
            </div>

            <!-- Affichage d'erreur -->
            <div v-else-if="error" class="alert alert-danger">
              <strong>❌ Oups !</strong> {{ error }}
            </div>

            <!-- Affichage des informations -->
            <div v-else>
              <h4 class="mb-4">👋 Bonjour, <strong>{{ prenom }}</strong> !</h4>

              <!-- Bloc du prochain cours -->
              <div class="info-box bg-light p-3 rounded shadow-sm">
                <h5 class="mb-2">📅 Prochain cours</h5>
                <p class="font-weight-bold">{{ nextCourseDate }}</p>
                <a v-if="hasMeetLink" :href="meetLink" target="_blank" class="btn btn-success btn-lg mt-2">
                  🎥 Accéder à mon cours
                </a>
                <p v-else class="text-danger mt-2">⚠ Aucun lien disponible.</p>
              </div>

              <!-- Notifications récentes -->
              <div v-if="notifications.length" class="info-box p-3 mt-4 bg-white shadow-sm rounded">
                <h5>📢 Notifications</h5>
                <ul class="list-group">
                  <li v-for="(notification, index) in notifications" :key="index" class="list-group-item">
                    🔔 {{ notification }}
                  </li>
                </ul>
              </div>

              <!-- Ressources disponibles -->
              <div class="info-box bg-light p-3 rounded shadow-sm mt-4">
                <h5>📚 Ressources</h5>
                <ul class="list-group">
                  <li class="list-group-item">
                    📄 <a href="#">Partitions de la semaine</a>
                  </li>
                  <li class="list-group-item">
                    🎵 <a href="#">Exercices à travailler</a>
                  </li>
                  <li class="list-group-item">
                    🎥 <a href="#">Replay du dernier cours</a>
                  </li>
                </ul>
              </div>
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
  name: "MonEspace",
  components: { Layout },
  data() {
    return {
      email: "",
      prenom: "",
      meetLink: "",
      nextCourseDate: "",
      notifications: [],
      objectif: "",
      playlistyoutube: "",
      loading: true,
      error: "",
      apiURL: "https://script.google.com/macros/s/AKfycby6El-IE3uF-ktu2wS13UtPGoktVuPGr56af8ctZ2hv1UUBEpCDWaOL06YRetDR54bGjQ/exec"
    };
  },
  computed: {
    hasMeetLink() {
      return this.meetLink && this.meetLink !== "Aucun lien disponible";
    }
  },
  mounted() {
    const email = localStorage.getItem("email");
    const prenom = localStorage.getItem("prenom");

    console.log("🔍 LocalStorage récupéré - Email:", email);
    console.log("🔍 LocalStorage récupéré - Prénom:", prenom);

    if (email && prenom) {
      this.email = email.trim().toLowerCase();
      this.prenom = prenom.trim(); // On enlève les espaces au cas où
      this.fetchStudentData();
    } else {
      this.error = "Utilisateur non connecté.";
      this.loading = false;
    }
  },
  methods: {
    async fetchStudentData() {
      const cacheKey = `studentData_${this.email}`;
      const cacheExpirationKey = `${cacheKey}_expiration`;
      const cachedData = localStorage.getItem(cacheKey);
      const cacheExpiration = localStorage.getItem(cacheExpirationKey);

      const isCacheValid = cachedData && cacheExpiration && Date.now() < parseInt(cacheExpiration, 10);

      if (!isCacheValid) {
        console.log("🔄 Cache expiré, récupération des nouvelles données...");
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(cacheExpirationKey);
      } else {
        console.log("⚡ Chargement des données depuis le cache");
        const data = JSON.parse(cachedData)[0]; // Prendre le premier objet du tableau

        console.log("✅ Données chargées depuis le cache :", data);

        this.prenom = data.prenom || "Utilisateur";
        this.meetLink = data.meet;
        this.nextCourseDate = data.nextCourseDate;
        this.notifications = data.notifications || [];
        this.objectif = data.objectif || "";
        this.playlistyoutube = data.playlistyoutube || "";
        this.loading = false;
        this.$forceUpdate(); // 🔥 Force la mise à jour de Vue
        return;
      }

      try {
        console.log("🌐 Requête envoyée :", `${this.apiURL}?email=${encodeURIComponent(this.email)}`);
        const response = await fetch(`${this.apiURL}?email=${encodeURIComponent(this.email)}`);
        const data = await response.json();

        console.log("📩 Données reçues de l'API :", data);

        if (data.error) {
          this.error = data.error;
        } else {
          this.prenom = data.prenom || "Utilisateur";
          this.meetLink = data.meet;
          this.nextCourseDate = data.nextCourseDate;
          this.notifications = data.notifications || [];
          this.objectif = data.objectif || "";
          this.playlistyoutube = data.playlistyoutube || "";

          // ✅ Stocker les nouvelles données en cache (valable 5 minutes)
          localStorage.setItem(cacheKey, JSON.stringify(data));
          localStorage.setItem(cacheExpirationKey, (Date.now() + 5 * 60 * 1000).toString());

          this.$forceUpdate(); // 🔥 Force la mise à jour de Vue
        }
      } catch (err) {
        this.error = "Erreur de récupération des données.";
        console.error("❌ Erreur lors de la requête API :", err);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>




<style scoped>
/* Suppression du soulignement et couleur par défaut */
a {
  text-decoration: underline;
  color: #2e2e2e; /* Bleu agréable */
  font-weight: 600;
  transition: color 0.3s ease-in-out;
}

/* Effet au survol */
a:hover {
  color: #0056b3; /* Bleu plus foncé */
  text-decoration: underline;
}

/* Style des cartes */

/* Augmentation de la taille et de l’espacement du texte */
h2, h4, h5 {
  font-size: 1.4rem;
  letter-spacing: 0.5px;
  margin-bottom: 3%;
}

p {
  font-size: 1.1rem;
  line-height: 1.6;
}

/* Espacement entre les éléments */
.info-box {
  padding: 20px;
  margin-top: 15px;
}

/* Amélioration de la lisibilité des notifications */
.list-group-item {
  font-size: 1.2rem;
  padding: 13px;
  display: flex;
  align-items: center;
}

/* Ajout d'une icône devant chaque élément de la liste */
.list-group-item::before {
  content: "";
  margin-right: 10px;
}

.card {
  border-radius: 15px;
  max-width: 1000px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}


/* Animation d'entrée */
.animated-card {
  animation: fadeIn 0.8s ease-in-out;
}

/* Boîtes d'informations */
.info-box {
  border-left: 5px solid #5784d6;
  padding: 15px;
  margin-top: 10px;
}

/* Effet survol boutons */
.btn-success:hover {
  background-color: #28a745;
  transition: 0.3s;
}

/* Animation */
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
.glass-card {
  background: rgba(255, 255, 255, 0.2); /* Transparence légère */

  border-radius: 15px; /* Coins arrondis */
  border: 1px solid rgba(255, 255, 255, 0.3); /* Bordure fine translucide */
  box-shadow: 0 4px 5px rgba(0, 0, 0, 0.1); /* Ombre légère */
  transition: all 0.3s ease-in-out; /* Animation fluide */
}

/* Ajout d'un effet au survol */
.glass-card:hover {
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  transform: translateY(-3px);
}
</style>
