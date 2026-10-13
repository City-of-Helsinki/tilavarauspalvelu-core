# Frontend fix plan

Date: 2026-10-12. Source: a read-only review of `frontend/` (customer, staff, `packages/ui`, build and tooling).

## Scope

These branches are in progress. Merge them first. This plan does not touch their files.

- `fix-apollo-cache-issues` and `refactor-staff-ssr-cache-hydration`. Apollo client, cache, SSR hydration, `_app.tsx`, pagination, `useSession`, `useFilterOptions`, `useHandling`.
- `frontend-sentry-changes`. Sentry config, `env.mjs`, instrumentation, proxy and middleware, `_document`, Dockerfile runtime env.

Paths below are relative to `frontend/`. Line numbers are from the review date and can drift.

Effort: S is less than half a day. M is one or two days. L is more.

## Order

1. PR 1. Run `ui` tests in CI and fix tooling. Done on branch `frontend-tooling-fixes`.
2. PR 2. Customer payment flow.
3. PR 3. Staff reservation handling.
4. PR 4. Personal data in Sentry.
5. PR 5. Date and time model. The frontend pods run in UTC (confirmed for dev and test), so this bug is live. Do the `ENV TZ` fix first. It only needs the Sentry branch and `remove-turborepo` merged, because both change the Dockerfile.
6. PR 6. Accessibility.
7. PR 7. Customer login flow.
8. PR 8. Small fixes and dead code.
9. After the Apollo merge. Two refetch fixes.

## PR 1. Run `ui` tests in CI and fix tooling (S)

Do this first. It protects PR 5.

Status: done on branch `frontend-tooling-fixes`, not pushed yet. Review it, then push and open the PR.

The branch starts from `remove-turborepo`, which replaces turbo with `pnpm -r`. These commits are cherry-picked on top:

- `a25437c2e` from `fix-pin-pnpm-when-using-just-codegen`. It makes the root `just codegen` call the frontend recipe.
- `48078c31f` ("Remove nextjs generating AGENT.md"). It sets `agentRules: false` in both `next.config.ts` files.

- [x] **The `ui` tests do not run in CI.** CI runs `pnpm --filter=staff... test:coverage`. `packages/ui` has no `test:coverage` script, so pnpm skips it. Fix: a new CI job `test-ui-package` runs `pnpm --filter=ui test`. A coverage script would need a coverage provider in `ui`, and nothing uploads `ui` coverage.
- [x] **Remove the `tsc` commands.** `lint` already type checks with `--type-check`.
  - The `justfile` recipes `tsc-check` and `tsc-clean` are removed.
  - The staff scripts `tsc:check` and `tsc:clean` are removed.
  - The README linting section is updated. It now lists oxlint, oxfmt and stylelint, and the hooks.
  - The `justfile` recipes `lint` and `lint-fix` now pass `--type-check`, like `pnpm lint`. Before, `just lint` did not type check.
- [x] **Remove the browser test commands.** Their targets do not exist. CI and the docs do not use them.
  - The `justfile` recipes `test-browser-ci` and `dev-test` are removed.
  - The root `package.json` scripts `test:browser:ci` and `dev:test` are removed.
- [x] **`just format-staged` used prettier.** It now uses `oxfmt --no-error-on-unmatched-pattern`.
- [x] **`pnpm codegen` needed GNU parallel.** It is not always installed, and the post-checkout hook calls this script. The script now uses a pnpm script regex: `pnpm run "/^codegen:(staff|customer|ui)$/"`. It still runs the three projects in parallel. The README no longer mentions GNU parallel.
- [ ] **Stray `apps/customer/CLAUDE.md`.** It contains only `@AGENTS.md`, and that file does not exist. Next.js generated it. It is not in git, because `.gitignore:50` ignores `CLAUDE.md`. The `48078c31f` cherry-pick stops Next.js from making new ones. Delete the existing local copy by hand once. Each developer with an old checkout must do the same.

### Husky hooks

- [x] **`.husky/pre-commit` changed files that were not staged.** It ran `pnpm lint:fix` on the whole frontend. The full scan is necessary, because `lint` does the type check, and the type check needs the whole project. But `--fix` on the whole codebase is not necessary.
  - The hook now runs `pnpm lint` (no `--fix`) on the whole frontend, then `pnpm exec lint-staged`.
  - `frontend/.lintstagedrc` runs `oxlint --fix --type-aware` and `pnpm format:staged` on the staged files. lint-staged keeps unstaged changes out of the commit.
  - Before, the hook ran `npx lint-staged`, but lint-staged was not a dependency. So npx downloaded an unpinned version at each commit, outside the lockfile and `minimumReleaseAge`. It is now a dev dependency (`^17.6.0`).
  - Seen on 2026-10-12. In a new worktree with no generated types, `lint:fix` failed. It also removed needed `as unknown as` and `as never` casts in 13 files. One of them was a source file: it dropped `Omit<MemoT, "pk">` in `apps/staff/src/hooks/useStaffReservationMutation.ts`.
