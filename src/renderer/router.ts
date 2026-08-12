import { createWebHashHistory, createRouter } from 'vue-router'

const history = createWebHashHistory()
const router = createRouter({
  linkActiveClass: 'active',
  history,
  routes: [
    {
      path: '/',
      component: () => import('./views/Main.vue')
    },
    {
      path: '/settings',
      component: () => import('./views/Settings.vue')
    },
    {
      path: '/comparison',
      component: () => import('./views/Comparison.vue')
    }
  ]
})

export default router
