<template>
  <div class="layout-container">
    <!-- Bandeau principal amélioré -->
    <header class="hero-banner">
      <div class="hero-content">
        <!-- Logo -->
        <img 
          src="https://www.sunbassschool.com/wp-content/uploads/2025/02/logo-SBS-petit-noir-rond-ok.png" 
          alt="Logo SunBassSchool" 
          class="logo" 
        />

        <!-- Bouton Installer PWA -->
        <button 
          v-if="showInstallButton" 
          @click="installPWA" 
          class="install-btn" 
          title="Installer SunBassAPP"
        >
          📥
        </button>

        <!-- Section centrale pour le texte -->
        <div class="hero-text">
          <h1 class="hero-title">SunBassAPP</h1>
          <p class="hero-subtitle">L'école de basse en ligne qui groove !</p>
        </div>

        <!-- Boutons -->
        <div class="auth-buttons">
          <!-- ✅ Bouton Prendre un Cours (Toujours visible) -->
          <router-link to="/prendreuncours" class="nav-link btn-cours">
            <i class="bi bi-play-circle"></i>
            <span>Prendre un cours</span>
          </router-link>

          <!-- ✅ Bouton Connexion si l'utilisateur n'est pas connecté -->
      

          <!-- ✅ Bouton Déconnexion si l'utilisateur est connecté -->
       

          <!-- ✅ Bouton Mon Espace si l'utilisateur est connecté -->
          <div v-if="prenom">
            <router-link to="/mon-espace" class="nav-link mon-espace">
              <i class="bi bi-person-circle"></i>
              <span>Mon Espace</span>
            </router-link>
          </div>
        </div>
      </div>
    </header>

    <!-- Contenu principal -->
    <main class="page-content">
      <slot></slot>
    </main>

    <!-- Menu de navigation en bas -->
    <footer class="navbar-container">
      <nav class="navbar">
        <ul class="navbar-nav">
          <li class="nav-item">
            <router-link class="nav-link" to="/dashboard">
              <i class="bi bi-house-door"></i>
              <span>Accueil</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/partitions">
              <i class="bi bi-music-note-beamed"></i>
              <span>Partitions</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/planning">
              <i class="bi bi-calendar-check"></i>
              <span>Plannings</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/replay">
              <i class="bi bi-play-btn"></i>
              <span>Replay</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/videos">
              <i class="bi bi-film"></i>
              <span>Vidéos</span>
            </router-link>
          </li>
        </ul>
      </nav>
    </footer>
  </div>
</template>

<script>
export default {
  name: "Layout",
  data() {
    return {
      prenom: localStorage.getItem("prenom"),  // Récupère le prénom de l'utilisateur depuis localStorage
      showInstallButton: false, // Affichage du bouton
      deferredPrompt: null, // Stockage de l'événement
    };
  },
  mounted() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    this.deferredPrompt = event;
    this.showInstallButton = true; // Affiche le bouton si possible
  });
  {
  console.log("Prénom récupéré:", this.prenom);
};
},


  

  methods: {
    logout() {
  localStorage.removeItem("prenom");
  localStorage.removeItem("email");

  this.prenom = null; // Met à jour l'état local

  this.$router.push("/login");
}
,
installPWA() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("L'utilisateur a installé la PWA");
        } else {
          console.log("L'utilisateur a refusé l'installation");
        }
        this.deferredPrompt = null;
        this.showInstallButton = false;
      });
    }
  }

  },
};
</script>

<style scoped>
/* ✅ CONTAINER PRINCIPAL */
.layout-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 100vw;
}