- [x] **New `.husky/post-checkout` runs `pnpm install` and then `pnpm codegen`.** Without the generated types, lint fails and `--fix` makes wrong edits, as described above. After a branch switch, the types can also be out of date. `git worktree add` also runs post-checkout, so a new worktree gets `node_modules` and the types before its first commit.
  - It runs only on a branch checkout. Git gives the hook `$3 = 1` for a branch checkout and `$3 = 0` for a file checkout.
  - The install takes less than one second when nothing changed. Codegen takes about 16 seconds, so each branch switch takes about that long.
  - Codegen reads the committed `tilavaraus.graphql` (`graphql.config.ts:42`), so it does not need a running backend.
- [ ] **Hooks in worktrees.** On the review machine, `core.hooksPath` is the absolute path `/workspace/frontend/.husky/_`. So all worktrees run the hooks of the branch that is checked out in the main checkout. The new hooks take effect there only after this PR is merged or checked out. Check how husky is installed for other developers. There is no `prepare` script.

## PR 2. Customer payment flow (high, mostly S)

- [ ] **The reservation page gives a 500 for a pending handled payment. High.** The case is a Confirmed reservation with payment order Pending and `handledPaymentDueBy` set. `getPaymentUrl` calls `getCheckoutRedirectUrl` (`apps/customer/src/modules/reservation.ts:479`). That function throws when `window` is missing. It is called during SSR from `pages/reservations/[id]/index.tsx:224` and `lib/reservation/[id]/PaymentNotification.tsx:65`. Build the URL without `window`, or build it on the client only. Test with one real reservation in that state.
- [ ] **The payment banner shows during payment polling.** `components/InProgressReservationNotification.tsx:140` hides the banner on `/reservation/cancel` and `/success`. The real paths are `/callbacks/webstore/success` and `/callbacks/webstore/cancel`. The user sees "Pay" and "Cancel" for the same reservation while the payment is in progress.
- [ ] **The polling timeout toast never shows.** `pages/callbacks/webstore/success.tsx:108` redirects with `?notify=polling_timeout`. `pages/reservations/[id]/index.tsx:198` listens for the key `polling_timeout`.
- [ ] **Polling stops only on Paid.** `success.tsx:113-127`. A Cancelled or Denied reservation waits for the full timeout. Redirect on every terminal state.
- [ ] **Raw error text from the URL.** `pages/reservations/[id]/index.tsx:205-216` shows the `error_message` query param. The text is English only, and anyone can put their own text in it. Map `error_code` to i18n keys. Never render `error_message`.
- [ ] **Permanent series redirect.** `pages/reservations/[id]/index.tsx:437-456` uses `permanent: true` to a per-user URL. It can also redirect to `""` when the application pk is missing. Use `permanent: false`, and return `notFound` when the pk is null.
- [ ] **The access code area shows "contact support" while it loads and on error.** `pages/reservations/[id]/index.tsx:174-180, 382-405`. Use `loading` and `error` from the query.

## PR 3. Staff reservation handling (high, S to M)

- [ ] **A failed refund after a deny cannot be retried. High. M.** `apps/staff/src/components/DenyDialog.tsx:288-306`. The deny succeeds. Then the refund fails, the error toast shows, and the dialog closes. The reservation is Denied, so the deny button is hidden. No other UI calls `refundReservation`. Keep the dialog open and show "denied, but the refund failed". Add a refund retry for a Denied, paid reservation that has no refund. First, check whether Django admin already has a refund action.
- [ ] **The access code button can make new codes for a series with no confirmation. High.** `lib/reservations/[id]/ReservationKeylessEntrySection.tsx:318,329` checks `reservation.isAccessCodeIsActiveCorrect`. The mutation at lines 270-272 uses the series flag. Compute the flag once and use it in all three places.
- [ ] **The series preview uses the wrong after buffer.** `hooks/useMultipleReservation.tsx:35` reads `bufferTimeBefore` for the after buffer. Use `bufferTimeAfter`.
- [ ] **The edit time modal ignores the buffer toggles.** `components/EditTimeModal.tsx:163-164` calls `getBufferTime` with no `enabled` argument, so the collision check always uses 0. The submit at lines 180-181 sends buffers for the Blocked type too.
- [ ] **Approve dialog.** `lib/reservations/[id]/ApproveDialog.tsx:189, 217-221, 259`.
  - It accepts a negative price.
  - The "clear price" checkbox cannot be unchecked.
  - The buttons stay enabled while the mutation runs. The same gap is in `DenyDialog` and the access code button.
