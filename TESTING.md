# Testing Documentation

This project uses **Jest** and **React Testing Library** for unit and integration testing.

## Running Tests

To run all tests:
```bash
npm test
```

To run tests in watch mode:
```bash
npm run test:watch
```

## Testing Strategy

- **Unit Tests:** Located in `tests/lib/`, these test utility functions and logic in isolation.
- **Component Tests:** Located in `tests/components/`, these test React components using JSDOM and React Testing Library.
- **Integration Tests:** The project also uses playwright for visual verification and end-to-end flows.

## Mocking

### Database (SQLite/Drizzle)
We mock the Drizzle database client to avoid making real database calls. Since Drizzle uses a functional or query builder API, we mock the specific parts of the `db` object:

```typescript
import { db } from '@/lib/db'

jest.mock('@/lib/db', () => ({
  db: {
    query: {
      jobs: {
        findFirst: jest.fn(),
      },
    },
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockResolvedValue({}),
  },
}))
```

Example usage in a test:
```typescript
(db.query.jobs.findFirst as jest.Mock).mockResolvedValue({
  score: 85,
  score_reason: 'Good match',
})
```

### Groq AI
AI content generation is mocked to return predictable JSON or text strings, avoiding latency and costs during testing.

### External APIs
`fetch` is mocked globally in API tests to simulate responses from Adzuna and JSearch.

## Continuous Integration

Tests are automatically run on every push and pull request via GitHub Actions. See `.github/workflows/ci.yml` for configuration.
