import { createRouter, createWebHistory } from 'vue-router';
import { getAuth } from 'firebase/auth';

// Importar componentes
import Main from '../pages/Main.vue';
import Home from '../pages/Home.vue';
import Login from '../pages/Login.vue';
import Register from '../pages/Register.vue';

const routes = [
  { path: '/', name: 'main', component: Main },
  { path: '/login', name: 'login', component: Login },
  { path: '/register', name: 'register', component: Register },
  { path: '/inicio', name: 'inicio', component: Home, meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*', redirect: '/login' }, //Redirigir a /login si la ruta no existe
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const auth = getAuth();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const user = auth.currentUser; 

  if (requiresAuth && !user) {
    console.log("Acceso denegado. Redirigiendo a /login");
    next('/login');
  } else {
    next();
  }
});

export default router;
