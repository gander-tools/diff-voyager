import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: {
        title: 'nav.dashboard',
      },
    },
    // Projects
    {
      path: '/projects',
      name: 'projects',
      component: () => import('../views/ProjectListView.vue'),
      meta: {
        title: 'projects.title',
      },
    },
    {
      path: '/projects/new',
      name: 'project-create',
      component: () => import('../views/ProjectCreateView.vue'),
      meta: {
        title: 'projects.create',
      },
    },
    {
      path: '/projects/:projectId',
      name: 'project-detail',
      component: () => import('../views/ProjectDetailView.vue'),
      meta: {
        title: 'projects.detail',
      },
    },
    {
      path: '/projects/:projectId/runs',
      name: 'runs',
      component: () => import('../views/RunListView.vue'),
      meta: {
        title: 'runs.list',
      },
    },
    {
      path: '/projects/:projectId/runs/new',
      name: 'run-create',
      component: () => import('../views/RunCreateView.vue'),
      meta: {
        title: 'runs.create',
      },
    },
    // Runs
    {
      path: '/runs/:runId',
      name: 'run-detail',
      component: () => import('../views/RunDetailView.vue'),
      meta: {
        title: 'runs.detail',
      },
    },
    // Pages
    {
      path: '/pages/:pageId',
      name: 'page-detail',
      component: () => import('../views/PageDetailView.vue'),
      meta: {
        title: 'pages.detail',
      },
    },
    // Rules
    {
      path: '/rules',
      name: 'rules',
      component: () => import('../views/RulesListView.vue'),
      meta: {
        title: 'rules.title',
      },
    },
    {
      path: '/rules/new',
      name: 'rule-create',
      component: () => import('../views/RuleCreateView.vue'),
      meta: {
        title: 'rules.create',
      },
    },
    // Settings
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: {
        title: 'settings.title',
      },
    },
    // 404 Not Found
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
      meta: {
        title: 'errors.notFound',
      },
    },
  ],
});

export default router;
