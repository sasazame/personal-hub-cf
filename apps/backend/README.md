# Backend API

This directory contains the backend API for the Personal Hub application, built with [Hono](https://hono.dev/) and running on [Cloudflare Workers](https://workers.cloudflare.com/).

## Features

- **Edge Native:** Built to run on Cloudflare's global edge network for low latency.
- **Type-Safe:** Leverages Drizzle ORM and Zod for end-to-end type safety.
- **Authentication:** Secure user authentication powered by Lucia Auth with bcryptjs for password hashing.
- **RESTful API:** Clean and intuitive API design for all resources.

## Key Technologies

- **Framework:** Hono
- **Database:** Cloudflare D1
- **ORM:** Drizzle ORM
- **Authentication:** Lucia Auth

## Local Development

### Prerequisites

Before running the backend server, ensure you have set up the required environment variables:

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` with your authentication provider secrets. See the [main README](../../README.md#local-development) for detailed setup instructions.

### Running the Server

To start the backend server locally, run:

```bash
pnpm dev:backend
```

The server will be available at `http://localhost:8787`.

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Create a new user account
- `POST /api/auth/login` - Log in with email and password
- `POST /api/auth/logout` - Log out the current user
- `GET /api/auth/me` - Get current user information

### Todos

All todo endpoints require authentication.

- `GET /api/todos` - Get paginated list of todos (supports filtering and sorting)
- `GET /api/todos/:id` - Get a specific todo
- `POST /api/todos` - Create a new todo
- `PUT /api/todos/:id` - Update a todo
- `DELETE /api/todos/:id` - Delete a todo
- `POST /api/todos/:id/toggle-status` - Toggle todo status (TODO → IN_PROGRESS → DONE)
- `GET /api/todos/:id/children` - Get child todos of a parent todo

## Database Migrations

Database schema is managed using Drizzle ORM migrations. To create and run migrations:

```bash
# Generate migration
pnpm db:generate

# Apply migrations
pnpm db:migrate
```