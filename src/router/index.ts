import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import IntroView from '@/views/IntroView.vue'
import Dashboard from '@/views/Dashboard.vue'
import Partitions from '@/views/Partitions.vue'
import Planning from '@/views/Planning.vue'
import Replay from '@/views/Replay.vue'
import Videos from '@/views/Videos.vue'
import Register from '@/views/Register.vue'
import Login from '@/views/Login.vue'
import MonEspace from '@/views/MonEspace.vue'
import RegisterForm from '@/views/RegisterForm.vue'
import Prendreuncours from '@/views/Prendreuncours.vue'

const baseUrl = import.meta.env.MODE === "production" ? "/app/" : "/";

const router = createRouter({
  history: createWebHistory(baseUrl),
  routes: [
    {
      path: '/',
      redirect: { name: 'intro' }
    },
    {
      path: '/mon-espace',
      name: 'mon-espace',
      component: MonEspace,
      meta: { requiresAuth: true } // 🔥 Protection activée ici
    },
    {
      path: '/intro',
      name: 'intro',
      component: IntroView,
    },
    {
      path: '/home',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/partitions',
      name: 'partitions',
      component: Partitions,
    },
    {
      path: '/register',
      name: 'register',
      component: Register,
    },
    {
      path: '/registerform',
      name: 'registerform',
      component: RegisterForm,
    },
    {
      path: '/planning',
      name: 'planning',
      component: Planning,
      meta: { requiresAuth: true } // 🔥 Protection activée ici
    },
    {
      path: '/replay',
      name: 'replay',
      component: Replay,
      meta: { requiresAuth: true } // 🔥 Protection activée ici
    },
    {
      path: '/videos',
      name: 'videos',
      component: Videos,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: Dashboard,
      meta: { requiresAuth: true } // 🔥 Protection activée ici
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/prendreuncours',
      name: 'prendreuncours',
      component: Prendreuncours,
    },
  ],
});

// **🚀 Middleware global pour protéger les routes nécessitant l'authentification**
router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem("token"); // Vérifie si un token existe

  if (to.meta.requiresAuth && !isAuthenticated) {
    console.warn("🚨 Accès refusé, redirection vers /login !");
    next('/login'); // 🔥 Redirection vers login
  } else {
    next(); // ✅ Accès autorisé
  }
});

export default router;
