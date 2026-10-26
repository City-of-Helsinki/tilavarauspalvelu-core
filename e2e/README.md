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
time**. The endpoint also rejects a second call within 60 seconds.

Runs need `TZ=Europe/Helsinki`: the config sets it when it is unset.

### Settings

Environment variables:

- `WORKERS` (default 5) and `RETRIES` (default 1).
- `FORCE_SINGLE_USER=True`: all tests use the same shared users. Use it with one worker, like `pnpm test:sequential`.
- `ENABLE_HAR_RECORDING=True`: writes HAR files to `output/har_files/`.
- `PW_TRACE=on`: writes traces to the test's results folder (`test-results/<test>/trace-*.zip`, open with
  `pnpm exec playwright show-trace <file>`), not to the HTML report. It is ignored when `CI` is set.

Both files are written when the browser closes. Use them for local debugging only, and don't upload them as CI
artifacts. Other environment variables don't change the suite's variables, even with the same name (like `BROWSER`).

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

- `TestSuites/Tests_*.spec.ts`: the suites, one file per project.
- `TestSuites/PO/{Admin,App,Common,User}/`: page objects. The tests call the workflow keywords in
  `PO/App/app_user.ts`, `app_admin.ts` and `app_common.ts`.
- `TestSuites/Resources/`: shared keywords (`custom_keywords`, `devices` for the browsers and devices,
  `common_setups_teardowns`, `parallel_test_data`, `create_data`, `graphql_commands`, `data_modification`, …),
  variables and texts (`variables`, `texts_FI`, `suite_specific_units`, `serial_users`), the test users in
  `pabot_users.dat`, and `env_loader.ts`, which loads the secrets.
- `lib/`: the runtime. `robot.ts` has `keywords()`, the variables `V` and the `test` fixture. The keyword
  libraries are `Browser` (page actions), `BuiltIn` (logging, assertions, retries), `String`, `Collections`,
  `DateTime`, `OperatingSystem`, `RequestsLibrary` (HTTP) and `PabotLib` (locks and shared values between workers).
- `tools/`: the checks and the report reader described below. See `tools/README.md` for the rest.

Most files in `TestSuites/` are generated. Change them through the generator or an override, as described in
`tools/README.md`, not by editing the files.

### Keywords, variables and tags

- A keyword is called by its name: `await app_common["User Logs In With Suomi Fi"]()`. Each call is a step named
  `app_common.User Logs In With Suomi Fi` in the HTML report, so the report shows the tree of keywords a test ran.
- Library keywords work the same way: `await Browser["Click"]("id=login")`. Named arguments go in a trailing
  `named()`: `named({ timeout: "10s" })`.
- Variables are properties of `V`, e.g. `V.CURRENT_USER_HETU`. They are reset before each test.
- Tags choose the test data. A data set tag like `@desktop-test-data-set-0` picks a user from the section with the
  same tag in `pabot_users.dat`. A suite tag (`@desktop-suite`, `@admin-suite`, `@combined-suite`,
  `@android-suite`, `@iphone-suite`) picks the units. `Complete Test Setup From Tags` reads them. Without a matching
  data set, the test uses the shared users in `serial_users.ts`.

## How it works

- **Parallel runs:** the workers share locks, values and test users through files in a folder of each run's own
  under `.pabot-shared/`, so a run (or `pnpm selftest`) never touches another run's state. Folders of runs started
  over a day ago are removed when a run starts. A worker can take a lock it already holds, and releasing a lock it
  doesn't hold fails. Locks a test still holds are released when it ends, and a lock left by a worker that stopped
  is taken over.
- **Retries:** a failed test is retried once. A skipped test fails the run (`lib/skips-fail-run-reporter.ts`).
  "Check emails from reservations" needs "User can make paid single booking": it waits for that test, also for its
  retry, and is skipped when that test fails.
- **My bookings tabs:** `mybookings.Navigate To Cancelled/Past/Upcoming Bookings` focus the tab before clicking it
  and check that it got selected. The HDS tab list slides when a tab gets focus, and on mobile WebKit the slide could
  make a plain click miss.
- **Browsers:** each test launches its own browsers, and every browser it leaves open is closed after it.
- **Reports:** the HTML report shows the keyword steps of each test, and `test-results/junit.xml` is for CI
  summaries. `Complete Test Teardown` attaches a screenshot when a test fails.

## Checks without the test environment

```bash
pnpm lint      # oxlint with type checking, with the frontend's rules
pnpm parity    # names and keyword flows match tools/naming-manifest.json
pnpm selftest  # the runtime and the keywords that need no test environment, against local data: pages
```

`pnpm parity` checks the names of the suites, tests, tags, keywords, keyword arguments and variables. It also checks
the flow of every test and keyword:

- the keyword calls in order
- the variables each call's arguments use
- every variable a test or keyword sets for the rest of the test

## Reading a run's results

`python3 tools/report_summary.py [playwright-report]` prints the run's totals and warnings, and each failed or
flaky test with its error, the keyword path to the failing step and its screenshot. It reads the data embedded
in the HTML report's `index.html`, so it works on a report downloaded from CI too. `--all` also lists the
passed tests, and `--extract DIR` writes the report's JSON files. Each failure also has an `error-context.md`
with the page's accessibility snapshot, next to its screenshot.
