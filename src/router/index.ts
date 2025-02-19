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
import RegisterCursus from "../views/RegisterCursus.vue"
import CreatePlanning from "@/views/CreatePlanning.vue";
import { refreshToken } from '@/utils/api'

const baseUrl = import.meta.env.MODE === "production" ? "/app/" : "/";

const router = createRouter({
  history: createWebHistory(baseUrl),
  routes: [
    {
      path: '/',
      redirect: { name: 'intro' }
    },
    {
      path: "/register-cursus",
      name: "RegisterCursus",
      component: RegisterCursus,
    },
    {
      path: "/create-planning",
      name: "CreatePlanning",
      component: () => import("@/views/CreatePlanning.vue"),
    },
    
    {
      path: '/mon-espace',
      name: 'mon-espace',
      component: MonEspace,
      meta: { requiresAuth: true }
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
      meta: { requiresAuth: true }
    },
    {
      path: '/replay',
      name: 'replay',
      component: Replay,
      meta: { requiresAuth: true }
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
      meta: { requiresAuth: true }
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
router.beforeEach(async (to, from, next) => {
  let jwt = localStorage.getItem("jwt") || sessionStorage.getItem("jwt");
  let refreshjwt = localStorage.getItem("refreshjwt");

  console.log("🔍 Vérification de l'authentification...");
  console.log("📦 JWT actuel:", jwt);
  console.log("📦 RefreshToken disponible:", refreshjwt);

  // 🔒 Vérification des routes nécessitant une authentification
  if (to.meta.requiresAuth) {
    if (!jwt) {
      if (refreshjwt) {
        console.warn("⚠️ Aucun JWT trouvé, tentative de rafraîchissement...");
        jwt = await refreshToken();

        if (!jwt) { // 🔥 Si le refresh échoue, on force la déconnexion
          console.error("🚨 Rafraîchissement échoué, suppression des tokens et redirection vers /login !");
          localStorage.removeItem("jwt");
          localStorage.removeItem("refreshjwt");
          sessionStorage.removeItem("jwt");
          return next('/login');
        }
      } else {
        console.error("🚨 Aucun JWT et aucun refresh token, redirection vers /login !");
        return next('/login');
      }
    }
  }

  console.log("✅ Accès autorisé !");
  return next();
});

export default router;