/* ✅ HEADER AMÉLIORÉ */
.hero-banner {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100px;
  background: linear-gradient(135deg, #222 0%, #444 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  z-index: 1050;
  padding: 0 20px;
}

/* ✅ CONTENU DU HEADER */
.hero-content {
  display: flex;
  align-items: center;
  width: 65%;
  max-width: 1200px;
}

/* ✅ LOGO */
.logo {
  height: 80px;
  margin-left:20%;
  width: auto;
}

/* ✅ TEXTE DU HEADER */
.hero-text {
  flex-grow: 1;
  text-align: center;
}

.hero-title {
  font-family: "Poppins", sans-serif;
  font-size: 1.8rem;
  margin-left:%;
  width:100%;
  text-align: center;
  color: white;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 0px 2px 10px rgba(255, 255, 255, 0.2);
  margin-top:7%;
}

.hero-subtitle {
  font-size: 0.9rem;
  color: #ddd;
  margin-left: 3%;
  text-transform: uppercase;
  margin-top: 5px;
}

/* ✅ BOUTONS DU HEADER */
.auth-buttons {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 15px;
}

/* ✅ STYLE BOUTON "PRENDRE UN COURS" */
.btn-cours {
  background-color: #f1c40f;
  color: black !important;
  font-weight: bold;
  padding: 8px 15px;
  border-radius: 8px;
  text-transform: uppercase;
  font-size: 14px;
  transition: background 0.3s ease-in-out;
}

.btn-cours:hover {
  background-color: #ffdd57;
}

/* ✅ STYLE DES AUTRES BOUTONS */
.nav-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  text-decoration: none;
  font-size: 14px;
  padding: 10px;
  transition: all 0.3s ease-in-out;
}

.nav-link i {
  font-size: 1.8rem;
}

.nav-link:hover {
  color: #f1c40f;
  text-shadow: 0px 0px 10px rgba(255, 204, 0, 0.8);
}

.nav-link.logout {
  background-color: transparent;
  border: none;
  cursor: pointer;
}

.nav-link.logout:hover {
  color: #ff4d4d;
  text-shadow: 0px 0px 10px rgba(255, 77, 77, 0.8);
}

/* ✅ CONTENU PRINCIPAL */
.page-content {
  flex-grow: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-top: 100px;
  padding-bottom: 70px;
  background-color: #f8f9fa;
}

/* ✅ MENU FIXE EN BAS */
.navbar-container {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: #272727;
  padding: 10px 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1100;
}

.navbar-nav {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  align-items: center;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 0;
  list-style: none;
}

.nav-item {
  flex: 1;
  text-align: center;
}

/* ✅ BOUTON INSTALLATION PWA */
.install-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: white;
  transition: transform 0.2s ease-in-out;
  margin-left: 10px;
}

.install-btn:hover {
  transform: scale(1.2);
  color: #f1c40f;
}






@media screen and (max-width: 768px) {
  .hero-banner {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100px;
  background: linear-gradient(135deg, #222 0%, #444 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  z-index: 1050;
  padding: 0 20px;
}

  .hero-content {
    display: flex;
    align-items: center;
    width: 100%;
  }

  .logo {
    height: 80px;
    width: auto;
    margin-left: 0;
    padding: 0;
    flex-shrink: 0; /* ✅ Empêche le logo de rétrécir */
  }

  .hero-text {
    flex-grow: 1; /* ✅ Prend l’espace restant */
    text-align: center; /* ✅ Centre le texte */
    white-space: ; /* ✅ Empêche la casse */
    overflow: hidden;
    text-overflow: ellipsis;
    position: absolute;
    left: 60%;
    transform: translateX(-50%); /* ✅ Centre exactement le texte */
  }
  .hero-subtitle {
  font-size: 0.8rem;
  color: #ddd;
  margin-left: 3%;
  text-transform: uppercase;
  margin-top: 5px;
}

.btn-cours {
  font-size: 10px !important;
  display: none !important;
  }






  /* ✅ Adapter "Mon Espace" en icône */
  .auth-buttons .mon-espace {
    display: flex !important;
    align-items: center;
    justify-content: center;
    background-color: transparent;
    color: white !important;
    padding: 10px;
    border-radius: 50%;
    font-size: 14px;
    width: 40px;
    height: 40px;
  }

  /* ✅ Cacher le texte et garder uniquement l’icône */
  .auth-buttons .mon-espace span {
    display: none !important;
  }

  /* ✅ Agrandir l’icône */
  .auth-buttons .mon-espace i {
    font-size: 24px !important;
    display: none !important;
  }

  /* ✅ Correction : FORCER LE MENU BAS À RESTER VISIBLE */
  .navbar-container {
  
    text-align: center;
    align-items: center;
    bottom: 0;
    left: 0;
    width: 100%;
    background-color: #272727;
    padding: 0px 0;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    z-index: 1100;
  }

  .navbar-nav {
    display: flex !important;
    justify-content: space-around;
    align-items: center;
    width: 100%;
  }
}

</style>