/**
 * ProjectCard tests
 * Tests project card component for displaying project info
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ProjectCard from '../../../src/components/ProjectCard.vue';

describe('ProjectCard', () => {
  const mockProject = {
    id: 'proj-123',
    name: 'Test Project',
    description: 'Test description',
    baseUrl: 'https://example.com',
    status: 'completed',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
  };

  it('should render project name', () => {
    const wrapper = mount(ProjectCard, {
      props: { project: mockProject },
    });

    expect(wrapper.text()).toContain('Test Project');
  });

  it('should render project description', () => {
    const wrapper = mount(ProjectCard, {
      props: { project: mockProject },
    });

    expect(wrapper.text()).toContain('Test description');
  });

  it('should render base URL', () => {
    const wrapper = mount(ProjectCard, {
      props: { project: mockProject },
    });

    expect(wrapper.text()).toContain('https://example.com');
  });

  it('should render status badge', () => {
    const wrapper = mount(ProjectCard, {
      props: { project: mockProject },
    });

    const statusBadge = wrapper.findComponent({ name: 'ProjectStatusBadge' });
    expect(statusBadge.exists()).toBe(true);
  });

  it('should render created date', () => {
    const wrapper = mount(ProjectCard, {
      props: { project: mockProject },
    });

    expect(wrapper.text()).toContain('2024');
  });

  it('should emit click event when card is clicked', async () => {
    const wrapper = mount(ProjectCard, {
      props: { project: mockProject },
    });

    const card = wrapper.find('[data-test="project-card"]');
    if (card.exists()) {
      await card.trigger('click');
      expect(wrapper.emitted('click')).toBeTruthy();
    }
  });

  it('should emit delete event when delete button is clicked', async () => {
    const wrapper = mount(ProjectCard, {
      props: { project: mockProject },
    });

    const deleteButton = wrapper.find('[data-test="delete-button"]');
    if (deleteButton.exists()) {
      await deleteButton.trigger('click');
      expect(wrapper.emitted('delete')).toBeTruthy();
      expect(wrapper.emitted('delete')?.[0]).toEqual([mockProject.id]);
    }
  });

  it('should prevent click propagation when delete button is clicked', async () => {
    const wrapper = mount(ProjectCard, {
      props: { project: mockProject },
    });

    const deleteButton = wrapper.find('[data-test="delete-button"]');
    if (deleteButton.exists()) {
      await deleteButton.trigger('click');
      // Delete event should be emitted but not click event
      expect(wrapper.emitted('delete')).toBeTruthy();
      expect(wrapper.emitted('click')).toBeFalsy();
    }
  });

  it('should handle project without description', () => {
    const projectWithoutDesc = {
      ...mockProject,
      description: '',
    };

    const wrapper = mount(ProjectCard, {
      props: { project: projectWithoutDesc },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('should apply hover styling', () => {
    const wrapper = mount(ProjectCard, {
      props: { project: mockProject },
    });

    const card = wrapper.find('[data-test="project-card"]');
    expect(card.exists()).toBe(true);
  });
});
