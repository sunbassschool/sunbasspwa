<template>
    <div>
      <h1>Bienvenue, {{ prenom }}</h1>
  
      <div v-if="abo === 'premium'">
        🎉 Bienvenue dans la section Premium !
      </div>
      
      <div v-else>
        ❌ Vous devez être premium pour accéder à ce contenu.
        <router-link to="/upgrade">Mettre à niveau</router-link>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        prenom: "",
        abo: "gratuit" // 🔥 Stocké en mémoire et pas en localStorage
      };
    },
    async mounted() {
      await this.fetchUserInfo(); // ✅ Récupère les infos réelles depuis le serveur
    },
    methods: {
      async fetchUserInfo() {
        try {
          const apiUrl = "https://script.google.com/macros/s/AKfycbze7GQsS-5ptUUTwAcjry5mLOzKVDbaEJ_fkr0jBVM45ab9UafMtcTUtwkEKp0HHVh5mg/exec";
          const url = `${apiUrl}?route=getUser&jwt=${localStorage.getItem("jwt")}`;
          const response = await fetch(url);
          const userInfo = await response.json();
          
          if (userInfo.status === "success") {
            this.prenom = userInfo.data.prenom;
            this.abo = userInfo.data.abo;
          }
        } catch (error) {
          console.error("❌ Erreur lors de la récupération des infos :", error);
        }
      }
    }
  };
  </script>
  