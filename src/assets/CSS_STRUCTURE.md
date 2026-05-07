# CSS Structure Documentation

## Overview

The project has been migrated from Tailwind CSS to a modular CSS architecture. All styles are organized in separate files by feature/page with reusable components and variables.

## File Organization

### Core Files

- **`variables.css`** - Global CSS variables (colors, spacing, typography, shadows, etc.)
- **`base.css`** - Base element styles (reset, body, font families)
- **`components.css`** - Shared UI components (header, footer, modals, cards, transitions, utilities)
- **`main.css`** - Main entry point that imports all CSS files

### Page-Specific Files

- **`home.css`** - HomePage/HomeView styles (hero, about, reviews, CTA, contacts sections)
- **`search.css`** - SearchView styles (filters sidebar, companions grid, topic tags, modals)
- **`profile.css`** - ProfileView styles (sidebar profile, tabs, settings, chats list)
- **`chat.css`** - ChatView styles (messages, input, header)
- **`auth.css`** - Authentication pages (login, signup, password reset, role selection)

## CSS Module Pattern

Each file follows a consistent structure with modules at the top:

```css
/* ===== MODULES ===== */

/* Grid layout module */
.grid-main {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

/* ===== PAGE LAYOUT ===== */
/* Page-specific styles using modules */
```

### Common Modules

1. **Layout Modules**
   - `.grid-main` - Two-column grid (sidebar + content)
   - `.grid-layout` - Multi-column grid layouts
   - `.flex-col` - Flex column layout
   - `.flex-row` - Flex row layout
   - `.flex-between` - Flex with space-between
   - `.flex-center` - Centered flex layout

2. **Typography Modules**
   - `.text-primary` - Primary color text
   - `.text-center`, `.text-left`, `.text-right`

3. **Spacing Utilities**
   - `.mb-*` - Margin bottom (1-6)
   - `.mt-*` - Margin top (1-6)
   - `.gap-*` - Gap between flex/grid items (1-6)
   - `.mx-auto` - Center horizontally

## Variables (variables.css)

### Colors
```css
--color-primary: #3b82f6
--color-secondary: #5d5a88
--color-accent-orange: #ff6330
--color-accent-red: #d32032
--color-white: #ffffff
--color-light-bg: #f8f7fc
```

### Spacing
```css
--spacing-xs: 0.25rem    /* 4px */
--spacing-sm: 0.5rem     /* 8px */
--spacing-md: 1rem       /* 16px */
--spacing-lg: 1.5rem     /* 24px */
--spacing-xl: 2rem       /* 32px */
--spacing-2xl: 2.5rem    /* 40px */
--spacing-3xl: 3rem      /* 48px */
--spacing-4xl: 4rem      /* 64px */
--spacing-6xl: 6rem      /* 96px */
--spacing-8xl: 8rem      /* 128px */
```

### Border Radius
```css
--radius-sm: 0.5rem      /* 8px */
--radius-md: 0.75rem     /* 12px */
--radius-lg: 1rem        /* 16px */
--radius-xl: 1.5rem      /* 24px */
--radius-2xl: 2rem       /* 32px */
--radius-full: 9999px    /* Fully rounded */
```

### Shadows
```css
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08)
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1)
--shadow-lg: 0 8px 20px rgba(212, 132, 106, 0.35)
--shadow-gradient: 0 4px 8px rgba(212, 132, 106, 0.15)
--shadow-card: 0 4px 12px rgba(0, 0, 0, 0.1)
```

### Transitions
```css
--transition-fast: 0.2s ease
--transition-normal: 0.3s ease
```

## Component Classes

### Buttons

**Primary Button (Gradient)**
```css
.btn-primary {
  background: linear-gradient(to right, var(--color-accent-orange), var(--color-accent-red));
  color: var(--color-white);
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-full);
}
```

**Secondary Button (Border)**
```css
.btn-secondary {
  border: 2px solid var(--color-border);
  background-color: transparent;
  color: var(--color-secondary);
}
```

### Cards
```css
.card {
  background-color: var(--color-white);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 2rem;
  box-shadow: var(--shadow-card);
}
```

### Forms
```css
.form-input {
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-secondary);
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-secondary);
}
```

### Alerts
```css
.alert-success {
  background-color: #f0fdf4;
  border: 1px solid #86efac;
  color: #166534;
}

.alert-error {
  background-color: #fef2f2;
  border: 1px solid #fca5a5;
  color: #991b1b;
}
```

## Migration Guide

### From Tailwind to CSS

**Before (Tailwind):**
```vue
<div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
  <div class="col-span-1">
    <div class="bg-white border border-border/50 rounded-3xl p-6 shadow-card sticky top-[140px]">
      <h3 class="text-lg font-bold text-secondary mb-6">Title</h3>
    </div>
  </div>
  <div class="col-span-3">
    <!-- content -->
  </div>
</div>
```

**After (CSS Modules):**
```vue
<div class="grid-main">
  <div>
    <div class="filters-sidebar">
      <h3>Title</h3>
    </div>
  </div>
  <div>
    <!-- content -->
  </div>
</div>
```

And in the CSS file:
```css
.grid-main {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 1024px) {
  .grid-main {
    grid-template-columns: 1fr 3fr;
    gap: 1.5rem;
  }
}

.filters-sidebar {
  background-color: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: 1.875rem;
  padding: 1.5rem;
  box-shadow: var(--shadow-card);
  position: sticky;
  top: 140px;
}
```

## Best Practices

1. **Use Variables** - Always use CSS variables for colors, spacing, shadows, etc.
2. **Modular Approach** - Group related styles together and use modules at the top of files
3. **Naming Convention** - Use descriptive class names in kebab-case
4. **Responsive Design** - Use media queries for mobile, tablet, and desktop breakpoints
5. **DRY Principle** - Don't repeat styles, use shared modules and utility classes
6. **Order Elements** - In each file, order styles by element appearance order

## Responsive Breakpoints

```css
/* Mobile First */
/* Default: mobile styles */

/* Tablet */
@media (min-width: 768px) {
  /* Tablet styles */
}

/* Desktop */
@media (min-width: 1024px) {
  /* Desktop styles */
}

/* Large Desktop */
@media (min-width: 1280px) {
  /* Large desktop styles */
}
```

## Transitions & Animations

### Built-in Transitions
```css
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-normal);
}

.slide-enter-active,
.slide-leave-active {
  transition: all var(--transition-normal);
}
```

### Keyframe Animations
```css
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes shimmer {
  /* Skeleton loading animation */
}
```

## File Import Order

In `main.css`:
```css
@import './base.css';          /* Base styles first */
@import './components.css';    /* Shared components */
/* Page-specific imports are done in individual Vue files */
```

In Vue component `<style>` tags, import the specific page CSS:
```vue
<script setup>
import '@/assets/search.css'
</script>
```

## Adding New Styles

1. Create a new CSS file in `src/assets/`
2. Follow the module pattern:
   - Put modules at the top
   - Organize by sections with comments
   - Use CSS variables
3. Import in the appropriate place (main.css or specific Vue file)
4. Use semantic class names

## Notes

- All Tailwind directives have been removed
- CSS is organized by feature/page for better maintainability
- Each file can be independently imported and used
- Shared styles are in `components.css` and `base.css`
- Responsive design is handled with media queries (mobile-first approach)
- All colors, spacing, and shadows are stored in `variables.css`
