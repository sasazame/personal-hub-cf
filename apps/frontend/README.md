# Frontend Application

This directory contains the frontend React application for the Personal Hub, built with [Vite](https://vitejs.dev/) and designed to be deployed on [Cloudflare Pages](https://pages.cloudflare.com/).

## Features

- **Fast Development:** Near-instant server start and HMR with Vite.
- **Modern UI:** Built with Tailwind CSS and Shadcn/ui for a clean and responsive user interface.
- **Efficient Data Fetching:** Uses TanStack Query (React Query) for robust server state management.

## Key Technologies

- **Framework:** React
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Components:** Shadcn/ui
- **State Management:** TanStack Query
- **Forms:** React Hook Form

## Local Development

To start the frontend development server, run:

```bash
pnpm dev:frontend
```

The application will be available at `http://localhost:5173`.

## Current Status

The frontend currently includes:
- Authentication forms (login/signup)
- Basic routing setup
- Shadcn/ui components integration

## Upcoming Features

- Todo management UI with full CRUD operations
- Real-time updates using TanStack Query
- Responsive design for mobile and desktop
- Dark mode support