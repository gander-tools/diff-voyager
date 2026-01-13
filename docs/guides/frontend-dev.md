# Frontend Development

This guide covers frontend development workflows for Diff Voyager's Vue 3 + TypeScript frontend.

## Development Commands

```bash
cd packages/frontend
npm install
npm run dev              # Start dev server
npm test                 # Run tests
```

## Common Frontend Issues

### Vue 3 Component Resolution Errors

If you see console errors like:
```
[Vue warn]: Failed to resolve component: NButton
[Vue warn]: Failed to resolve component: DefaultLayout
```

**Root Cause**: Vue 3 requires explicit imports for all components. Components cannot be used in templates without importing them first.

**Solution**: Add explicit imports at the top of the `<script setup>` section:

```typescript
// For Naive UI components
import { NButton, NCard, NLayout } from 'naive-ui';

// For custom components
import DefaultLayout from './components/layouts/DefaultLayout.vue';

// For router components
import { RouterView } from 'vue-router';
```

### Note on @vicons/tabler

Ensure the package is installed:
```bash
npm install @vicons/tabler
```

Available icon names can be found in `node_modules/@vicons/tabler/es/`. Common icons:
- `Dashboard`, `Settings`, `Filter`
- `Folder` (note: `FolderOpen` does not exist)
- `Globe`, `Moon`, `Sun`
- `PlaylistAdd`, `Playlist`

Import icons with exact PascalCase names:
```typescript
import { Dashboard, Filter, Folder } from '@vicons/tabler';
```

## Form Validation with vee-validate

**Status**: ✅ Implemented (January 2026)

Diff Voyager uses [vee-validate](https://vee-validate.logaretm.com/) with Zod schemas for declarative form validation in Vue 3.

### Dependencies

- `vee-validate@^4.15.1` - Vue 3 form validation library
- `@vee-validate/zod@^4.15.1` - Zod schema integration
- `zod@^3.25.76` - Schema validation (compatible with @ts-rest and vee-validate)

### Why vee-validate + Zod?

- **Declarative validation**: Define validation rules in Zod schemas, not imperative code
- **Type-safe**: Full TypeScript inference from schemas
- **DRY principle**: Single source of truth for validation and types
- **Better UX**: Built-in support for validation on blur/change/submit
- **Clean code**: No manual error state management

### Example Usage

```typescript
// 1. Define Zod schema in validators.ts
export const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required'),
  url: z.string().url('Invalid URL format'),
  // ... more fields
});

// 2. Use in Vue component
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';

const { handleSubmit, errors, defineField, validate } = useForm({
  validationSchema: toTypedSchema(createProjectSchema),
  initialValues: { name: '', url: '' },
});

// 3. Define form fields
const [name] = defineField('name');
const [url] = defineField('url');

// 4. Handle submission
const onSubmit = handleSubmit((values) => {
  // values is fully typed from schema
  emit('submit', values);
});
```

### Key Features

- **Nested fields**: Use dot notation for nested validation (`viewport.width`)
- **Async validation**: Built-in support for async rules
- **Multi-step forms**: Validate specific fields using `validate()`
- **Integration with Naive UI**: Works seamlessly with NForm components

### Important Notes

- vee-validate requires `zod@^3.x` (not v4) for compatibility
- All form validation should use vee-validate for consistency
- Error messages should be defined in Zod schemas, not in components
- Test async validation with proper awaits: `await wrapper.vm.$nextTick()`

See `packages/frontend/src/components/ProjectForm.vue` for a complete multi-step form example.

## Screenshot Updates

**Status**: ✅ Automated screenshot generation available

Diff Voyager automatically generates documentation screenshots for all UI views.

### When to Update Screenshots

- After implementing new views or pages
- After making visual changes to existing views
- After UI/UX improvements
- Before committing frontend changes

### How to Update

```bash
# Ensure backend is not running (script will start it automatically)
npm run screenshots
```

### What Happens

1. Script starts backend server automatically
2. Script starts frontend dev server
3. Creates test project via API
4. Captures 11 screenshots (1024x768) using Playwright
5. Saves to `docs/screenshots/*.png`
6. Stops both servers

### Screenshot Files

- `01-dashboard.png` - Main dashboard
- `02-projects-list.png` - Project list with pagination
- `03-project-create.png` - Multi-step project creation
- `04-project-detail.png` - Project detail view
- `05-run-create.png` - Run creation form
- `06-run-detail.png` - Run detail and results
- `07-page-detail.png` - Page comparison details
- `08-rules-list.png` - Mute rules list
- `09-rule-create.png` - Rule creation form
- `10-settings.png` - Application settings
- `11-not-found.png` - 404 page

### Important Notes

- Screenshots are **version controlled** in git (included in commits)
- Used in documentation: `roadmap.md`, `CLAUDE.md`
- Viewport: 1024x768 (configurable in script)
- See `docs/screenshots/README.md` for complete index

### Troubleshooting

- If script fails, ensure no servers are running on ports 3000 or 5173
- Check Playwright installation: `npx playwright install`
- Backend must be buildable: `npm run build:backend`

## Related Documentation

- [i18n Guide](i18n.md) - Internationalization with Vue I18n
- [Getting Started](getting-started.md) - Initial setup
- [Testing Strategy](testing-strategy.md) - Frontend testing approach
