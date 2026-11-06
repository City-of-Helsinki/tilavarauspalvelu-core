# Frontend architecture

> Also read the [frontend code style](./frontend-code-style.md).

Follow this architecture for code under `frontend/`. Run `just help` in `frontend/` for the commands.

```
frontend/
├── apps/
│   ├── customer/                       # Public app for residents and organisations
│   │   ├── gql/
│   │   │   └── gql-types.ts            # Generated. See `GraphQL`
│   │   ├── public/
│   │   │   └── locales/<lang>/         # See `Translations`
│   │   │       └── <namespace>.json
│   │   ├── src/
│   │   │   ├── components/             # See `Components`
│   │   │   │   └── <feature>/          # Optional group for one feature
│   │   │   ├── context/                # React contexts
│   │   │   ├── hooks/                  # Hooks for many pages
│   │   │   │   └── index.ts
│   │   │   ├── lib/                    # See `Page layer`
│   │   │   │   └── <route>/            # Same path as the route under `pages/`
│   │   │   │       └── index.ts
│   │   │   ├── modules/                # See `Modules`
│   │   │   │   ├── queries/            # Queries and fragments that many pages share
│   │   │   │   └── schemas/            # Zod form schemas
│   │   │   ├── pages/                  # See `Page layer`
│   │   │   │   ├── api/                # Next.js API routes
│   │   │   │   └── <route>/
│   │   │   ├── styled/                 # Styled components for this app only
│   │   │   ├── styles/                 # Global CSS and SCSS
│   │   │   ├── env.mjs                 # See `Environment`
│   │   │   ├── instrumentation.ts      # Sentry setup
│   │   │   └── proxy.ts                # Next.js request proxy
│   │   └── test/                       # Page tests and shared mocks. See frontend testing
│   └── staff/                          # Staff app. Same structure as `customer/`
│       └── src/
│           └── schemas/                # Zod form schemas, in `src/` instead of `modules/`
├── packages/
│   ├── tsconfig/                       # Shared TypeScript config
│   └── ui/                             # See `Shared package`
│       ├── gql/
│       │   └── gql-types.ts            # Generated
│       └── src/
│           ├── components/
│           │   └── <Component>/        # Package for a large component
│           │       ├── <Component>.tsx
│           │       ├── <Component>.test.tsx
│           │       ├── styles.tsx
│           │       └── types.ts
│           ├── hooks/
│           ├── modules/                # Shared logic. Dates, pricing, Apollo, errors
│           ├── queries/                # Fragments both apps use
│           ├── schemas/                # Zod schemas both apps use
│           └── styled/                 # Shared styled components and typography
├── scripts/                            # Scripts that only the frontend uses, linked from package.json
├── test-utils/                         # Test helpers for every app
└── graphql.config.ts                   # Codegen projects and scalar types
```

See `apps/staff/src/pages/reservations/[id]/index.tsx` and `apps/staff/src/lib/reservations/[id]/` for an example.

This is the general structure. It is not an exhaustive list of files and not
every app needs every directory. Prefer the pre-defined locations when possible.

## Page layer

Next.js Pages Router. One file under `pages/` for each route.

- A page file has the default export `Page`, `getServerSideProps`, and the page query.
- Every page exports `getServerSideProps`, so the server loads the environment. `src/pages.test.ts` checks this.
- `getServerSideProps` loads translations with `serverSideTranslations`, and fetches the first data with
  `createClient(apiBaseUrl, req)`. Return `notFound` when the data is not found.
  The staff app has `NOT_FOUND_SSR_VALUE` for this.
- Put the components for one route in `lib/<route>/`, at the same path as the route.
  Export them from `lib/<route>/index.ts`. The staff app imports them with `@lib/`, the customer app with `@/lib/`.

## Components

`components/` holds components that more than one route uses.
A component that only one route uses goes in `lib/<route>/`.
A component that both apps use goes in `packages/ui`.

Build on the Helsinki Design System (`hds-react`) before you write a new component.

## Modules

Plain TypeScript with no JSX where possible. Helpers, URL builders, constants, and server utilities.
Use `modules/urls.ts` to build links. `modules/serverUtils.ts` reads the environment on the server.

## Shared package

`packages/ui` is the code that both apps share. Import using `@ui/`, which resoslves to `packages/ui/src/`.
It has its own `gql-types.ts` for fragments both apps use.

## GraphQL

The schema is `tilavaraus.graphql` in the repository root. The backend generates it.

- Write each operation with `gql` next to the code that uses it.
  The page query goes in the page file. A fragment goes next to the component that reads its fields.
- Compose page queries from component fragments, so each component asks for the fields it reads.
- Run codegen after you change an operation or the schema. It writes `gql/gql-types.ts` for each project
  in `graphql.config.ts`. Never edit `gql-types.ts` by hand.
- Import types and hooks from `@gql/gql-types`.
- Give each operation and fragment a name that is unique in its codegen project.

## Translations

`next-i18next`. Each app has JSON files under `public/locales/<lang>/<namespace>.json`.

- The customer app has `fi`, `en` and `sv`. Add each new key to all three.
- The staff app has `fi` only.
- Read [`frontend-glossary.md`](./frontend-glossary.md) before you write text that a user reads.

## Environment

`src/env.mjs` validates the environment with Zod. Add each new variable to it.
Read the values on the server and pass them to the client through page props.

## Dependency direction

`pages/` depends on `lib/`, `components/`, `modules/`, and `packages/ui`.
`lib/` and `components/` depend on `modules/` and `packages/ui`.
`packages/ui` depends on no app. One app never imports from the other app.
If you need to break this rule, stop and ask the user how to resolve it.
