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
pnpm exec playwright install --with-deps chromium firefox webkit
pnpm test:all               # all 35 tests: pnpm test, then pnpm test:notifications
pnpm test                   # all suites in parallel, creates the test data first
pnpm test:notifications     # the notification suite, serially (it has no data setup)
pnpm test:smoke             # tests tagged smoke
pnpm test:sequential        # one worker, all tests share the same users
pnpm report                 # opens the HTML report
```

`pnpm test:all` runs the notifications after the parallel suites, because they change the banners of the shared
environment. It keeps both reports: the parallel run in `playwright-report/` and `test-results/`, the notifications
in `playwright-report/notifications/` and `test-results/notifications/`. It fails if either run fails.

One suite: `pnpm exec playwright test --project Tests_user_desktop_FI`. One test:
`... --project Tests_user_desktop_FI -g "User logs in and out with suomi_fi"`.

The test data is created once per run by the `create_data` project, which the suites depend on. It deletes and
recreates everything under unit Harakka, so **never run two test runs against the test environment at the same
time**. The endpoint also rejects a second call within 60 seconds. The backend creates the data in one transaction,
and pages fail or hang until it has been saved, so the project waits (up to 5 minutes) until the always free unit
has a new id. If the id can't be read before the call, it waits 3 minutes like the Robot suite.

Runs need `TZ=Europe/Helsinki`: the config sets it when it is unset.

### Settings

Environment variables:

- `WORKERS` (default 5) and `RETRIES` (default 1).
- `FORCE_SINGLE_USER=True`: all tests use the same shared users. Use it with one worker, like `pnpm test:sequential`.
- `ENABLE_HAR_RECORDING=True`: writes a HAR file of each browser context into the test's results folder
  (`test-results/<test>/context*.har`).
- `PW_TRACE=on` (or another Playwright trace mode, like `retain-on-failure`): records Playwright traces, which the
  HTML report shows. It is ignored when `CI` is set.

Use HAR files and traces for local debugging only, and don't upload them as CI artifacts. Other environment
variables don't change the suite's variables, even with the same name (like `BROWSER`).

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

Two more projects: `create_data` (`TestSuites/create_data.setup.ts`) creates the test data, and `selftest` checks
the runtime offline.

## Layout

- `TestSuites/Tests_*.spec.ts`: the suites, one file per project. They use the `test` of `TestSuites/fixtures.ts`.
- `TestSuites/PO/{Admin,App,Common,User}/`: page objects. The tests call the workflow keywords in
  `PO/App/app_user.ts`, `app_admin.ts` and `app_common.ts`.
- `TestSuites/Resources/`: shared keywords (`custom_keywords`, `devices` for the browsers and devices,
  `common_setups_teardowns`, `parallel_test_data`, `create_data`, `graphql_commands`, `data_modification`, …),
  variables and texts (`variables`, `texts_FI`, `suite_specific_units`, `serial_users`), the test users in
  `pabot_users.dat`, and `env_loader.ts`, which loads the secrets.
- `lib/`: the runtime. `robot.ts` has `keywords()`, the variables `V` and the `test` fixture. The keyword
  libraries are `Browser` (page actions), `BuiltIn` (logging, assertions, retries), `String`, `Collections`,
  `DateTime`, `OperatingSystem`, `RequestsLibrary` (HTTP) and `PabotLib` (locks and shared values between workers).
- `tools/`: the report reader described below. `tools/README.md` lists how the suite differs from the Robot suite it
  was converted from.

### Keywords, variables and tags

- A keyword is called by its name: `await app_common["User Logs In With Suomi Fi"]()`. Each call is a step named
  `app_common.User Logs In With Suomi Fi` in the HTML report, so the report shows the tree of keywords a test ran.
- Library keywords work the same way: `await Browser["Click"]("id=login")`. Named arguments go in a trailing
  `named()`: `named({ timeout: "10s" })`.
- Variables are properties of `V`, e.g. `V.CURRENT_USER_HETU`. They are reset before each test.
  `TestSuites/variable-types.ts` gives them their types, so a misspelled name fails `pnpm lint`. The variable files
  are typed by their values. A variable that a keyword sets while a test runs goes in `RuntimeVariables` there, or in
  `UntypedRuntimeVariables` when its value comes from the page or an untyped keyword.
- Keyword parameters have a type (`string`) where every caller passes a value of that type. The others are
  `RobotValue` (any value), like the values that library keywords return. `str()` formats a value the way Robot
  prints it (`None`, `True`, Python lists), so it stays wherever a value may not be a string.
- Tags choose the test data, through the `testData` fixture in `TestSuites/fixtures.ts`, before the test starts.
  A data set tag like `@desktop-test-data-set-0` picks the users from the section with the same tag in
  `pabot_users.dat`, and only one test at a time uses a data set. A data set tag that `pabot_users.dat` doesn't have
  fails the test. A suite tag (`@desktop-suite`, `@admin-suite`, `@combined-suite`, `@android-suite`,
  `@iphone-suite`) picks the units. In sequential mode, and in tests without a data set tag, the tests use the shared
  users in `serial_users.ts`. The fixture sets the variables the keywords read (`V.CURRENT_USER_HETU`, …), and
  `Complete Test Setup From Tags` logs the users it chose.

## How it works

- **Parallel runs:** the tests don't depend on each other, and they share only locks: files in a folder of each run's
  own under `.pabot-shared/`, so a run (or `pnpm selftest`) never touches another run's state. The locks keep a data
  set's users and a unit's free times to one test at a time. Folders of runs started over a day ago are removed when
  a run starts. A worker can take a lock it already holds, and releasing a lock it doesn't hold fails. Locks a test
  still holds are released when it ends, and a lock left by a worker that stopped is taken over. The first tests
  start 3 seconds apart (the `staggeredStart` fixture, which marks each slot's first test in the same folder),
  because Suomi.fi logins that end at the same moment can fail.
- **Retries:** a failed test is retried once. A skipped test fails the run (`lib/skips-fail-run-reporter.ts`).
- **Emails:** "Check emails from reservations" makes, pays and cancels a paid booking of its own, then checks the
  confirmation and cancellation emails of that booking in the backend's robot email cache. The backend sends emails
  from a background task, so the check polls the cache for up to 2 minutes.
- **My bookings tabs:** `mybookings.Navigate To Cancelled/Past/Upcoming Bookings` focus the tab before clicking it
  and check that it got selected. The HDS tab list slides when a tab gets focus, and on mobile WebKit the slide could
  make a plain click miss.
- **Browsers:** each project's browser and device are in its `use` options in `playwright.config.ts`: Chromium at
  1440×900 on desktop, Pixel 5 and iPhone 14 on mobile. Playwright starts one browser per worker and gives each test
  a new context and page, which the "Set Up … And Open Url" keywords in `devices` open. A second one in a test opens
  a new context, a session of its own; the permission tests open Django admin in Firefox. Whatever a test opens
  itself is closed after it.
- **Waiting:** keywords wait for what they need: actions wait for their element, checks use Playwright's `expect`,
  and navigations wait for the new URL (`waitForURL`). A logout waits for the app's `/auth/logout/` redirect, which
  comes after the session is destroyed. After a pick from an HDS Select, `Close Select List If Open` closes a list
  that stayed open (HDS ignores a close within 200 ms of opening). Fixed sleeps are left only where nothing on the
  page tells when to go on: the pause between login click retries, a second after the empty booking form's submit,
  and a second for banners before a "no banner" check. The config's `baseURL` is the test environment, so Playwright
  code can open pages with `page.goto("/…")`.
- **Reports:** the HTML report shows the keyword steps of each test, and `test-results/junit.xml` is for CI
  summaries. A failed test has a full-page screenshot of each open page and a video of its own page.

## Checks without the test environment

```bash
pnpm lint      # oxlint with type checking, with the frontend's rules
pnpm selftest  # the runtime and the keywords that need no test environment, against local pages
```

## Reading a run's results

`python3 tools/report_summary.py [playwright-report]` prints the run's totals and warnings, and each failed or
flaky test with its error, the keyword path to the failing step and its screenshot. It reads the data embedded
in the HTML report's `index.html`, so it works on a report downloaded from CI too. `--all` also lists the
passed tests, and `--extract DIR` writes the report's JSON files. Each failure also has an `error-context.md`
with the page's accessibility snapshot, next to its screenshot.
