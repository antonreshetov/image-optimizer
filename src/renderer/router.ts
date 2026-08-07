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
      meta: { title: 'Test page' },
      component: () => import('./views/Settings.vue')
    }
  ]
})

export default router
