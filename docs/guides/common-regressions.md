# Common Regression Points

**Last Updated**: 2026-01-14

This document identifies areas of the codebase that are prone to regressions and provides guidelines to prevent breaking them in future iterations.

## Purpose

Development iterations can inadvertently break previously working features. This guide documents:
1. Features that have experienced regressions
2. Root causes of those regressions
3. Preventive measures and testing strategies
4. Code patterns to avoid

## Table of Contents

1. [Project Creation Workflow](#project-creation-workflow)
2. [UI Component Behavior](#ui-component-behavior)
3. [Delete Confirmation Dialogs](#delete-confirmation-dialogs)
4. [Navigation and Breadcrumbs](#navigation-and-breadcrumbs)
5. [Database Constraints](#database-constraints)

---

## Project Creation Workflow

**Regression History**: Issue #305, #316

### Problem Pattern

The project creation flow was incorrectly attempting to trigger scanning immediately during project creation, violating the separation between project setup (synchronous) and scan execution (asynchronous).

### Correct Implementation

**Project Creation (Synchronous)**:
1. User fills out project creation wizard (multi-step form)
2. Click "Create" button → Save project to database only
3. Navigate to project detail view automatically
4. Display project details/summary (configuration, settings)

**Scan Execution (Asynchronous)**:
5. User reviews project configuration in detail view
6. User manually clicks "Start Scanning" button
7. Scanning request sent to background queue (non-blocking)
8. User can monitor progress, interrupt, and resume scans

### Why This Matters

- **Separation of concerns**: Creation (fast, synchronous) vs. execution (slow, asynchronous)
- **User control**: Users can review configuration before expensive operations
- **Error handling**: Creation errors separate from scan errors
- **UX**: UI remains responsive during long-running scans

### Prevention Strategy

- ✅ **Check PRD Section 4.1**: Workflow explicitly separates creation and execution
- ✅ **Integration tests**: Test project creation without triggering scans
- ✅ **Code review**: Verify `createProject` handlers don't call scan services
- ⚠️ **Common mistake**: Automatically triggering scans in `ProjectCreateView.vue` submit handler

### Test Coverage

```typescript
// ✅ Correct: Create project without scanning
it('should create project without starting scan', async () => {
  const project = await projectsStore.createProject(formData);
  expect(project.id).toBeDefined();
  expect(scanService.createScan).not.toHaveBeenCalled();
});

// ✅ Verify navigation to detail view
it('should navigate to project detail after creation', async () => {
  await handleSubmit(formData);
  expect(router.push).toHaveBeenCalledWith({
    name: 'project-detail',
    params: { projectId: expect.any(String) },
  });
});
```

---

## UI Component Behavior

**Regression History**: Issue #304 (Project creation wizard stepper)

### Problem Pattern

The stepper navigation highlighting was broken due to 0-based vs 1-based indexing mismatch between component state and Naive UI's `NSteps` component expectations.

### Root Cause

- **Component state**: Using 0-based indexing (`currentStep = 0, 1, 2`)
- **Naive UI NSteps**: Expects 1-based indexing for `:current` prop (`1, 2, 3`)
- **Result**: Step indicators highlighted incorrect steps

### Correct Implementation

```vue
<template>
  <!-- ✅ Convert 0-based to 1-based for NSteps -->
  <NSteps :current="currentStep + 1" class="steps">
    <NStep :title="t('projects.form.stepBasicInfo')" />
    <NStep :title="t('projects.form.stepCrawlSettings')" />
    <NStep :title="t('projects.form.stepRunProfile')" />
  </NSteps>
</template>

<script setup lang="ts">
// Internal state uses 0-based indexing
const currentStep = ref(0);

const handleNext = () => {
  if (currentStep.value < 2) {
    currentStep.value++; // 0 → 1 → 2
  }
};
</script>
```

### Prevention Strategy

- ✅ **Read Naive UI docs**: Check component API expectations (1-based vs 0-based)
- ✅ **Visual testing**: Manually verify stepper highlights correct step during development
- ✅ **Screenshot tests**: Capture stepper states in different steps
- ⚠️ **Common mistake**: Assuming all components use same indexing convention

### UI Library Component Checklist

When using Naive UI components:
- [ ] Check if component uses 0-based or 1-based indexing
- [ ] Read official documentation for `:current`, `:active`, `:selected` props
- [ ] Test visual feedback in all states (initial, middle, final)
- [ ] Verify state synchronization between component logic and UI display

---

## Delete Confirmation Dialogs

**Regression History**: Issue #315 (Project delete confirmation missing)

### Problem Pattern

Delete operations executing immediately without confirmation dialogs, creating risk of accidental data loss.

### Correct Implementation

**All destructive operations must show confirmation dialogs**:

```vue
<script setup lang="ts">
import { useDialog } from 'naive-ui';

const dialog = useDialog();

const handleDelete = (projectId: string) => {
  dialog.warning({
    title: t('projects.deleteConfirm.title'),
    content: t('projects.deleteConfirm.message'),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      await projectsStore.deleteProject(projectId);
      // Success feedback
    },
  });
};
</script>
```

### Required Confirmation Scenarios

- ✅ Project deletion
- ✅ Run deletion
- ✅ Baseline deletion
- ✅ Bulk delete operations
- ✅ Irreversible rule changes

### Prevention Strategy

- ✅ **Code review checklist**: Every delete handler must include confirmation
- ✅ **E2E tests**: Verify confirmation dialogs appear before deletion
- ✅ **User feedback**: Test with actual users to ensure dialogs are clear
- ⚠️ **Common mistake**: Removing dialog code during refactoring

### Test Coverage

```typescript
it('should show confirmation dialog before deleting project', async () => {
  const dialogSpy = vi.spyOn(dialog, 'warning');

  await wrapper.find('[data-test="delete-btn"]').trigger('click');

  expect(dialogSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      title: expect.stringContaining('delete'),
      onPositiveClick: expect.any(Function),
    })
  );
});

it('should not delete project if user cancels', async () => {
  // Simulate clicking "Cancel" in dialog
  dialog.warning.mockImplementation(({ onNegativeClick }) => {
    onNegativeClick?.();
  });

  await handleDelete(projectId);

  expect(projectsStore.deleteProject).not.toHaveBeenCalled();
});
```

---

## Navigation and Breadcrumbs

**Regression History**: Issue #314 (Breadcrumb concatenation without separators)

### Problem Pattern

Breadcrumb navigation displaying concatenated text like `DashboardProjectsb18a0cf7-aadf-4794-aa9a-dbf3b262e761` instead of properly formatted navigation with separators.

### Root Cause

Naive UI's `NBreadcrumb` component requires explicit separator configuration or proper theming to display separators between breadcrumb items.

### Correct Implementation

```vue
<template>
  <!-- Option 1: Use separator prop -->
  <NBreadcrumb separator=">" class="app-breadcrumb">
    <NBreadcrumbItem
      v-for="(item, index) in breadcrumbs"
      :key="item.path || index"
      :clickable="!!item.path && item.path !== route.path"
      @click="handleClick(item.path)"
    >
      {{ item.title }}
    </NBreadcrumbItem>
  </NBreadcrumb>

  <!-- Option 2: Use custom separator slot -->
  <NBreadcrumb class="app-breadcrumb">
    <template #separator>
      <span class="breadcrumb-separator">›</span>
    </template>
    <NBreadcrumbItem v-for="..." />
  </NBreadcrumb>
</template>

<style scoped>
.breadcrumb-separator {
  margin: 0 8px;
  color: #999;
}
</style>
```

### Prevention Strategy

- ✅ **Check Naive UI theme**: Verify breadcrumb separator styles are included
- ✅ **Visual inspection**: Test breadcrumbs in all views during development
- ✅ **Screenshot tests**: Capture breadcrumb rendering in documentation
- ⚠️ **Common mistake**: Assuming separators render automatically

---

## Database Constraints

**Regression History**: Issue #316 (UNIQUE constraint violation on snapshots table)

### Problem Pattern

Scan creation failing with `UNIQUE constraint failed: snapshots.page_id, run_id` after ~104 seconds of execution.

### Root Cause Investigation

**Possible causes**:
1. Crawler visiting same URL multiple times during single scan
2. Different URLs resolving to same page entity (normalization issue)
3. Race condition with multiple workers processing same page concurrently
4. Missing duplicate detection before snapshot insertion

### Database Schema

```sql
-- UNIQUE constraint enforces one snapshot per page per run
CREATE UNIQUE INDEX snapshots_page_run_unique ON snapshots(page_id, run_id);
```

This constraint is **correct** and should not be removed. The fix must be in application logic.

### Correct Implementation

**Option 1: Use UPSERT logic** (recommended)

```typescript
// ✅ Correct: Use INSERT OR REPLACE for idempotent operations
async createOrUpdateSnapshot(snapshot: PageSnapshot) {
  return await db
    .insert(snapshots)
    .values(snapshot)
    .onConflictDoUpdate({
      target: [snapshots.pageId, snapshots.runId],
      set: {
        htmlContent: snapshot.htmlContent,
        screenshotPath: snapshot.screenshotPath,
        updatedAt: new Date(),
      },
    });
}
```

**Option 2: Check before insert**

```typescript
// ✅ Alternative: Check existence before inserting
async createSnapshot(snapshot: PageSnapshot) {
  const existing = await this.findByPageAndRun(
    snapshot.pageId,
    snapshot.runId
  );

  if (existing) {
    return await this.updateSnapshot(snapshot);
  }

  return await db.insert(snapshots).values(snapshot);
}
```

**Option 3: Crawler deduplication**

```typescript
// ✅ Prevent crawler from visiting same page twice
const visitedUrls = new Set<string>();

crawler.on('beforeRequest', ({ request }) => {
  const normalizedUrl = normalizeUrl(request.url);

  if (visitedUrls.has(normalizedUrl)) {
    request.skipNavigation = true;
    return;
  }

  visitedUrls.add(normalizedUrl);
});
```

### Prevention Strategy

- ✅ **Use transactions**: Ensure atomic page + snapshot creation
- ✅ **Implement UPSERT**: Handle duplicate inserts gracefully
- ✅ **Crawler deduplication**: Track visited URLs in memory
- ✅ **Integration tests**: Test scan with duplicate/redirecting URLs
- ⚠️ **Don't remove constraints**: Fix application logic, not database schema

### Test Coverage

```typescript
it('should handle duplicate page insertions gracefully', async () => {
  const snapshot = createTestSnapshot();

  // First insert
  await snapshotRepo.createSnapshot(snapshot);

  // Duplicate insert should not throw
  await expect(
    snapshotRepo.createSnapshot(snapshot)
  ).resolves.not.toThrow();
});

it('should deduplicate URLs during crawling', async () => {
  const urls = [
    'https://example.com/page',
    'https://example.com/page/', // Duplicate with trailing slash
    'https://example.com/page?utm=123', // Duplicate with ignored param
  ];

  const result = await crawlService.scan(projectId, urls);

  expect(result.pagesProcessed).toBe(1);
});
```

---

## General Prevention Strategies

### 1. Documentation Synchronization

- Update PRD.md when implementation differs from original design
- Keep CLAUDE.md aligned with current workflows
- Document UI component behaviors in frontend-dev.md
- Cross-reference issues in documentation updates

### 2. Testing Coverage

**Critical test areas**:
- Confirmation dialogs for all destructive operations
- UI component state synchronization (steppers, breadcrumbs, forms)
- Workflow separation (creation vs execution)
- Database constraint handling (UPSERT, transactions)

### 3. Code Review Checklist

- [ ] Does delete operation have confirmation dialog?
- [ ] Does UI component indexing match library expectations?
- [ ] Is project creation separate from scan execution?
- [ ] Are database operations idempotent or properly validated?
- [ ] Is navigation (breadcrumbs, steppers) visually tested?

### 4. Regular Audits

**Monthly tasks**:
- Review open regression issues
- Update this document with new patterns
- Verify documentation matches implementation
- Run full E2E test suite
- Check for removed confirmation dialogs

---

## Related Documentation

- [PRD.md](../../.claude/PRD.md) - Product requirements and workflows
- [Frontend Development Guide](frontend-dev.md) - UI component patterns
- [Backend Development Guide](backend-dev.md) - Database and API patterns
- [Issue #317](https://github.com/gander-tools/diff-voyager/issues/317) - Documentation audit task

---

## Reporting New Regressions

When you discover a regression:

1. **Create GitHub issue** with:
   - Clear title: `bug(scope): [regression] description`
   - Steps to reproduce
   - Expected vs actual behavior
   - Reference to original working implementation

2. **Update this document**:
   - Add new section for regression pattern
   - Document root cause once identified
   - Provide correct implementation
   - Add prevention strategies

3. **Add test coverage**:
   - Write regression test before fixing
   - Verify fix doesn't break other features
   - Add to CI/CD pipeline

4. **Update related docs**:
   - PRD.md if workflow changed
   - Frontend/backend guides if patterns changed
   - CLAUDE.md if development process affected
