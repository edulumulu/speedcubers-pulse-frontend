---
name: new-component
description: Scaffold a new React component or feature module following the SpeedCubers Spain frontend architecture. Use when the user wants to create a new component, page, or feature — e.g. "create the login form", "scaffold the timer feature", "add a ranking card component". Trigger when the user names a UI element that doesn't yet have files in src/.
---

# New Component

Scaffold a React component or feature module following the project structure.

## Shared component (in `src/components/`)

For reusable UI primitives (Button, Modal, Avatar, etc.):

```
src/components/
  <ComponentName>/
    <ComponentName>.jsx        # Component logic
    <ComponentName>.test.jsx   # Vitest + React Testing Library
    index.js                   # Re-export: export { default } from './<ComponentName>'
```

**Template:**
```jsx
// ComponentName.jsx
export default function ComponentName({ prop1, prop2 }) {
  return (
    <div>
      {/* render */}
    </div>
  );
}
```

## Feature module (in `src/features/<feature>/`)

For feature-specific pages and components (auth, timer, ranking, etc.):

```
src/features/<feature>/
  components/
    <FeaturePage>.jsx
    <SubComponent>.jsx
  hooks/
    use<Feature>.js            # Feature-specific hook
  __tests__/
    <FeaturePage>.test.jsx
  index.js                     # Public API of the feature
```

## Redux slice (if the feature needs global state)

```
src/store/
  <feature>Slice.js            # createSlice + selectors
```

**Template:**
```js
import { createSlice } from '@reduxjs/toolkit';

const initialState = { /* ... */ };

const <feature>Slice = createSlice({
  name: '<feature>',
  initialState,
  reducers: {
    // ...
  },
});

export const { /* actions */ } = <feature>Slice.actions;
export const select<Feature> = (state) => state.<feature>;
export default <feature>Slice.reducer;
```

## API service (RTK Query endpoint)

Add to the relevant API slice in `src/services/`:

```js
// Inside createApi endpoints:
get<Resource>: builder.query({
  query: (id) => `/<resource>/${id}`,
  providesTags: ['<Resource>'],
}),
```

## Conventions

- Functional components only — no class components
- `export default` for the component, named exports for hooks and selectors
- Tailwind for all styling — no inline styles, no CSS modules
- Props validation with JSDoc (no PropTypes library, no TypeScript yet)
- Never fetch directly in components — use RTK Query hooks or custom hooks

## Test template

```jsx
import { render, screen } from '@testing-library/react';
import { renderWithProviders } from '../../utils/test-utils';
import ComponentName from './ComponentName';

describe('ComponentName', () => {
  it('renders without crashing', () => {
    render(<ComponentName />);
    expect(screen.getByRole('...')).toBeInTheDocument();
  });
});
```

## After scaffolding

Suggest the expected commit:
```
feat(<scope>): scaffold <ComponentName> component
```
