# Frontend testing

> Also read the [frontend code style](./frontend-code-style.md).

Tests use Vitest, React Testing Library, and `happy-dom`. Run `just help` in `frontend/` for the test commands.
The test scripts set `TZ=Europe/Helsinki`. Run tests through them, so dates match CI.

## General rules

The `General rules` in [backend testing](./backend-testing.md) apply here too.
Test what the user sees and does through the rendered component, not the internal state or hook calls.

## Location

- Put a test next to the file it tests, as `<File>.test.tsx`.
- Put page tests in `apps/customer/test/<route>/`, at the same path as the route. Put shared mocks there too.
- Put mocks that only one directory uses in `__test__/mocks.ts` in that directory.

## Queries and assertions

- Find elements in this order: `getByRole`, `getByLabelText`, `getByText`, then `getByTestId`.
  Use a test id only when the element has no role, label, or text that a user sees.
- The test setup replaces `t` with a function that returns the key. Assert on the key, such as
  `"reservation:state.CONFIRMED"`, not on the Finnish text.
- Use `userEvent.setup()` for clicks and typing, not `fireEvent`.
- Use `findBy...` or `waitFor` for things that appear after a query or a mutation.
- Prefer exact matches. Do not use a regex or a partial text match when the full value is known.
- For a large shared component, check accessibility with `axe` from `vitest-axe`.
  See `packages/ui/src/components/WeeklyPatternCalendar/WeeklyPatternCalendar.test.tsx`.

## GraphQL

- Mock the API with `MockedProvider` from `@apollo/client/testing`.
  In the customer app, use `MockedGraphQLProvider` and `createGraphQLMocks` from `test/`.
- Build mock data with the generated fragment and query types from `@gql/gql-types`,
  so a schema change breaks the mock at type check.
- Write a small factory function with an `overrides` argument for repeated mock data.
- For a mutation, assert on what the user sees after the result, such as a toast or a changed text.

## Time

- Set the time with `vi.useFakeTimers({ now: ... })` in tests that depend on the current date.
  Restore it with `vi.useRealTimers()` in `afterEach`.

## Mocking

Mock at system boundaries only: the GraphQL API, the Next.js router, time, and browser APIs that `happy-dom` lacks.
Do not mock the component's own hooks or helpers. If a component is hard to test without that, change its design.

`vi.mock` of `next/router` does not reach `packages/ui`. Mock the `ui` hook that uses the router instead.

## Backend query tests

The backend runs each frontend query against the real schema. After you change a query,
run them as in `Database` in [backend testing](./backend-testing.md).
