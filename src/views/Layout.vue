<template>
  <div class="layout-container">
    <!-- ✅ Bandeau principal -->
    <header class="hero-banner">
      <div class="hero-content">
        <!-- ✅ Logo pour Desktop -->
        <img v-if="!isMobile" src="https://www.sunbassschool.com/wp-content/uploads/2025/02/logo-SBS-petit-noir-rond-ok.png" alt="Logo SunBassSchool" class="logo" />

        <!-- ✅ Logo Responsive si l'utilisateur n'est pas connecté -->
        <img v-if="showResponsiveLogo" src="https://www.sunbassschool.com/wp-content/uploads/2025/02/logo-SBS-petit-noir-rond-ok.png" alt="Logo SunBassSchool" class="logo responsive-logo" />

        <!-- ✅ Menu Hamburger en Responsive -->
        <button class="menu-btn" v-if="isMobile&isLoggedIn" @click="toggleMenu">
          <i class="bi bi-list"></i>
        </button>

        <!-- ✅ Bouton Installer PWA -->
        <button v-if="showInstallButton" @click="installPWA" class="install-btn" title="Installer SunBassAPP">
          📥
        </button>

        <!-- ✅ Section centrale -->
        <div class="hero-text">
          <h1 class="hero-title">SunBassAPP</h1>
          <p class="hero-subtitle">L'école de basse en ligne qui groove !</p>
        </div>

        <!-- ✅ Boutons uniquement si connecté -->
        <div v-if="isLoggedIn" class="auth-buttons">
          <router-link to="/prendreuncours" class="nav-link btn-cours">
            <i class="bi bi-play-circle"></i>
            <span>Prendre un cours</span>
          </router-link>

          <router-link to="/mon-espace" class="nav-link mon-espace">
            <i class="bi bi-person-circle"></i>
            <span>Mon Espace</span>
          </router-link>

         

        </div>
      </div>
    </header>

    <!-- ✅ Menu latéral -->
    <div v-if="showMenu" class="menu-overlay" @click="toggleMenu"></div>
    <div class="mobile-menu" :class="{ 'active': showMenu }">
      <router-link to="/mon-espace" class="nav-link mon-espace" v-if="isLoggedIn">
        <i class="bi bi-person-circle"></i>
        <span>Mon Espace</span>
      </router-link>
      <router-link to="/register-cursus" class="nav-link mon-espace">
        <i class="bi bi-person-plus"></i>
       S'inscrire à un <br />cursus
</router-link>
<router-link to="/create-planning" class="nav-link mon-espace">
  <i class="bi bi-calendar-plus"></i> Créer un Planning
</router-link>

      <button v-if="isLoggedIn" @click="logout" class="nav-link logout">
        <i class="bi bi-box-arrow-right"></i> 
        <span>Déconnexion</span>
      </button>
    </div>

    <!-- ✅ Contenu principal -->
    <main class="page-content" :class="{ 'fullwidth': isFullScreenPage }">
      
    <div v-if="isRefreshing" class="loading">
      🔄 Rafraîchissement en cours...
    </div>
      <slot></slot>
    </main>

    <!-- ✅ Menu de navigation en bas -->
    <footer class="navbar-container">
      <nav class="navbar">
        <ul class="navbar-nav">
          <li class="nav-item">
            <router-link class="nav-link" to="/dashboard">
              <i class="bi bi-house-door"></i>
              <span>Home</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/partitions">
              <i class="bi bi-music-note-beamed"></i>
              <span>Partitions</span>
            </router-link>
          </li>
          <router-link v-if="!isLoggedIn" to="/registerform" class="nav-link btn-register">
  <i class="bi bi-person-plus"></i>
  <span>S'inscrire</span>
</router-link>

          <!-- ✅ Planning et Replay uniquement si connecté -->
          <li v-if="isLoggedIn" class="nav-item">
            <router-link class="nav-link" to="/planning">
              <i class="bi bi-calendar-check"></i>
              <span>Plannings</span>
            </router-link>
          </li>
          <li v-if="isLoggedIn" class="nav-item">
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
import { jwtDecode } from "jwt-decode";
import { nextTick } from "vue";