- [ ] **The access code "ended" check is wrong on the last day.** `ReservationKeylessEntrySection.tsx:309-310` uses `new Date(series.endDate)`, which is UTC midnight. The button is disabled from about 02:00 to 03:00 on the last day of the series. Use `parseApiDate` and compare with the end of that day.

## PR 4. Personal data in Sentry (S)

- [ ] `apps/staff/src/lib/application-rounds/[id]/allocation/hooks.ts:186` sends `JSON.stringify(applicationSection)` to `logError`.
- [ ] `apps/staff/src/pages/applications/[id]/index.tsx:235` does the same. It also runs on each render while `allocations` is null.
- [ ] The section objects contain contact person names and organisation names. Log only pks.

## PR 5. Date and time model (high, M)

Do this after the Sentry branch and `remove-turborepo` merge. Both change `frontend/Dockerfile`.

- [ ] **Date-only API values are one day off outside Helsinki.** `packages/ui/src/modules/date-utils/conversion.ts:27-29`. `parseApiDate` makes the instant of Helsinki midnight (commit `489f97260`, 2026-03-12, released since `v1.59`). For example, "2023-12-25" becomes `2023-12-24T22:00Z`. The consumers then use date-fns in the local time zone of the process: `formatDate`, `formatApiDate`, `setTimeOnDate` and `getDate`.
  - Result, checked in Node with date-fns-tz and date-fns:

    | Process `TZ` | `formatDate(parseApiDate("2023-12-25"))` | `fromApiDateTime("2023-12-25", "15:30")` |
    |---|---|---|
    | `Europe/Helsinki` | 25.12.2023 | 2023-12-25 15:30 Helsinki |
    | `UTC` | 24.12.2023 | 2023-12-24 15:30 UTC |
    | not set, `/etc/localtime` is `Etc/UTC` | 24.12.2023 | 2023-12-24 15:30 UTC |

  - The staff series edit page builds mutation times this way. See `apps/staff/src/pages/reservations/[id]/series/index.tsx:71-76` and `apps/staff/src/modules/reservation.ts:221`. This code runs in the browser, so it depends on the time zone of the browser, not of the pods.
- [ ] **The frontend pods run in UTC. Confirmed for dev and test.** On 2026-10-13, the dev and test clusters had no `TZ` set. Staging and production are not checked, but they are assumed to be the same. Check them with `oc exec <customer-pod> -- printenv TZ` and `oc exec <customer-pod> -- node -e "console.log(Intl.DateTimeFormat().resolvedOptions().timeZone)"`.
  - Cause: neither `Dockerfile` nor `Dockerfile.final` sets `TZ`. The runner stage is `node:24-slim` (Debian), where `/etc/localtime` points to `Etc/UTC`. No file in this repo sets `TZ` for the frontend at runtime. The only settings are `TZ=Europe/Helsinki` in the three `test` scripts. That is why the tests pass. The release pipelines (`apps/*/azure-pipelines-release.yml`) extend templates in the separate Azure DevOps repo `tilavarauspalvelu-pipelines`, so the pod env vars are set outside this repo.
  - The backend is not affected. Django sets the process `TZ` from `TIME_ZONE = "Europe/Helsinki"` (`backend/config/settings.py:329`). Node has no such setting.
  - Effect 1. The server HTML shows date-only values one day early. This affects 19 SSR pages that do date work, for example application round, pricing and reservation dates. In the pages router, all components on those pages render in Node first. React 19 renders the page again in the browser when text does not match. For users in Finland, the wrong date then shows only as a short flash, and each page load logs a hydration error. Users without JavaScript and crawlers keep the wrong date. React does not fix attributes that do not match, so a date in an attribute stays wrong. This was not checked.
  - Effect 2. `getServerSideProps` computes "today" with `formatApiDate(new Date())` in `apps/customer/src/pages/reservation-unit/[id]/index.tsx:479` and `apps/customer/src/pages/reservations/[id]/edit.tsx:142`. Between 00:00 and 02:00 or 03:00 Helsinki time, this gives yesterday. The query then asks for one more past day. This is harmless.
  - This has been live since `v1.59` (March 2026). To see how much it shows, search Sentry for hydration errors on customer pages with dates, for example React error #418 or "Hydration failed".
  - Fix: add `ENV TZ=Europe/Helsinki` to the runner stage of `frontend/Dockerfile`. Official Node builds include full time zone data, so the image does not need the `tzdata` package. This fixes the server side in all environments and matches the backend. It does not depend on the model choice below, so it can go first as a small separate PR.
  - If the pipeline templates or the Platta config set `TZ` later, they override the image. Check that they do not set it to UTC.
