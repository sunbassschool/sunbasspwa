<template>
    <Layout>
      <div class="fullwidth-container mt-0">
        
  
        <!-- Loader pendant le chargement du formulaire -->
        <div v-if="loading" class="d-flex flex-column align-items-center mt-4">
          <div class="spinner-border text-primary mb-2" role="status"></div>
          <p class="text-muted">Chargement du formulaire...</p>
        </div>
  
        <!-- Google Form intégré -->
        <div class="iframe-container">
  <iframe
    v-show="!loading"
    ref="formIframe"
    class="google-form shadow-sm"
    :src="formUrl"
    frameborder="0"
    loading="lazy"
    @load="loading = false"
  ></iframe>
</div>

      </div>
    </Layout>
  </template>
  
  <script>
  import Layout from "../views/Layout.vue";
  import { ref, onMounted } from "vue";
  
  export default {
    name: "CreatePlanning",
    components: { Layout },
    setup() {
      const formUrl = ref(
        "https://docs.google.com/forms/d/e/1FAIpQLSdV4Qb0MAOGJK69e3_sYJn5815fMGJUBY-2vlPrUqImhvPmQQ/viewform?embedded=true"
      );
      const loading = ref(true);
  
      // Affiche un loader avant d'afficher le formulaire
      onMounted(() => {
        setTimeout(() => {
          loading.value = false;
        }, 3000);
      });
  
      return { formUrl, loading };
    },
  };
  </script>
  
  <style scoped>
  .fullwidth-container {
  width: 100vw; /* Pleine largeur de l'écran */
  max-width: 100%;
  margin: 0;
  padding: 20px;
  display: flex;
  justify-content: center; /* Centre le formulaire */
}

.iframe-container {
  width: 100%; /* Pleine largeur */
  max-width: 1400px; /* Limite la largeur pour éviter les débordements */
  display: flex;
  justify-content: center;
  align-items: center;
}

.google-form {
  width: 100%;
  height: 90vh; /* Ajuste la hauteur pour éviter un scroll externe */
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

  </style>
  