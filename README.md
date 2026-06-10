# Popula

Popula is a full-stack demographic analytics workspace for CSV ingestion, visual query building, and real-time data visualization.

The project is built for the Stage 9 Frontend Wizards final task. It allows analysts to upload demographic CSV data, query it with a recursive visual builder, and inspect filtered results through tables and charts.

## Tech Stack

### Frontend

- Next.js App Router
- TypeScript
- Tailwind CSS
- Zustand
- Recharts
- Motion
- Vitest
- React Testing Library
- Playwright

### Backend

- Node.js
- Express
- TypeScript
- PostgreSQL
- Knex
- Zod
- Multer
- csv-parser
- Vitest
- Supertest

## Project Structure

```txt
popula/
  frontend/
  backend/
  .github/
    workflows/
      ci.yml
  README.md
  package.json
  .env.example