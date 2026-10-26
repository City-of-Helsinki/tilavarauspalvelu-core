# e2e tools

The suite in `TestSuites/` is generated from the Robot Framework suite in
[tilavarauspalvelu-robot](https://github.com/City-of-Helsinki/tilavarauspalvelu-robot), and these tools keep the
two in step while the Robot suite is still in use.

| File                                        | What it does                                                                                          |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `robot_parse.py`                            | Parses the `.robot` files (the syntax subset the suite uses)                                          |
| `robot_inventory.py`, `robot_flows.py`      | Write `naming-manifest.json`: every suite, test, tag, keyword, argument, variable and flow            |
| `robot_to_ts.py`, `python_expressions.py`   | Generate `TestSuites/**/*.ts` and `TestSuites/Tests_*.spec.ts`                                        |
| `overrides/<module>/<keyword>.ts-fragment`  | Hand-written keywords that the generator uses instead of translating                                  |
| `translation-report.json`                   | Anything the generator couldn't translate (empty now)                                                 |
| `naming-parity-reporter.ts`, `flow-scan.ts` | `pnpm parity`: compares the TypeScript with the manifest                                              |
| `parity_mutation_check.py`                  | Checks that parity and lint still catch deliberate drifts (on a temporary copy)                       |
| `robot_parser_crosscheck.py`                | Checks that `robot_parse.py` reads the `.robot` files like Robot does (needs `robotframework==7.3.2`) |
| `report_summary.py`                         | Summarizes a Playwright HTML report (see the main README)                                             |

## Regenerating

A change in the Robot suite is mirrored by regenerating:

```bash
python3 tools/robot_inventory.py ../../tilavarauspalvelu-robot   # naming manifest
python3 tools/robot_to_ts.py ../../tilavarauspalvelu-robot       # TestSuites/*.ts
pnpm format && pnpm lint && pnpm parity
```

The generator translates the Robot syntax line by line, keeping comments and documentation. Python expressions
(`IF`, `Evaluate`, `Should Be True`) go through `python_expressions.py`, which translates the ones it can't handle
generically from a hand-written table. A keyword whose TypeScript differs on purpose is in
`overrides/<module>/<keyword>.ts-fragment`; each difference has a `// Port:` comment. These files are hand-written
and not generated: `TestSuites/Resources/{env_loader,python_keywords,robot_email_test_tool}.ts` and
`TestSuites/create_data.setup.ts`.

After changing the generator or the parity check, run `python3 tools/parity_mutation_check.py`, and after changing
the parser, `python3 tools/robot_parser_crosscheck.py ../../tilavarauspalvelu-robot`.

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
| `pabot_users.dat`                                                 | the same file, unchanged                                                                                              |

The libraries in `lib/` have the keyword names and semantics of the Robot libraries the suite used:
robotframework-browser 19.12 (which is Playwright underneath, so the selectors are unchanged), BuiltIn, String,
Collections, DateTime, OperatingSystem, RequestsLibrary and pabot 5.1.0's PabotLib.

## Differences from the Robot suite

- **Parallel runs:** pabot processes are Playwright workers, and PabotLib's lock server is the files under
  `.pabot-shared/`. Locks behave like pabot 5.1.0's.
- **Rerun of failed tests:** `retries: 1` instead of the rerun at the end of the run. A skipped test still fails
  the run. "Check emails from reservations" waits for a retry of "User can make paid single booking" instead of
  skipping (`overrides/parallel_test_data/`).
- **My bookings tabs:** the tab is focused before the click and checked to be selected (`overrides/mybookings/`).
  The same plain click is in the Robot suite.
- **Suite Setup** `Run Only Once    create_data.Create Robot Test Data` is the `create_data` project.
- **Settings** that were Robot variables (`--variable NAME:value`) are environment variables.
- **Time zone:** the config sets `TZ=Europe/Helsinki`, which the Robot Docker image did.
- **Reports:** the HTML report's keyword steps match Robot's log, and failure screenshots are attached by
  `Complete Test Teardown` as in Robot.
