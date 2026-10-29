# e2e tools

| File                        | What it does                                                                                  |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| `naming-manifest.json`      | The names of the Robot suite this one was converted from: suites, tests, tags, keywords, etc. |
| `naming-parity-reporter.ts` | `pnpm parity`: checks the suite's names against the manifest                                  |
| `report_summary.py`         | Summarizes a Playwright HTML report (see the main README)                                     |

## Copying a fix from the Robot suite

The suite was converted line by line from the Robot Framework suite in
[tilavarauspalvelu-robot](https://github.com/City-of-Helsinki/tilavarauspalvelu-robot) (commit `dc72ec3`, recorded
in the manifest), and is edited by hand since. While the Robot suite is still in use, a fix there is copied over by
hand: find the keyword with the same name, and make the same change in Playwright terms. If the fix renames a test,
tag, keyword, argument or variable, rename it here too and update `naming-manifest.json`, then run `pnpm parity`.

Keywords that the port replaced were removed, with their manifest entries: the HAR recording keywords of
`har_recording.robot` (HAR recording is the `contextOptions` fixture in `lib/robot.ts`), the polling helpers that
Playwright's waits replaced (`Url Should Have Changed`, `Url Should Start With` and the two `… Landing Page H1 Should
Contain`), `Teardown Browser With HAR Finalization`, `Create Robot Test Data DISABLED`, and copies of
`Admin Verifies Notification Is Not Found` and `User Clicks The Specific Terms Of Use Checkbox` in modules that don't
use them. Keywords that no test calls yet are kept. If a Robot fix starts using a removed keyword, add it back here and
to the manifest.

## Names

Every Robot name is kept, and `pnpm parity` checks it:

| Robot                                                             | TypeScript                                                                                                            |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `Tests_user_desktop_FI.robot`                                     | `TestSuites/Tests_user_desktop_FI.spec.ts`, project `Tests_user_desktop_FI`, `test.describe("Tests user desktop FI")` |
| `PO/App/app_common.robot`                                         | `TestSuites/PO/App/app_common.ts`, exporting `app_common`                                                             |
| keyword `User Logs In With Suomi Fi`                              | `app_common["User Logs In With Suomi Fi"]()`, report step `app_common.User Logs In With Suomi Fi`                     |
| argument `${input_hetu}`, `${Expected text}`                      | parameter `input_hetu`, `Expected_text` (Robot treats spaces and underscores alike)                                   |
| variable `${CURRENT_USER_HETU}`                                   | `V.CURRENT_USER_HETU`                                                                                                 |
| tag `desktop-test-data-set-0`                                     | `@desktop-test-data-set-0` (Playwright tags need the `@`)                                                             |
| `python_keywords.py`, `robot_email_test_tool.py`, `env_loader.py` | `.ts` files with the same function names                                                                              |
| `pabot_users.dat`                                                 | the same file, read by the `testData` fixture                                                                         |

The libraries in `lib/` have the keyword names of the Robot libraries the suite used: robotframework-browser 19.12
(which is Playwright underneath, so the selectors are unchanged), BuiltIn, String, Collections, DateTime,
OperatingSystem, RequestsLibrary and pabot 5.1.0's PabotLib.

## Differences from the Robot suite

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
