# Varaamo end-to-end tests

Playwright tests for Varaamo's customer site, admin UI (`/kasittely`) and Django admin. They run against the shared
test environment, https://varaamo.test.hel.ninja/.

> [!WARNING]
> A test run deletes and recreates the test data (everything under the unit Harakka) in the shared test environment.
> Never start two runs at the same time, locally or in CI.

## Setup

You need Node 24 and pnpm 11 (`corepack enable` sets up pnpm). This folder is a pnpm project of its own, so run all
commands here.

```bash
pnpm install
pnpm e2e:install-deps   # Chromium, Firefox and WebKit, with their system packages
cp TestSuites/Resources/.env.example TestSuites/Resources/.env
```

Then fill in the three secrets in `.env`: `WAF_BYPASS_SECRET`, `ROBOT_API_TOKEN` and `DJANGO_ADMIN_PASSWORD`.
Variables already set in the environment win over `.env`.

## Running tests

| Command                   | Runs                                                                             |
| ------------------------- | -------------------------------------------------------------------------------- |
| `pnpm test:all`           | Everything: `pnpm test`, then `pnpm test:notifications`, even if the first fails |
| `pnpm test`               | All suites in parallel, except the notification suite                            |
| `pnpm test:notifications` | The notification suite, one test at a time                                       |
| `pnpm test:smoke`         | The customer and admin login tests on desktop                                    |
| `pnpm test:sequential`    | Like `pnpm test`, with one worker and shared users                               |
| `pnpm report`             | Opens the HTML report                                                            |

One suite, or one test in it:

```bash
pnpm exec playwright test --project Tests_user_desktop_FI
pnpm exec playwright test --project Tests_user_desktop_FI -g "User logs in and out with suomi_fi"
```

Add `--headed` to watch the browser, `--ui` for the UI mode or `--debug` for the inspector.

- Every run of the suites, even of one test, first recreates the test data (the `create_data` project) and waits
  until the site works again.
- The notification suite runs separately, because its banners show on every page of the shared environment. It
  doesn't recreate the test data.

## Results

- **HTML report:** `pnpm report`. It shows each test's keyword steps with their arguments. After `pnpm test:all`,
  the notification suite has a report of its own: `pnpm exec playwright show-report playwright-report/notifications`.
- **Failed tests** keep a full-page screenshot of each open page, a video and an `error-context.md` (the page's
  accessibility snapshot) in `test-results/`.
- **Test data:** each test logs the users that its tags chose, under "Before Hooks".
- **Backend errors:** at the top of each attempt, the report lists what went wrong between the browser and the test
  environment: 5xx responses, failed or slow requests, GraphQL errors, the apps' error pages and errors in the page
  (`lib/backend-errors.ts`). They show whether a failure came from the backend.
- **Text summary:** `python3 tools/report_summary.py [report folder]` prints the totals, the warnings and each failed
  or flaky test with its error, failing step, attachments and backend errors. It also reads reports downloaded from
  CI. `--all` adds the passed tests, `--markdown` prints Markdown, and `--extract DIR` writes the report's JSON files.
- **JUnit:** `test-results/junit.xml`.

## Troubleshooting

| Problem                                        | Cause and fix                                                             |
| ---------------------------------------------- | ------------------------------------------------------------------------- |
| `create_data` fails: `Unexpected status 429`   | The test data was requested less than a minute ago. Wait a minute.        |
| `create_data` fails: `Unexpected status 425`   | The backend is still creating the test data for another run. Wait for it. |
| `create_data` fails: `Unexpected status 401`   | `ROBOT_API_TOKEN` is wrong.                                               |
| The run stops: `Invalid environment variables` | A setting has an invalid value. The message names it.                     |

## Settings

Set them in the environment or in `TestSuites/Resources/.env` (`.env.example` lists them all).

