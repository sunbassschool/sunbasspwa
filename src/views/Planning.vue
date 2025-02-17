<template>
  <Layout>
    <div class="container-xxl mt-4">
      <!-- ✅ Affichage uniquement si l'utilisateur est connecté -->
      <div v-if="isLoggedIn">
        <h2 class="text-center mb-3">📅 Planning des Cours</h2>
        <p class="text-muted text-center">Clique sur une ligne pour rejoindre ton cours.</p>
      </div>

      <!-- ✅ Chargement avec message -->
      <div v-if="loading" class="d-flex flex-column align-items-center mt-4">
        <div class="spinner-border text-primary mb-2" role="status"></div>
        <p class="text-muted">Chargement de ton planning...</p>
      </div>

      <!-- ✅ Message si l'utilisateur n'est pas connecté -->
      <div v-if="!loading && !isLoggedIn" class="alert alert-info text-center mt-3">
        <h4 class="fw-bold">🎸 Rejoins SunBassSchool et commence ton apprentissage !</h4>
        <p class="mb-3">
          Il semble que tu n’es pas encore connecté. Pour accéder à ton planning et réserver tes cours de basse, 
          connecte-toi ou crée un compte dès maintenant !
        </p>
        <div class="d-flex justify-content-center gap-3">
          <router-link to="/login" class="btn btn-primary">Se connecter</router-link>
          <router-link to="/Registerform" class="btn btn-success">S'inscrire</router-link>
        </div>
      </div>

      <!-- ✅ Message si aucun cours trouvé, mais seulement après le chargement -->
      <div v-if="!loading && planningData.length === 0 && isLoggedIn" class="alert alert-warning text-center mt-3">
        Aucun cours trouvé pour ton compte.
      </div>

      <!-- ✅ Tableau des cours, affiché uniquement après le chargement -->
      <div v-if="!loading && planningData.length > 0" class="table-responsive mt-3">
        <table class="table table-hover shadow-sm" style="font-size: 1rem;">


          <thead class="table-dark">
            <tr>
              <th scope="col">📆 Date & Heure</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in planningData" :key="index" @click="openMeet(row.meet)" class="clickable-row">
              <td><strong>{{ row.formattedDate }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </Layout>
</template>



<script>
import Layout from "../views/Layout.vue";
import axios from "axios";
import { ref, computed, onMounted } from "vue";
import { jwtDecode } from "jwt-decode"; // 📌 Décodage du JWT

export default {
  name: "Planning",
  components: { Layout },
  setup() {
    const planningData = ref([]);
    const loading = ref(true);

    const API_URL = "https://script.google.com/macros/s/AKfycbzGV13_iuC5shxErpbzwJoRBLGPHsH5osBvw0K2M_xh_TsJx9P0Fq1A0_1S4XDd0AW3nA/exec";
    const cacheDuration = 5 * 60 * 1000; // 5 minutes

    // ✅ Vérifie si l'utilisateur est connecté
    const isLoggedIn = computed(() => {
      const jwt = sessionStorage.getItem("jwt");
      if (!jwt) return false;

      try {
        const decoded = jwtDecode(jwt);
        return decoded.exp * 1000 > Date.now();
      } catch (error) {
        console.error("🚨 JWT invalide :", error);
        return false;
      }
    });

    // ✅ Récupère l'email depuis le JWT
    const email = computed(() => sessionStorage.getItem("email") || "");
    const prenom = computed(() => sessionStorage.getItem("prenom") || "");

    // ✅ Formatte la date pour l'affichage
    const formatDate = (rawDate) => {
      if (!rawDate) return "Date invalide";

      const match = rawDate.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/);
      if (!match) return "Date invalide";

      const [, day, month, year, hours, minutes] = match.map(Number);
      const parsedDate = new Date(year, month - 1, day, hours, minutes);

      return isNaN(parsedDate.getTime())
        ? "Date invalide"
        : new Intl.DateTimeFormat("fr-FR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(parsedDate);
    };

    const fetchPlanningData = async () => {
  if (!isLoggedIn.value) {
    loading.value = false;
    return;
  }

  const cacheKey = `planning_${email.value}_${prenom.value}`;
  const cacheTimestampKey = `${cacheKey}_timestamp`;
  const cachedData = localStorage.getItem(cacheKey);
  const cacheTimestamp = localStorage.getItem(cacheTimestampKey);
  const cacheExpired = !cacheTimestamp || Date.now() - cacheTimestamp > cacheDuration;

  if (cachedData && !cacheExpired) {
    try {
      const parsedData = JSON.parse(cachedData);
      
      // Validation supplémentaire de la structure des données
      if (!Array.isArray(parsedData) || parsedData.length === 0 || !parsedData.every(item => item.date && item.meet)) {
        throw new Error("Cache corrompu, suppression...");
      }

      console.log("⚡ Chargement du planning depuis le cache");
      planningData.value = parsedData;
      loading.value = false;
      return;
    } catch (error) {
      console.warn(error.message);
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(cacheTimestampKey);
    }
  }

  if (cacheExpired) {
    console.log("🔄 Cache expiré, récupération des nouvelles données...");
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(cacheTimestampKey);
  }

  try {
    console.log("🌐 Requête envoyée :", `${API_URL}?route=planning&email=${encodeURIComponent(email.value)}&prenom=${encodeURIComponent(prenom.value)}`);
    const response = await axios.get(`${API_URL}?route=planning&email=${encodeURIComponent(email.value)}&prenom=${encodeURIComponent(prenom.value)}`);

    console.log("✅ Données reçues :", response.data);

    if (Array.isArray(response.data) && response.data.length > 0) {
      planningData.value = response.data.map((item) => ({
        date: item.date,
        formattedDate: item.date ? formatDate(item.date) : "Date invalide",
        meet: item.meet,
      }));

      localStorage.setItem(cacheKey, JSON.stringify(planningData.value));
      localStorage.setItem(cacheTimestampKey, Date.now());
    } else {
      console.error("❌ Les données récupérées sont invalides");
      alert("Erreur lors du chargement des cours.");
    }
  } catch (error) {
    console.error("❌ Erreur lors du chargement des cours :", error);
    alert("Une erreur est survenue lors du chargement de ton planning.");
  } finally {
    loading.value = false;
      }
    };

    const openMeet = (url) => {
      if (url) {
        window.open(url, "_blank");
      }
    };

    onMounted(fetchPlanningData);

    return { planningData, loading, isLoggedIn, openMeet };
  },
};
</script>










<style scoped>
/* ✅ Style amélioré */
h2 {
  font-weight: bold;
  color: #343a40;
}

.table {
  border-radius: 10px;
  overflow: hidden;
}

/* ✅ Meilleure lisibilité sur mobile */
.table th, .table td {
  padding: 15px;
  text-align: center;
  vertical-align: middle;
  white-space: nowrap;
}

.table th {
  background-color: #212529;
  color: #ffffff;
}

/* ✅ Effet au survol et curseur main */
.table-hover tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

/* ✅ Gestion des erreurs */
.alert {
  font-weight: bold;
  font-size: 1.1rem;
}
</style>
