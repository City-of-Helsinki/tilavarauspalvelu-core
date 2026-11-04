# e2e: Varaamo end-to-end tests (Playwright)

Playwright end-to-end tests for Varaamo's customer site, admin UI (`/kasittely`) and Django admin, converted from
the Robot Framework suite in [tilavarauspalvelu-robot](https://github.com/City-of-Helsinki/tilavarauspalvelu-robot).
The tests run against the shared test environment `https://varaamo.test.hel.ninja/`.

This is a pnpm project of its own (Node 24, pnpm 11), next to `backend/` and `frontend/`. It shares no dependencies
with the frontend workspace. Only the lint rules come from there: `.oxlintrc.json` extends
`../frontend/.oxlintrc.json`, so the tests follow the same rules as the apps.

## Running

The commands are run in this directory.

Secrets go in `TestSuites/Resources/.env` (see `.env.example`): `WAF_BYPASS_SECRET`, `ROBOT_API_TOKEN` and
`DJANGO_ADMIN_PASSWORD`. Variables already in the environment win, so CI can set them directly.

```bash
pnpm install
pnpm e2e:install-deps       # Chromium, Firefox and WebKit, with their system packages
pnpm test:all               # all 35 tests: pnpm test, then pnpm test:all:notifications
pnpm test                   # all suites in parallel, creates the test data first
pnpm test:notifications     # the notification suite, serially (it has no data setup)
pnpm test:smoke             # tests tagged smoke
pnpm test:sequential        # one worker, all tests share the same users
pnpm report                 # opens the HTML report
```

`pnpm test:all` runs `pnpm test` and then `pnpm test:all:notifications`. The notifications can't run in parallel with
the other suites, because they change the banners of the shared environment, which show on the other tests' pages.
It keeps both reports: the parallel run in `playwright-report/` and `test-results/`, the notifications in
`playwright-report/notifications/` and `test-results/notifications/`. It runs both parts and fails if either one
fails, which pnpm's own options can't do: `--sequential` stops at the first failure, and `--no-bail` exits with 0.
It runs pnpm itself, so pnpm has to be on the `PATH` (`corepack enable` puts it there).

One suite: `pnpm exec playwright test --project Tests_user_desktop_FI`. One test:
`... --project Tests_user_desktop_FI -g "User logs in and out with suomi_fi"`.

The test data is created once per run by the `create_data` project, which the suites depend on. It deletes and
recreates everything under unit Harakka, so **never run two test runs against the test environment at the same
time**. The endpoint also rejects a second call within 60 seconds. The backend creates the data in one transaction,
and pages fail or hang until it has been saved, so the project waits (up to 5 minutes) until the always free unit
has a new id. If the id can't be read before the call, it waits 3 minutes like the Robot suite. The backend can
still fail for a while after that (a 502, the customer app's error page), so the project then waits until the
customer landing page, the search page and GraphQL answer normally three times in a row, 5 seconds apart. After
2 minutes the tests start anyway, with a warning in the report.

The app shows times only in Helsinki time, so the config runs the suite in it: it sets `TZ` and the browsers' time
zone to `Europe/Helsinki`.

### Settings

Environment variables, which `lib/env.ts` reads and checks. They can also go in `TestSuites/Resources/.env`, and
`.env.example` there lists them all:

- `WORKERS` (default 5) and `RETRIES` (default 1).
- `FORCE_SINGLE_USER=True`: all tests use the same shared users. Use it with one worker, like `pnpm test:sequential`.
- `ENABLE_HAR_RECORDING=True`: writes a HAR file of each browser context into the test's results folder
  (`test-results/<test>/context*.har`).
- `PW_TRACE=on` (or another Playwright trace mode, like `retain-on-failure`): records Playwright traces, which the
  HTML report shows. It is ignored when `CI` is set.
- `LOG_LEVEL` (default `INFO`): the lowest level of the `log()` messages in the report, so `DEBUG` adds the debug
  messages. `LOG_FORMAT=json` prints the messages that go to the console as JSON lines.

Booleans take `true` or `1` and `false` or `0`, in any case, and an invalid value fails the run with the variable's
name. Use HAR files and traces for local debugging only, and don't upload them as CI artifacts. Other environment
variables don't change the suite's constants, even with the same name (like `BROWSER`).

Playwright's own options work too: `--headed` shows the browsers, `--ui` opens the UI mode and `--debug` the
inspector, e.g. `pnpm exec playwright test --project Tests_user_desktop_FI --headed`.

## Suites

| Project                            | Tests | What it covers                                                                        |
| ---------------------------------- | ----- | ------------------------------------------------------------------------------------- |
| `Tests_user_desktop_FI`            | 11    | Customer site on desktop Chromium: login, single, paid and recurring bookings, emails |
| `Tests_user_mobile_android_FI`     | 6     | Customer site on an emulated Pixel 5 (Chromium)                                       |
| `Tests_user_mobile_iphone_FI`      | 6     | Customer site on an emulated iPhone 14 (WebKit)                                       |
| `Tests_admin_desktop_FI`           | 5     | Admin UI: login, reservation types, permissions (with Django admin in Firefox)        |
| `Tests_users_with_admin_desktop`   | 3     | A customer books, an admin handles the booking, the customer checks the result        |
| `Tests_admin_notifications_serial` | 4     | Banner notifications, run serially (tag `@serialonly`)                                |

Two more projects: `create_data` (`TestSuites/create_data.setup.ts`) creates the test data, and `unit` runs the unit
tests in `unit/`, which need no test environment.

## Layout

- `TestSuites/Tests_*.spec.ts`: the suites, one file per project. They use the `test` of `TestSuites/fixtures.ts`.
- `TestSuites/PO/{Admin,App,Common,User}/`: page objects, one class per file (`PageObject` in
  `TestSuites/page-object.ts`). The tests call the workflow keywords in `PO/App/app_user.ts`, `app_admin.ts` and
  `app_common.ts`. `TestSuites/pages.ts` creates a test's page objects together, so they can call each other.
- `TestSuites/test-data.ts`: the users and units that a test's tags choose. `TestSuites/state.ts`: the values that
  keywords save while a test runs.
- `TestSuites/Resources/`: shared keywords (`custom_keywords`, `devices` for the browsers and devices,
  `common_setups_teardowns`, `create_data`, `graphql_commands`, `data_modification`, …), constants (`variables` for
  URLs, units and selectors, `texts_FI`, `suite_specific_units`, `serial_users`), the test users in
  `parallel_users.dat`, and `.env.example`, which lists the environment variables.
- `lib/`: the runtime. `runtime.ts` has the `@step` decorator, `log()`, the secret redaction and the `test` fixture.
  `env.ts` reads and checks the environment variables. `session.ts` keeps a test's pages, `backend-errors.ts`
  records their backend errors into the report, `locks.ts` has the locks between the workers, and `locators.ts`,
  `responses.ts` and `retry.ts` are small helpers for the keywords.
- `graphql.config.ts`: the codegen settings for the GraphQL queries, which are written with `gql`. `pnpm codegen`
  writes their types from `../tilavaraus.graphql` to `gql/gql-types.ts`, which isn't committed.
- `unit/`: the unit tests of `lib/` and of the keywords that need no test environment, against local pages.
- `tools/`: `report_summary.py`, the report reader described below.

### Keywords, test data and tags

- A keyword is a page object method marked with its name: `@step("app_common.User Logs In With Suomi Fi") async
  userLogsInWithSuomiFi()`. Each call is a step with that name and its arguments in the HTML report, so the report
  shows the tree of keywords a test ran. The tests get the page objects as fixtures, `async ({ appCommon, appUser })
  => { await appCommon.userLogsInWithSuomiFi(); … }`, and a page object calls another one's keywords through
  `this.pages`.
- Keywords act on `this.page` with Playwright's locators, actions and `expect`. `log()` adds a message to the
  report (a WARN message also to the test's annotations). Timeouts are milliseconds, like Playwright's.
- Texts, URLs, units and selectors are constants, imported by name: `import { URL_TEST } from
  "../../Resources/variables"`.
- The users and units of a test are in `testData`: `testData.user.hetu`, `testData.admin.fullName`,
  `testData.units.alwaysFreeUnit`, `testData.units.alwaysFreeUnitWithLocation`. The tests get it as a fixture, the
  page objects as `this.testData`. Reading a unit that the test's suite doesn't pick fails.
- A value that a keyword saves for the keywords after it, like the time and number of a booking, is a field of
  `state` (`TestSuites/state.ts`): `state.timeOfQuickReservationMinusT`, `this.state.bookingNumOnly` in a page
  object. Each test gets a new one. Each field says which keywords set it.
- Tags choose the test data before the test starts. A data set tag like `@desktop-test-data-set-0` picks the users
  from the section with the same tag in `parallel_users.dat`, and only one test at a time uses a data set. A data set
  tag that `parallel_users.dat` doesn't have fails the test. A suite tag (`@desktop-suite`, `@admin-suite`,
  `@combined-suite`, `@android-suite`, `@iphone-suite`) picks the units. In sequential mode, and in tests without a
  data set tag, the tests use the shared users in `serial_users.ts`. The `testData` fixture logs the users it chose,
  under the report's "Before Hooks".

## How it works

- **Parallel runs:** the tests don't depend on each other, and they share only locks: files in a folder of each run's
  own under `.shared-state/`, so a run (or `pnpm test:unit`) never touches another run's state. The locks keep a data
  set's users and a unit's free times to one test at a time. Folders of runs started over a day ago are removed when
  a run starts. A worker can take a lock it already holds, and releasing a lock it doesn't hold fails. Locks a test
  still holds are released when it ends, and a lock left by a worker that stopped is taken over. The first tests
  start 10 seconds apart (the `staggeredStart` fixture, which marks each slot's first test in the same folder):
  when they started together, the test environment answered with 502s and error pages, and simultaneous Suomi.fi
  logins failed.
- **Retries:** a failed test is retried once. A skipped test fails the run (`lib/skips-fail-run-reporter.ts`).
- **Emails:** "Check emails from reservations" makes, pays and cancels a paid booking of its own, then checks the
  confirmation and cancellation emails of that booking in the backend's robot email cache. The backend sends emails
  from a background task, so the check polls the cache for up to 2 minutes.
- **My bookings tabs:** `mybookings.Navigate To Cancelled/Past/Upcoming Bookings` focus the tab before clicking it
  and check that it got selected. The HDS tab list slides when a tab gets focus, and on mobile WebKit the slide could
  make a plain click miss.
- **Mobile menu:** the app opens a page from the HDS mobile menu without a reload, so the menu stays open, and while
  it is open HDS uses the next click outside it only to close the menu. `topnav.Navigate To My Bookings Mobile` and
  `Navigate To Single Booking Page Mobile` close it with Escape.
- **Interrupted payment:** if the "Varauksesi on keskeneräinen" banner doesn't show in 5 seconds, the page is
  reloaded (at most 3 tries). The banner's query runs only once per page load.
- **Recurring application:** the test first cancels applications that an earlier attempt left, and sends the
  application again if the send fails with a 5xx (at most 3 sends).
- **Browsers:** each project's browser and device are in its `use` options in `playwright.config.ts`: Chromium at
  1440×900 on desktop, Pixel 5 and iPhone 14 on mobile. Playwright starts one browser per worker and gives each test
  a new context and page, which the "Set Up … And Open Url" keywords in `devices` open. A second one in a test opens
  a new context, a session of its own; the permission tests open Django admin in Firefox. The `session` fixture
  (`lib/session.ts`) keeps these pages and the one the keywords act on: a test switches with
  `session.switchTo(page)`, like the Robot suite's Switch Browser and Switch Page. Whatever a test opens itself is
  closed after it.
- **Waiting:** keywords wait for what they need: actions wait for their element, checks use Playwright's `expect`,
  and navigations wait for the new URL (`waitForURL`). A logout waits for the app's `/auth/logout/` redirect, which
  comes after the session is destroyed. After a pick from an HDS Select, `Close Select List If Open` closes a list
  that stayed open (HDS ignores a close within 200 ms of opening). The two Reload Page keywords and the admin landing
  page check wait for network idle on purpose: the pages load data after the load event. Fixed sleeps are left only
  where nothing on the page tells when to go on: the pause between login click retries, a second after the empty
  booking form's submit, and a second for banners before a "no banner" check. The config's `baseURL` is the test
  environment, so Playwright code can open pages with `page.goto("/…")`.
- **Reports:** the HTML report shows the keyword steps of each test, with the arguments (a locator as Playwright
  describes it, like `getByTestId('reservation__status')`), and `test-results/junit.xml` is for CI summaries. A
  failed test has a full-page screenshot of each open page and a video of its own page. Backend errors are
  annotations of each attempt, see below.

## Checks without the test environment

```bash
pnpm codegen   # the types of the GraphQL queries, which pnpm lint needs
pnpm lint      # oxlint with type checking, with the frontend's rules
pnpm test:unit # the unit tests of lib/ and of the keywords that need no test environment
```

The "E2E checks" workflow (`.github/workflows/test-e2e.yml`) runs these, `pnpm format:check` and `pnpm run list`
for pull requests and pushes to `main` that change `e2e/` or the GraphQL schema.

## GitHub Actions

The "E2E tests" workflow (`.github/workflows/run-e2e.yml`) runs the suite against the test environment. Start it in
the Actions tab and pick the suite ("All Tests" is `pnpm test:all`) and the mode (sequential is one worker with
shared users).

- It runs 3 workers, and one run at a time, because each run creates the test data again.
- The run's summary shows the `report_summary.py` output. The reports are in its `e2e-reports-<run number>`
  artifact for 30 days.

## Reading a run's results

`python3 tools/report_summary.py [playwright-report]` prints the run's totals and warnings, and each failed or
flaky test with its error, the keyword path to the failing step and its screenshot. It reads the data embedded
in the HTML report's `index.html`, so it works on a report downloaded from CI too. `--all` also lists the
passed tests, and `--extract DIR` writes the report's JSON files. Each failure also has an `error-context.md`
with the page's accessibility snapshot, next to its screenshot.

**Backend errors:** while a test runs, `lib/backend-errors.ts` watches its page loads, scripts and API calls to the
test environment's services (`*.test.hel.ninja`, except Sentry). It adds a "backend error" annotation to the
attempt, with the time, for each 5xx response, script that didn't load (a 4xx too), failed request, request that
took 10 s or more, GraphQL response with errors, error page of the apps ("503: Palaamme pian!" comes with status 200)
and uncaught error in a page. When the test fails, it also adds each request that has had no answer for 5 s, and
each open page that shows an error page (the customer app can render one in the browser) or no text at all (a page
whose scripts didn't load or run). The HTML report shows them at the top of the attempt, and
`report_summary.py` under it. They show whether a flaky test met a backend failure, and when. URLs are shown without
their query strings, and no headers or request bodies are recorded. Cancelled requests are left out, as are the
access control errors that WebKit reports for fetches a navigation cancels. A request that a page load or reload
ended counts as unanswered only if it had waited 5 s by then, because the browser doesn't always report such requests
as cancelled.

## Differences from the Robot suite

Converted from [tilavarauspalvelu-robot](https://github.com/City-of-Helsinki/tilavarauspalvelu-robot) (commit
`dc72ec3`), which it replaced. The tests, tags and keywords keep their Robot names, and the tests call the same
keywords in the same order.

- **Keywords** are page object methods titled with the Robot keyword's name (`@step`). Library keywords are
  Playwright's locators, actions and `expect`, or plain TypeScript.
- **Variables** are constants, the users and units come from `testData`, and Set Test Variable values are fields of
  `state`. Robot's `--variable` settings are environment variables.
- **Parallel runs:** pabot processes are Playwright workers, and PabotLib's locks are files under `.shared-state/`.
  A failed test is retried once instead of rerun at the end.
- **Waiting:** Playwright's auto-waiting, `expect` and `waitForURL` replace most sleeps. The `create_data` project
  (Robot's Suite Setup) waits for the new data instead of sleeping 3 minutes.
- **Independent tests:** "Check emails from reservations" makes its own paid booking instead of using another test's.
- **Fixed in the port:** the quick reservation slot pick and booked-slot check, and the My bookings tab clicks.
- **Reports:** the HTML report's keyword steps match Robot's log, and Playwright takes the failure screenshots and
  videos.
