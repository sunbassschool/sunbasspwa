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

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: { name: 'intro' }
    },
    {
      path: '/mon-espace',
      name: 'mon-espace',
      component: MonEspace
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
    },
    {
      path: '/replay',
      name: 'replay',
      component: Replay,
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
})

export default router
