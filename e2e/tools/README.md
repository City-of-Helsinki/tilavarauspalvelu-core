# e2e tools

| File                | What it does                                              |
| ------------------- | --------------------------------------------------------- |
| `report_summary.py` | Summarizes a Playwright HTML report (see the main README) |

## Differences from the Robot suite

The suite was converted from the Robot Framework suite in
[tilavarauspalvelu-robot](https://github.com/City-of-Helsinki/tilavarauspalvelu-robot) (commit `dc72ec3`), which it
has replaced. The tests, tags and keywords have the same names as there.

- **Parallel runs:** pabot processes are Playwright workers, and PabotLib's lock server is the files under
  `.pabot-shared/`. Locks behave like pabot 5.1.0's. pabot's value sets are gone: the `testData` fixture
  (`TestSuites/fixtures.ts`) reads each test's users from `pabot_users.dat` by its data set tag, and the workers no
  longer take turns for their first navigation.
- **Rerun of failed tests:** `retries: 1` instead of the rerun at the end of the run. A skipped test still fails
  the run.
- **Independent tests:** "Check emails from reservations" makes, pays and cancels a paid booking of its own and
  checks its emails, instead of waiting for "User can make paid single booking" and checking that test's emails. The
  emails are checked for the same unit and terms. The tests store no data for each other (PabotLib's parallel values
  and `parallel_test_data`'s keywords are gone).
- **My bookings tabs:** the tab is focused before the click and checked to be selected (`mybookings`). The same
  plain click is in the Robot suite.
- **Quick reservation slots** (`quick_reservation`): the slot pick skips slots that start within 30 minutes, so a
  booking hasn't started by the time the test cancels it. The check that a booked time is gone waits until the slot
  disappears instead of sleeping 2 seconds. The reload before a pick waits for the new page's reservations query, not
  the replaced page's. The Robot suite has the same three issues.
- **Browsers:** the browser and device of each suite are the project's `use` options in `playwright.config.ts`. The
  "Set Up … And Open Url" keywords open Playwright's page instead of New Browser, New Context and New Page, without
  the Chrome arguments (`devices`). The staggered startup is the `staggeredStart` fixture (`TestSuites/fixtures.ts`):
  the run's first test in each parallel slot waits 3 s times the slot's number.
- **Waiting:** Playwright waits for elements, texts and URLs (actions' auto-waiting, `expect`, `waitForURL`) instead
  of `Sleep`, checks that read the page once, and Wait Until Keyword Succeeds loops.
- **Suite Setup** `Run Only Once    create_data.Create Robot Test Data` is the `create_data` project. It waits until
  the new data has been saved (the always free unit has a new id) instead of sleeping 3 minutes.
- **Settings** that were Robot variables (`--variable NAME:value`) are environment variables.
- **Time zone:** the config sets `TZ=Europe/Helsinki`, which the Robot Docker image did.
- **Reports:** the HTML report's keyword steps match Robot's log. Playwright takes the failure screenshots and video
  instead of `Complete Test Teardown`.
