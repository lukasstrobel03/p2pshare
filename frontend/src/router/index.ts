import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/network'
    },
    {
      path: '/network',
      name: 'Network',
      component: () => import('@/views/NetworkView.vue')
    },
    {
      path: '/transfers',
      name: 'Transfers',
      component: () => import('@/views/TransferView.vue')
    },
    {
      path: '/files',
      name: 'Files',
      component: () => import('@/views/MyFilesView.vue')
    }
  ],
})

export default router