| Variable               | Default                       | Effect                                                                                 |
| ---------------------- | ----------------------------- | -------------------------------------------------------------------------------------- |
| `WORKERS`              | `5`                           | Parallel workers                                                                       |
| `RETRIES`              | `1`                           | Retries of a failed test                                                               |
| `FORCE_SINGLE_USER`    | `false`                       | `true`: all tests use the same shared users, as they always do with one worker         |
| `PW_TRACE`             | `off`                         | A Playwright trace mode, like `on` or `retain-on-failure`. Ignored in CI               |
| `ENABLE_HAR_RECORDING` | `false`                       | `true`: a HAR file of each browser context in the test's `test-results/` folder        |
| `LOG_LEVEL`            | `INFO`                        | The lowest level of `log()` messages in the report: `DEBUG`, `INFO`, `WARN` or `ERROR` |
| `LOG_FORMAT`           | `text`                        | `json`: the console messages are JSON lines                                            |
| `SHARED_STATE_DIR`     | `.shared-state`               | The folder of the locks between the workers                                            |
| `ROBOT_API_ENDPOINT`   | `/v1/create_robot_test_data/` | The backend endpoint that creates the test data                                        |

Booleans take `true`/`false` or `1`/`0`, in any case. HAR files and traces are for local debugging only: don't upload
them as CI artifacts.

## Suites

| Project                            | Tests | Covers                                                                                |
| ---------------------------------- | ----- | ------------------------------------------------------------------------------------- |
| `Tests_user_desktop_FI`            | 11    | Customer site on desktop Chromium: login, single, paid and recurring bookings, emails |
| `Tests_user_mobile_android_FI`     | 6     | Customer tests on a Pixel 5 (Chromium)                                                |
| `Tests_user_mobile_iphone_FI`      | 6     | Customer tests on an iPhone 14 (WebKit)                                               |
| `Tests_admin_desktop_FI`           | 5     | Admin UI: login, reservation types, permissions (with Django admin in Firefox)        |
| `Tests_users_with_admin_desktop`   | 3     | A customer books, an admin handles the booking, the customer checks the result        |
| `Tests_admin_notifications_serial` | 4     | Banner notifications, one test at a time                                              |

- The three customer projects share the tests in `TestSuites/customer-tests.ts`. The desktop runs all of them except
  those tagged `@phone-only`. The phones run those tagged `@also-on-phones` or `@phone-only`.
- Helper projects: `create_data` creates the test data, `notifications_login` logs in the notification suite's admin
  once, and `unit` runs the unit tests in `unit/`.

## Layout

| Path                                | Contents                                                                                                                           |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `TestSuites/Tests_*.spec.ts`        | The suites, one file per project                                                                                                   |
| `TestSuites/customer-tests.ts`      | The customer tests, shared by the desktop and phone projects                                                                       |
| `TestSuites/fixtures.ts`            | The suites' `test`, with the page objects, `testData`, `state` and `session` as fixtures                                           |
| `TestSuites/PO/`                    | Page objects, one class per file, in `Admin/`, `App/`, `Common/` and `User/`. `App/` has the workflow keywords                     |
| `TestSuites/Resources/`             | Shared keywords, constants (`variables.ts`, `texts_FI.ts`), test users (`test_users.ts`, `serial_users.ts`) and `.env.example`     |
| `TestSuites/test-data.ts`           | How the tags pick a test's users and units                                                                                         |
| `TestSuites/state.ts`, `booking.ts` | Values that keywords pass on during a test, and a customer's booking                                                               |
| `lib/`                              | The runtime: `@step` and `log()` (`runtime.ts`), settings (`env.ts`), the pages of a test (`session.ts`), locks and backend errors |
| `unit/`                             | Unit tests of `lib/` and of the keywords that need no test environment                                                             |
| `tools/report_summary.py`           | The text summary of a report                                                                                                       |
| `graphql.config.ts`                 | Codegen settings for the GraphQL queries                                                                                           |

## Writing tests