- [ ] **Choose one date model.** The `TZ` fix does not help browsers outside Finland, and the UTC test run below needs this. Parse date-only values as local midnight, or use `TZDate` and `formatInTimeZone` everywhere.
- [ ] Add a CI test run with `TZ=UTC`. All `test` scripts set `TZ=Europe/Helsinki`, so CI cannot see this bug today. Five date tests in `ui` fail in UTC. Add the run in this PR, after the fix. Added earlier, it would make CI fail until this PR lands. It can be a second step in the `test-ui-package` job from PR 1.
- [ ] **`formatTimeRange` drops a 00:00 end time.** `packages/ui/src/modules/date-utils/formatting.ts:224`. "20:00 to 00:00" shows as "20:00". Remove the workaround in `apps/customer/.../ReservationUnitMoreDetails.tsx:205`.
- [ ] **`timeForInput("15:30")` returns the current time.** `conversion.ts:110-123`. `new Date("15:30")` does not throw, so the HH:mm branch never runs.
- [ ] **`parseStringTimeStruct("abc:30")` gives 00:30.** `construction.ts:146-158`. The tests assert this, so update them too.

## PR 6. Accessibility (S each)

- [ ] **`packages/ui/src/components/Card.tsx:175,181`.** `tabIndex={1}` must be `-1`. Keyboard users tab through every unnamed image link on search results first. Also add `aria-hidden` to the image link.
- [ ] **`components/form/TimeInput.tsx:151-162`.**
  - `htmlFor={props.name}` points at no element.
  - The input has no `aria-invalid` or `aria-describedby`.
  - `pattern="[0-9]:*"` rejects "12:30".
- [ ] **`ApplicationTimeSelector.tsx:112,178`.** It has `role="option"` with no listbox, inside `role="table"` with no rows. Remove the roles and use `aria-pressed`.
- [ ] **`reservation-form/RadioButtonWithImage.tsx:76`.** It does not expose the checked state.
- [ ] **`components/TimeZoneNotification.tsx:7`.** It reads `Intl` time zone during render, so the hydration does not match. Wrap it in `ClientOnly`.

## PR 7. Customer login flow (M)

- [ ] **A single selected unit is lost after login.** `apps/customer/src/pages/recurring/[id]/index.tsx:195-199`. `selectedReservationUnits` can be a string, and `for...of` loops over its characters. Use `toArray`.
- [ ] **The browser history repeats the create.** `pages/reservation-unit/[id]/index.tsx:447-470` and `pages/recurring/[id]/index.tsx:178`. `isPostLogin=true` stays in the history. "Back" runs `createReservation` or `createApplication` again. A null `pk` redirects to `""`. Remove the param from the redirect target and handle a null pk.

## PR 8. Small fixes and dead code (S)

- [ ] **Customer:**
  - `InProgressReservationNotification.tsx:65`. `useTranslation(["notification, common"])` has a misplaced quote.
  - `pages/reservations/[id]/cancel.tsx:73`. An invalid id queries pk 0. Use `pk > 0`.
  - `pages/reservations/[id]/index.tsx:345`. The `cancel.application` branch is dead code.
- [ ] **Staff:**
  - `EditTimeModal.tsx:392-411` shows an empty "recurring" line for a single reservation.
  - `EditTimeModal.tsx:193`. `(!isDirty && !isValid)` should use `||`.
  - `hooks/useFilteredReservationList.tsx:129`. `&&` should be `||`. The NOTE at line 27 is wrong.
  - `ReservationTimeBlockSection.tsx:146`. The initial `focusDate` is set before the series loads.
