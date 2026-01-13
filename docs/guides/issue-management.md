# Issue Management and Dependency Tracking

**Policy:** All feature implementation must follow structured issue hierarchy with explicit dependency tracking.

## Issue Hierarchy Structure

Every major feature (Phase) should have:

1. **Parent Issue** - Epic that **implements the integrated feature** using sub-issue components
   - **Creates/implements** the complete feature by integrating sub-issue components
   - Contains tasklist with links to all sub-issues
   - Groups sub-issues by implementation level
   - Tracks overall acceptance criteria
   - Description explicitly states "by integrating components from sub-issues..."

**Parent Issue Description Format:**

Parent issue descriptions must clearly state they **implement/create** the integrated feature:
- ✅ **Good:** "Implement complete Run Management UI **by integrating components from sub-issues (#185-#192, #235, #236) into a complete hierarchical workflow** for creating and monitoring comparison runs."
- ❌ **Bad:** "Implement complete Run Management UI for creating and monitoring comparison runs." (doesn't mention integration work)

The description should make it clear the parent issue:
1. **Creates/implements** something (the integrated feature)
2. **Uses components** from sub-issues
3. **Integrates** them into a complete workflow

2. **Sub-Issues** - Organized in 4 levels based on dependencies

### Level 1: Atomic Components (No Dependencies)

- Building blocks that don't depend on other issues
- Can be implemented in parallel
- Typically `size/small` or `size/medium`
- Examples: RunCard, RunForm, RunStatusBadge

**Issue Body Format:**
```markdown
# Description
[Component description]

# Level
**Level 1: Atomic Component** (no dependencies)

# Implementation
[Technical details]
```

### Level 2: Composite Views (Depend on Level 1)

- Views that use atomic components
- Can be implemented in parallel once their dependencies are ready
- Typically `size/medium` or `size/large`
- Must document dependencies in issue body and comments

**Issue Body Format:**
```markdown
# Description
[View description]

# Level
**Level 2: Composite View**

# Dependencies
Depends on:
- #X (ComponentName) - description
- #Y (ComponentName) - description

# Implementation
[Technical details - how components are used]
```

**Required Comment:**
```markdown
**Dependencies:** Depends on #X (ComponentName), #Y (ComponentName)
```

### Level 3: Integration (Depends on All Views)

- Single issue that connects everything together
- Routing, navigation, store integration, API wiring
- Depends on ALL Level 1 + Level 2 issues
- Typically `size/medium`

**Issue Body Format:**
```markdown
# Description
Integrate all [FeatureName] components and views into complete workflow.

# Level
**Level 3: Integration** (depends on all components and views)

# Integration Tasks
- [ ] Add routes to Vue Router
- [ ] Wire up store (Pinia) with CRUD actions
- [ ] Add navigation links in parent views
- [ ] Connect API services
- [ ] Add breadcrumbs and navigation

# Dependencies
Depends on:
- Level 1: #A, #B, #C (all components)
- Level 2: #X, #Y, #Z (all views)

Blocks: #[PARENT] (parent issue)
```

### Level 4: Testing (Depends on Integration)

- E2E tests for complete feature flow
- Depends on Integration issue being complete
- Blocks parent issue from being closed
- Typically `size/medium`

**Issue Body Format:**
```markdown
# Description
Add end-to-end tests for [FeatureName] workflow.

# Level
**Level 4: Testing** (depends on integration)

# Test Scenarios
- [ ] Happy path: [flow description]
- [ ] Error handling: [scenarios]
- [ ] Edge cases: [scenarios]

# Dependencies
Depends on: #[INTEGRATION_ISSUE] (Integration)
Blocks: #[PARENT] (parent issue - cannot close without E2E tests)
```

## Example: Run Management (Phase 3)

**Levels:**
- Level 1: 5 atomic components (RunCard, RunForm, RunStatusBadge, RunProgress, RunStatistics)
- Level 2: 3 composite views (RunListView, RunCreateView, RunDetailView)
- Level 3: 1 integration (Routing + Store + Navigation)
- Level 4: 1 E2E testing

**Dependency Matrix:**
```
Issue      | Level | Depends On
-----------|-------|------------------
#188       | 1     | - (atomic)
#189       | 1     | - (atomic)
#190       | 1     | - (atomic)
#191       | 1     | - (atomic)
#192       | 1     | - (atomic)
#185       | 2     | #188
#186       | 2     | #189
#187       | 2     | #190, #191, #192
#235       | 3     | #185, #186, #187 (+ all L1)
#236       | 4     | #235
#179       | Epic  | #236 (+ all others)
```

## Execution Rules

1. **Cannot start Level N until all dependencies from Level N-1 are CLOSED**
2. **Within a level, issues can be worked on in parallel** (if dependencies met)
3. **Parent issue implements integration and stays OPEN until ALL sub-issues (including E2E) are CLOSED** - Parent issue represents the work of integrating all sub-issue components into complete feature
4. **Always add dependency comments to issues** for GitHub tracking

## Creating Issues for New Feature

**Checklist:**
- [ ] Create parent issue with tasklist grouped by levels
- [ ] Create all Level 1 issues (atomic components)
- [ ] Create all Level 2 issues (composite views) with dependencies documented
- [ ] Create Level 3 issue (integration) depending on all Level 1 + 2
- [ ] Create Level 4 issue (E2E tests) depending on integration
- [ ] Add dependency comments to ALL issues except Level 1
- [ ] Assign to milestone
- [ ] Add appropriate labels (size, priority, scope)

## Benefits

- ✅ Clear execution order prevents premature implementation
- ✅ Parallel work possible within levels
- ✅ Dependencies visible in GitHub
- ✅ Parent issue tracks progress across levels
- ✅ Easy to identify what's blocking vs. what's ready
