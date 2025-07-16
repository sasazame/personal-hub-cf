# UI Package

This package contains shared React components used across the frontend application.

## Philosophy

Components are built using [Shadcn/ui](https://ui.shadcn.com/) and styled with [Tailwind CSS](https://tailwindcss.com/). This approach provides beautifully designed, accessible, and unstyled base components that can be easily customized.

## Usage

Components from this package can be imported directly into the frontend application:

```tsx
import { Button } from '@personal-hub/ui';

const MyComponent = () => {
  return <Button>Click Me</Button>;
};
```