- [ ] **Staff i18n:**
  - `pages/reservations/[id]/edit.tsx:168` uses a raw sentence as a key.
  - `lib/my-units/[id]/recurring/ReservationSeriesForm.tsx:63` has hardcoded text.
  - `EditTimeModal.tsx:301` should use `errors:unexpectedError`.
  - `ReservationSeriesForm.tsx:186,191` translates twice.
- [ ] **`ui`:**
  - `helpers.ts:418`. `charCount().tooLong` is always false, because `length` is `window.length`.
  - `number-formatters.ts:3-8`. The currency format shows "12,5 €". Use 0 or 2 decimals.
  - `hooks/useToastIfQueryParam.ts:63`. The toast can show twice when callers pass inline values.
- [ ] **Dead code:**
  - Staff `lib/my-units/[id]/recurring/utils.ts` `isOverlapping` is used only by its own test.
  - Unused `ui` exports: `formatDurationFromDates`, `dateForInput`, `parseCombinedUIDateTime`, `parseDateTimeStruct`, `getApplicationRoundStatus`, `AnchorLink`, `OPEN_HOURS_STATES`, `borderBoxSizing`, `CSP_HEADER`, `CreateReservationFormType`, and unused `transform*Unsafe` helpers.
- [ ] **Wrong comments:**
  - `applicationRoundAllocation.ts:220-224`.
  - `allocation/hooks.ts:204`. `force` does not skip the overlap checks.

## After the Apollo merge

- [ ] **The unit calendar does not refetch after a staff reservation is created.** `apps/staff/src/pages/my-units/[id]/index.tsx:104,163` and `lib/my-units/[id]/UnitCalendar.tsx:226,554`. `onComplete={refetch}` is declared but never called.
- [ ] **The staff reservation page refetches a lazy query that never ran.** `pages/reservations/[id]/index.tsx:347`. Check that the new data replaces the SSR prop.

## Questionable, needs a separate check

- `apps/staff/src/components/VisibleIfPermission.tsx:20` lets the owner see Approve and Deny without manage permission. When both users are null, `undefined === undefined` is true.
- Customer SSR pages do not catch GraphQL errors. Examples are `callbacks/webstore/success.tsx:36` and `reservations/[id]/index.tsx:428`. An expired session after payment gives a 500.
- There are two buffer collision versions. Customer `reservable.ts` `hasCollisions` and staff `useCheckCollisions` handle Blocked reservations differently. Check against the backend and keep one version in `ui`.
- `useCheckCollisions` queries only the start date. Buffers that cross midnight are not checked.
- The backend caps the staff start interval at 30 minutes. The schema does not.
- Series schemas:
  - A one-day series is not possible.
  - There is no three-year limit.
  - The latest end time is 23:45 (`packages/ui/src/schemas/schemaCommon.ts:355`).
- Series reschedule. `reservationsCount` (`series/index.tsx:287`) can subtract removed reservations that are no longer in the list.
- Staff "isFree" (`pages/reservations/[id]/index.tsx:280-282`) comes from unit pricing, not from `reservation.price`.
- `ApprovalButtonsRecurring` edit links go to the first deniable reservation, not the current one.
- `sanitizeConfig` allows `style` on all tags. Staff content can cover the page.
- `getTimeStringSchema` sets the issue path to `[""]`.
- `parseValidDateObject` uses `new Date()` for date-only values. This is not the same as `parseApiDate`.
- `getEventBuffers` and `getBuffersFromEvents` do the same job.
- Matomo:
  - Route changes do not call `setCustomUrl`.
  - `orderId`, `error_message`, `begin` and `end` are not in the excluded query params (`public/scripts/init-matomo.cjs`).
- `callbacks/webstore/cancel.tsx` deletes the reservation inside `getServerSideProps`. A prefetch or reload repeats it.
- `pages/sentry-example-page.tsx` and `pages/api/sentry-example-api.ts` can be reached in production. This can belong to the Sentry branch.
- Roarr writes GraphQL variables to the browser console when `ENABLE_CONSOLE_LOGGING` is set. Check that it is off in production.
- `removePi` (`packages/ui/src/modules/apollo/helpers.ts:462`) changes `operation.variables` in place. This is in the Apollo area.
- Receipt link: `${receiptUrl}&lang=` expects `receiptUrl` to already contain a query string.
- `ButtonLikeLink` has `role="button"` on links that navigate.
- The customer `pages/reservations/index.tsx:79` shows "not authenticated" while the user loads.
- The apps have 9 `react-hooks/exhaustive-deps` disables and 9 `set-state-in-effect` disables. A short pass can find more effect bugs.
- Two `eventStyleGetter` files have a TODO to merge them.
