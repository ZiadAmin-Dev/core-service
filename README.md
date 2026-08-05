# Core Service

A production-oriented backend service built with **Node.js**, **TypeScript**, and **PostgreSQL**, following Software Engineering best practices and a layered architecture.

> This project is part of my journey toward building scalable backend systems rather than simple CRUD applications.

---

# Tech Stack

- TypeScript
- Node.js
- Express.js
- PostgreSQL
- Knex.js
- JWT Authentication
- bcrypt
- class-validator
- class-transformer
- Zod
- dotenv

---

# Project Architecture

```
src
│
├── app
│   ├── auth
│   ├── user
│   └── health
│
├── common
│   ├── config
│   ├── correlation
│   ├── error
│   ├── knex
│   ├── logger
│   ├── types
│   └── validation
│
├── migrations
│
├── app.ts
├── routes.ts
└── server.ts
```

---

# Features

- Layered Architecture
- Authentication Module
- User Module
- Health Check Endpoint
- JWT Access Tokens
- JWT Refresh Tokens
- Password Hashing (bcrypt)
- Request Validation
- Global Error Handling
- Correlation IDs
- Centralized Logging
- PostgreSQL Migrations
- Environment Configuration
- Type-safe Development

---

# Architecture Layers

```
Client
   │
   ▼
Routes
   │
   ▼
Controllers
   │
   ▼
Services
   │
   ▼
Repositories
   │
   ▼
PostgreSQL
```

Each layer has a single responsibility.

---

# Database

Current tables:

- users
- password_resets
- customer_addresses

Database schema is managed using **Knex Migrations**.

---

# Authentication Flow

```
Register Request
        │
        ▼
Validate DTO
        │
        ▼
Service
        │
        ▼
Repository
        │
        ▼
PostgreSQL
        │
        ▼
Generate Access Token
Generate Refresh Token
        │
        ▼
Response
```

---

# Error Handling

The application uses a centralized error handling strategy.

- AppError
- Global Error Middleware
- Express next(error)

This keeps controllers clean and consistent.

---

# Validation

Validation is performed before entering the business logic.

Tools:

- class-validator
- class-transformer

---

# Logging

Centralized logger for monitoring application events.

---

# Environment Variables

Create a `.env` file.

Example:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=*****
DB_NAME=core_service

ACCESS_SECRET=*****
ACCESS_EXPIRES_IN=1h

REFRESH_SECRET=*****
REFRESH_EXPIRES_IN=7d

DB_MIGRATION_DIRECTORY=src/migrations
DB_MIGRATION_EXTENSION=ts
```

---

# Installation

```bash
git clone <repo-url>

npm install
```

---

# Run Development Server

```bash
npm run dev
```

---

# Build

```bash
npm run build
```

---

# Run Production

```bash
npm start
```

---

# Run Migrations

Create Migration

```bash
npx knex migrate:make migration_name --knexfile src/common/knex/knexfile.ts
```

Run Migrations

```bash
npx knex migrate:latest --knexfile src/common/knex/knexfile.ts
```

Rollback

```bash
npx knex migrate:rollback --knexfile src/common/knex/knexfile.ts
```

---

# Project Goals

This project focuses on learning and applying:

- Clean Project Structure
- Layered Architecture
- Authentication Systems
- JWT
- Database Design
- Migrations
- Error Handling
- Validation
- Logging
- Software Engineering Practices
- Scalable Backend Development

---

# Future Improvements

- Refresh Token Rotation
- Role-Based Authorization
- Docker
- Unit Testing
- Integration Testing
- CI/CD
- Redis
- Background Jobs
- File Storage
- Rate Limiting
- API Documentation (Swagger)
- Monitoring
- Cloud Deployment