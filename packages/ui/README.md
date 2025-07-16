# UI Package

This package contains shared React components used across the frontend application.

## Philosophy

Components are built using [shadcn/ui](https://ui.shadcn.com/) and styled with [Tailwind CSS](https://tailwindcss.com/). This approach provides beautifully designed, accessible, and unstyled base components that can be easily customized.

## Installation

This package is part of the monorepo and is automatically available to other workspace packages. If you need to install it in a new workspace:

```bash
pnpm add @personal-hub/ui
```

### Peer Dependencies

Make sure your project has the following peer dependencies installed:
- `react` (^18.0.0)
- `react-dom` (^18.0.0)
- `tailwindcss` (^3.0.0)

## Usage

Components from this package can be imported directly into the frontend application:

```tsx
import { Button } from '@personal-hub/ui';

const MyComponent = () => {
  return <Button>Click Me</Button>;
};
```