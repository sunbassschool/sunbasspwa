<template>
  <div class="intro-container">
    <!-- Logo en haut de la page -->
    <div v-if="!showModal" class="logo-container">
      <img src="https://www.sunbassschool.com/wp-content/uploads/elementor/thumbs/logo-SBS-petit-noir-rond-qf7iqpi0p97tz5mjdf4z5tozj12xis13yrrqut5pew.png" alt="SunBassSchool Logo" class="logo" />
    </div>

    <!-- Spinner de chargement -->
    <div v-if="!showModal" class="d-flex justify-content-center align-items-center" style="height: calc(100vh - 120px);">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Fenêtre d'intro (visible après l'animation de chargement) -->
    <transition name="fade" mode="out-in" appear>
      <div v-if="showModal" class="intro-box text-center p-4">
        <h1 class="title mb-3">Bienvenue sur <span class="highlight">SunBassSchool</span></h1>
        <p class="subtitle mb-4">Prépare-toi à plonger dans l'univers de la basse 🎸</p>
        <button class="btn btn-primary btn-lg start-button" @click="goToDashboard">
    <i class="bi bi-play-circle-fill me-2"></i>Commencer
  </button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

const showModal = ref(false);
const router = useRouter();

onMounted(() => {
  // Affiche le spinner pendant 2 secondes (simulation de chargement)
  setTimeout(() => {
    showModal.value = true; // Affiche le contenu principal après 2 secondes
  }, 2000); // Temps de chargement du spinner
});

const goToDashboard = () => {
  showModal.value = false;
  setTimeout(() => {
    router.push("/dashboard"); // Redirection vers le tableau de bord
  }, 800); // Délai avant la redirection
};
</script>

<style scoped>
/* ✅ Fond et affichage plein écran */
.intro-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(to bottom right, #1a1a2e, #0f0f1b);
}

/* ✅ Conteneur du logo */
.logo-container {
  margin-bottom: 40px; /* Espacement entre le logo et le spinner */
}

/* ✅ Style du logo */
.logo {
  margin-top:200px;
  width: 100px; /* Taille du logo (ajuste selon ta préférence) */
  height: auto;
}

/* ✅ Spinner de chargement */
.spinner-border {
  width: 2rem;
  height: 2rem;
}

/* ✅ Fenêtre d'intro avec effet de verre */
.intro-box {
  width: 450px;
  padding: 30px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0px 10px 40px rgba(0, 0, 0, 0.6);
  text-align: center;
}

/* ✅ Style du texte */
.title {
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
}

.highlight {
  color: #60a5fa;
}

.subtitle {
  font-size: 1.2rem;
  color: #d1d5db;
  margin-top: 10px;
}

/* ✅ Bouton "Commencer" */
.start-button {
  margin-top: 20px;
  padding: 12px 24px;
  font-size: 1.2rem;
  font-weight: bold;
  color: white;
  background: #60a5fa;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
}

.start-button:hover {
  background: #3b82f6;
  transform: translateY(-5px);
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.5);
}

/* ✅ Animation de fondu améliorée */
.fade-enter-active, .fade-leave-active {
  transition: opacity 1s ease-in-out;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
.fade-enter-to {
  opacity: 1;
}
</style>
