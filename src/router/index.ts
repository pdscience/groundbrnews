import { createRouter, createWebHistory } from 'vue-router'
import { STORIES_BY_SLUG } from '@/data'
import AnalysesView from '../views/AnalysesView.vue'

/**
 * Impede que uma história inexistente seja renderizada: o slug é resolvido
 * antes da montagem da view, que cairia no estado "não encontrada".
 */
export function storyGuard(to: { params: Record<string, unknown> }): true | { name: string } {
  const slug = String(to.params.slug ?? '')
  if (!STORIES_BY_SLUG.has(slug)) return { name: 'analyses' }
  return true
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: AnalysesView,
    },
    {
      path: '/analises',
      name: 'analyses',
      component: AnalysesView,
    },
    {
      path: '/analises/:slug',
      name: 'story',
      component: () => import('../views/StoryAnalysisView.vue'),
      beforeEnter: storyGuard,
    },
    {
      path: '/metodologia',
      name: 'methodology',
      component: () => import('../views/MethodologyView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
})

export default router
