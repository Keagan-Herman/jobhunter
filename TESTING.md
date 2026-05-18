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
- **API Tests:** Located in `tests/api/`, these test Next.js API routes by mocking Supabase and external services (Groq, Adzuna, JSearch).
- **Component Tests:** Located in `tests/components/`, these test React components using JSDOM and React Testing Library.
- **Page Tests:** Located in `tests/dashboard/` and `tests/onboarding/`, these test the high-level page logic and user flows.

## Mocking

### Supabase
We mock the Supabase client to avoid making real database calls. Since Supabase uses a chainable API, we mock the chain:
```typescript
mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  // ... other chainable methods
  single: jest.fn().mockResolvedValue({ data: { ... }, error: null })
}
```

### Groq AI
AI content generation is mocked to return predictable JSON or text strings, avoiding latency and costs during testing.

### External APIs
`fetch` is mocked globally in API tests to simulate responses from Adzuna and JSearch.

## Continuous Integration

Tests are automatically run on every push and pull request via GitHub Actions. See `.github/workflows/ci.yml` for configuration.
