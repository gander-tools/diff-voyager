import { describe, expect, it } from 'vitest';
import router from '@/router';

describe('Router', () => {
  it('should have dashboard route as root', () => {
    const route = router.getRoutes().find((r) => r.path === '/');
    expect(route).toBeDefined();
    expect(route?.name).toBe('dashboard');
    expect(route?.meta?.title).toBe('nav.dashboard');
  });

  it('should have projects routes', () => {
    const routes = router.getRoutes();

    const projectsList = routes.find((r) => r.path === '/projects');
    expect(projectsList).toBeDefined();
    expect(projectsList?.name).toBe('projects');

    const projectCreate = routes.find((r) => r.path === '/projects/new');
    expect(projectCreate).toBeDefined();
    expect(projectCreate?.name).toBe('project-create');

    const projectDetail = routes.find((r) => r.path === '/projects/:projectId');
    expect(projectDetail).toBeDefined();
    expect(projectDetail?.name).toBe('project-detail');
  });

  it('should have runs routes', () => {
    const routes = router.getRoutes();

    const runsList = routes.find((r) => r.path === '/projects/:projectId/runs');
    expect(runsList).toBeDefined();
    expect(runsList?.name).toBe('runs');

    const runCreate = routes.find((r) => r.path === '/projects/:projectId/runs/new');
    expect(runCreate).toBeDefined();
    expect(runCreate?.name).toBe('run-create');

    const runDetail = routes.find((r) => r.path === '/runs/:runId');
    expect(runDetail).toBeDefined();
    expect(runDetail?.name).toBe('run-detail');
  });

  it('should have pages route', () => {
    const route = router.getRoutes().find((r) => r.path === '/pages/:pageId');
    expect(route).toBeDefined();
    expect(route?.name).toBe('page-detail');
  });

  it('should have rules routes', () => {
    const routes = router.getRoutes();

    const rulesList = routes.find((r) => r.path === '/rules');
    expect(rulesList).toBeDefined();
    expect(rulesList?.name).toBe('rules');

    const ruleCreate = routes.find((r) => r.path === '/rules/new');
    expect(ruleCreate).toBeDefined();
    expect(ruleCreate?.name).toBe('rule-create');
  });

  it('should have settings route', () => {
    const route = router.getRoutes().find((r) => r.path === '/settings');
    expect(route).toBeDefined();
    expect(route?.name).toBe('settings');
  });

  it('should have 404 not found route', () => {
    const route = router.getRoutes().find((r) => r.path === '/:pathMatch(.*)*');
    expect(route).toBeDefined();
    expect(route?.name).toBe('not-found');
  });

  it('should have 12 routes defined', () => {
    const routes = router.getRoutes();
    expect(routes).toHaveLength(12);
  });

  it('should have route names for all routes', () => {
    const routes = router.getRoutes();

    for (const route of routes) {
      expect(route.name).toBeDefined();
    }
  });

  it('should have meta title for all routes', () => {
    const routes = router.getRoutes();

    for (const route of routes) {
      expect(route.meta?.title).toBeDefined();
    }
  });
});