export default {
  name: "Layout",
  data() {
    return {
      jwt: sessionStorage.getItem("jwt") || localStorage.getItem("jwt") || "",
      refreshjwt: localStorage.getItem("refreshjwt") || "",
      showMenu: false,
      isRefreshing: false, // ✅ Ajout de la variable
      isMobile: window.innerWidth < 768,
      isLoading: false,
      showInstallButton: false,
      deferredPrompt: null,
      tokenCheckInterval: null, // 🔄 Vérification de l'expiration du JWT
      apiBaseURL:
        "https://cors-proxy-37yu.onrender.com/https://script.google.com/macros/s/AKfycbyaXWbAryyHp1t7HmdCHN7EuQwVlwol5u3WTtULrtN6yY9JFxjikiExxvQrakD56QRHyw/exec",
      fullScreenPages: ["/register-cursus"], // ✅ Tableau statique ici
    };
  },
  computed: {
    isLoggedIn() {
      return !!this.jwt;
    },
    prenom() {
      return sessionStorage.getItem("prenom") || "";
    },
    isPremium() {
      return sessionStorage.getItem("abo") === "premium";
    },
    isAdmin() {
      return sessionStorage.getItem("role") === "admin";
    },
    isEleve() {
      return sessionStorage.getItem("role") === "eleve";
    },
    showResponsiveLogo() {
      return !this.isLoggedIn && this.isMobile;
    },
    isFullScreenPage() {
      return !this.isMobile && this.fullScreenPages.includes(this.$route.path);
    },
  },
  mounted() {
    console.log("✅ Vérification de la session existante...");
    window.refreshToken = this.refreshToken;
    setTimeout(() => {
        this.checkExistingSession();
    }, 500);

    this.tokenCheckInterval = setInterval(this.checkTokenExpiration, 60000);

    window.refreshToken = this.refreshToken; // 🔥 Ajout temporaire pour test dans la console

    window.addEventListener("resize", this.checkMobile);
    window.addEventListener("beforeinstallprompt", (event) => {
        event.preventDefault();
        this.deferredPrompt = event;
        this.showInstallButton = true;
    });
}
,
  beforeUnmount() {
    clearInterval(this.tokenCheckInterval);
    window.removeEventListener("resize", this.checkMobile);
  },
  methods: {
    refresh() {
    console.log("🔄 Rafraîchissement manuel de l'interface...");
    this.$forceUpdate(); // Force un re-render de Vue
  },
    toggleMenu() {
      this.showMenu = !this.showMenu;

      nextTick(() => {
        console.log("Menu ouvert :", this.showMenu);
        const menu = document.querySelector(".mobile-menu");
        if (menu) {
          menu.classList.toggle("active", this.showMenu);
        }
      });
    },
    checkMobile() {
      this.isMobile = window.innerWidth < 768;
    },
    checkExistingSession() {
  let jwt = sessionStorage.getItem("jwt");

  if (!jwt) {
    console.warn("⚠️ Aucun JWT trouvé. L'utilisateur doit se reconnecter.");
    return;
  }

  try {
    const decoded = jwtDecode(jwt);

    if (decoded.exp * 1000 < Date.now()) {
      console.warn("⏳ JWT expiré. Tentative de rafraîchissement...");
      this.refreshToken();
      return;
    }

    console.log("✅ JWT valide, restauration de la session...");
    this.jwt = jwt;
    this.decodeJWT(jwt);

  } catch (error) {
    console.error("🚨 Erreur lors du décodage du JWT :", error);
    console.warn("❌ JWT invalide ou corrompu, mais pas de déconnexion forcée immédiate.");

    // 🔥 Option : Plutôt qu'un logout immédiat, on peut supprimer uniquement le JWT et forcer une reconnexion
    sessionStorage.removeItem("jwt");
    localStorage.removeItem("jwt");
    this.jwt = "";

    // Possibilité de rediriger vers la page de login sans déconnecter totalement
    this.$router.push("/login");
  }
}

,
    storeSession(data) {
      sessionStorage.setItem("jwt", data.jwt);
      localStorage.setItem("jwt", data.jwt);
      localStorage.setItem("refreshjwt", data.refreshToken);
      this.jwt = data.jwt;
      this.refreshjwt = data.refreshToken;
      this.decodeJWT(data.jwt);
    },
    decodeJWT(jwt) {
      try {
        const decoded = jwtDecode(jwt);
        console.log("🎫 JWT décodé :", decoded);
        sessionStorage.setItem("prenom", decoded.prenom || "");
        sessionStorage.setItem("email", decoded.email || "");
      } catch (error) {
        console.error("🚨 Erreur lors du décodage du JWT :", error);
      }
    },
    checkTokenExpiration() {
      if (!this.jwt) return;

      try {
        const decoded = jwtDecode(this.jwt);
        const expTime = decoded.exp * 1000;
        const currentTime = Date.now();
        const timeLeft = expTime - currentTime;

        if (timeLeft < 5 * 60 * 1000) {
          console.log("🕒 JWT proche de l'expiration, rafraîchissement en cours...");
          this.refreshToken();
        } else {
          console.log(`🕒 JWT valide encore pour ${Math.floor(timeLeft / 1000)} secondes`);
        }
      } catch (error) {
        console.error("❌ Erreur lors de la vérification du JWT :", error);
        this.logout();
      }
    },
    async refreshToken() {
    if (!this.refreshjwt) {
        console.log("❌ Aucun refresh token disponible.");
        this.logout();
        return;
    }

    try {
        console.log("🔄 📡 Envoi de la requête de rafraîchissement du JWT...");
        
        // ✅ Passer le refreshToken directement en paramètre GET
        const url = `${this.apiBaseURL}?route=refresh&refreshToken=${encodeURIComponent(this.refreshjwt)}`;

        const response = await fetch(url, {
            method: "GET",  // ✅ L'API actuelle utilise GET
            headers: {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest"
            }
        });

        const data = await response.json();
        console.log("🔍 Réponse du serveur :", data);

        if (data.status === "success" && data.data.jwt) {
            console.log("✅ JWT rafraîchi !");
            this.storeSession(data.data);
        } else {
            console.error("🚨 Impossible de rafraîchir le JWT :", data.message);
            this.logout();
        }
    } catch (error) {
        console.error("🚨 Erreur lors du rafraîchissement du JWT :", error);
        this.logout();
    }
}

,
    logout() {
      console.log("🚪 Déconnexion en cours...");

      sessionStorage.clear();
      localStorage.removeItem("jwt");
      

      this.jwt = "";
      this.refreshjwt = "";
      console.log("🔀 Redirection vers /login...");
      this.$router.push("/login");

      setTimeout(() => {
        window.location.reload();
      }, 500);
    },
    installPWA() {
      if (this.deferredPrompt) {
        this.deferredPrompt.prompt();
        this.deferredPrompt.userChoice.then(() => {
          this.deferredPrompt = null;
          this.showInstallButton = false;
        });
      }
    },
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
.fullwidth {
  max-width: 100vw;
  width: 100%;
  padding: 0;
  margin: 0;
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
  padding-top: 100px;
  padding-bottom: 70px;
  background-color: #f8f9fa;
  max-width: 100vw;
  width: 100%;
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

.loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 15px 20px;
  border-radius: 5px;
  font-size: 18px;
  font-weight: bold;
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

/* ✅ MENU RESPONSIVE */
/* ✅ Overlay semi-transparent quand le menu est ouvert */
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
}

/* ✅ Menu latéral qui arrive depuis la gauche */
.mobile-menu {
  position: fixed;
  top: 75px; /* Juste sous le header */
  left: -40%; /* Caché en dehors de l'écran */
  width: 38%;
  height: calc(100% - 75px);
  background: #000000;
  display: flex;
  opacity: 88%;
  text-align: center;
  flex-direction: column;
  padding: 15px;
  box-shadow: 4px 0px 10px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease-in-out; /* ✅ Animation fluide */
  z-index: 999;
}
.mobile-menu a:not(:last-child),
.mobile-menu .nav-link:not(:last-child) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.3); /* Ligne séparatrice */
  padding-bottom: 8px; /* Espacement */
  margin-bottom: 8px;
}