- **Where:** customer tests go in `TestSuites/customer-tests.ts`, the others in their suite's `Tests_*.spec.ts`. Use
  the `test` from `TestSuites/fixtures.ts`.
- **Tags** pick the test's users and units before it starts:
  - A data set tag of its own: `@user-data-set-N` (customer test), `@admin-test-data-set-N` (admin test) or
    `@combined-test-data-set-N` (customer and admin test). The sets are in `Resources/test_users.ts`.
  - Admin and combined tests: the suite tag `@admin-suite` or `@combined-suite`.
  - Customer tests that also run on phones: `@also-on-phones`, or `@phone-only` for phones only.
  - `@smoke`: the test is also in `pnpm test:smoke`.

  A wrong data set or suite tag fails the test at its start.

- **Page objects** are fixtures: `async ({ appCommon, appUser }) => { … }`. Tests mostly call the workflow keywords
  in `PO/App/`.
- **Keywords** are page object methods with a step name. The report shows each call as a step with its arguments:

  ```ts
  @step("app_common.User Logs In With Suomi Fi")
  async userLogsInWithSuomiFi() { … }
  ```

  In a page object, use `this.page` (the Playwright page), `this.pages` (the other page objects), `this.testData`
  (users and units), `this.state` (values that earlier keywords saved), `this.isMobile` (true on phones) and
  `this.session` (the test's pages: `switchTo(page)` changes the one the keywords use).

- **Sections:** group a test's steps with `await test.step("User pays the reservation", async () => { … })`.
- **Constants** (URLs, texts, units, selectors) are in `TestSuites/Resources/`, like `variables.ts` and `texts_FI.ts`.
- **Waiting:** rely on Playwright's auto-waiting and `expect` (10 s by default; actions and navigations wait 40 s).
  Use a fixed sleep only when nothing on the page tells when to go on.

## How a run works

1. The global setup makes a lock folder for the run in `.shared-state/`.
2. `create_data` asks the backend to recreate the test data. It waits until the new data is saved (at most 5 min) and
   the site answers normally three times in a row (at most 2 min).
3. The suites run in parallel. The workers' first tests start 10 s apart, so they don't overload the test environment.
4. Locks keep each data set's users and each unit's free times to one test at a time.
5. A failed test is retried once. A skipped test fails the run.

The tests run in Helsinki time, like the app: the config sets `TZ` and the browsers' time zone.

## Checks

These need no test environment. The "E2E checks" workflow runs them on pull requests.

```bash
pnpm codegen     # writes the GraphQL query types to gql/gql-types.ts (not committed); pnpm lint needs them
pnpm lint        # oxlint with type checking and the frontend's rules; pnpm lint:fix fixes what it can
pnpm format      # formats with oxfmt; pnpm format:check only checks
pnpm run list    # lists the tests, which fails if a file doesn't load
pnpm test:unit   # unit tests of lib/ and of the keywords, against local pages
```

## CI (GitHub Actions)

- **E2E checks** (`.github/workflows/test-e2e.yml`) runs the checks above on pull requests and pushes to `main` that
  change `e2e/` or `tilavaraus.graphql`.
- **E2E tests** (`.github/workflows/run-e2e.yml`) runs the suites against the test environment. Start it by hand in
  the Actions tab and pick the suite ("All Tests" is `pnpm test:all`), the mode (sequential is one worker with shared
  users) and the workers of a parallel run (3, 4 or 5). One run goes at a time. The secrets are repository secrets
  with the same names. The job summary lists the results, and the reports are in the `e2e-reports-<run number>`
  artifact for 30 days.
- Both run in the official Playwright image of the `@playwright/test` version in `package.json`, which has the
  browsers. Keep that version exact, without `^`.

## History

Converted from the Robot Framework suite
[tilavarauspalvelu-robot](https://github.com/City-of-Helsinki/tilavarauspalvelu-robot) (commit `dc72ec3`), which it
replaced. Many names come from there, like the project names, the keyword step names and the `ROBOT_*` variables.
