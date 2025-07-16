# Frontend Application

This directory contains the frontend React application for the Personal Hub, built with [Vite](https://vitejs.dev/) and designed to be deployed on [Cloudflare Pages](https://pages.cloudflare.com/).

## Features

- **Fast Development:** Near-instant server start and HMR with Vite.
- **Modern UI:** Built with Tailwind CSS and shadcn/ui for a clean and responsive user interface.
- **Efficient Data Fetching:** Uses TanStack Query (React Query) for robust server state management.

## Key Technologies

- **Framework:** React
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **State Management:** TanStack Query
- **Forms:** React Hook Form

## Local Development

### Environment Variables

The frontend needs to know where to find the backend API. Create a `.env.local` file:

```bash
VITE_API_BASE_URL=http://localhost:8787
```

### Running the Development Server

To start the frontend development server, run:

```bash
pnpm dev:frontend
```

The application will be available at `http://localhost:5173`.

## Current Status

The frontend currently includes:
- Authentication forms (login/signup)
- Basic routing setup
- shadcn/ui components integration

## Upcoming Features

- Todo management UI with full CRUD operations
- Real-time updates using TanStack Query
- Responsive design for mobile and desktop
- Dark mode support