/* ✅ Quand le menu est actif, il glisse à gauche */
.mobile-menu.active {
  text-align: center;
  transform: translateX(100%); /* ✅ Slide depuis la gauche */
}


/* ✅ Style des liens dans le menu */
.mobile-menu .nav-link {
  display: flex;
  align-items: center;  /* ✅ Alignement vertical */
  gap: 10px;  /* ✅ Espace entre l'icône et le texte */
  padding: 12px 15px;
  color: white;
  font-size: 16px;
  text-decoration: none;
  transition: all 0.3s ease-in-out;
  white-space: nowrap; /* ✅ Empêche le retour à la ligne */
}

.mobile-menu .nav-link i {
  font-size: 20px; /* ✅ Taille des icônes */
  margin-right: 0px; /* ✅ Ajout d'espace entre l'icône et le texte */
}

.mobile-menu .nav-link:hover {
  background: #f1c40f;
  color: black;
}

.fullscreen {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.fullscreen .page-content {
  flex-grow: 1;
  height: 100%;
  width: 100%;
  padding: 0;
  margin: 0;
}

.fullscreen header,
.fullscreen footer {
  display: none;
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
    margin-left:0%;
  }


/* ✅ Bouton du menu hamburger */
.menu-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: white;
  margin-right: 15px;
}

.menu-btn:hover {
  color: #f1c40f;
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