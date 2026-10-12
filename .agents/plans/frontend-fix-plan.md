# Frontend fix plan

Date: 2026-10-12. Source: a read-only review of `frontend/` (customer, staff, `packages/ui`, build and tooling).

## Scope

These branches are in progress. Merge them first. This plan does not touch their files.

- `fix-apollo-cache-issues` and `refactor-staff-ssr-cache-hydration`. Apollo client, cache, SSR hydration, `_app.tsx`, pagination, `useSession`, `useFilterOptions`, `useHandling`.
- `frontend-sentry-changes`. Sentry config, `env.mjs`, instrumentation, proxy and middleware, `_document`, Dockerfile runtime env.

Paths below are relative to `frontend/`. Line numbers are from the review date and can drift.

Effort: S is less than half a day. M is one or two days. L is more.

## Order

1. PR 1. Run `ui` tests in CI and fix tooling.
2. PR 2. Customer payment flow.
3. PR 3. Staff reservation handling.
4. PR 4. Personal data in Sentry.
5. PR 5. Date and time model. Do this after the Sentry branch, because it touches the Dockerfile.
6. PR 6. Accessibility.
7. PR 7. Customer login flow.
8. PR 8. Small fixes and dead code.
9. After the Apollo merge. Two refetch fixes.

## PR 1. Run `ui` tests in CI and fix tooling (S)

Do this first. It protects PR 5.

- [ ] CI does not run the `packages/ui` tests (10 files, 291 tests). CI runs `pnpm --filter=staff... test:coverage`. `packages/ui/package.json` has no `test:coverage` script, so pnpm skips it. Add the script.
- [ ] Add a test run with `TZ=UTC`. Five date tests in `ui` fail in UTC today. See PR 5.
- [ ] `justfile`. `tsc-check` and `tsc-clean` call turbo tasks that are not in `turbo.json`.
- [ ] `justfile`. `format-staged` calls prettier and `packages/prettier-config`. Neither exists. The project uses oxfmt.
- [ ] `justfile`. `test-browser-ci` and `dev-test` call `customer` scripts that do not exist.
- [ ] Root `package.json`. `test:browser:ci` and `dev:test` use `apps/ui`, which does not exist.
- [ ] `apps/customer/CLAUDE.md` contains only `@AGENTS.md`. That file does not exist. Agent docs need user approval before an edit.

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

Do this after the Sentry branch merges. It touches the Dockerfile.

- [ ] **Date-only API values are one day off outside Helsinki.** `packages/ui/src/modules/date-utils/conversion.ts:27-29`. `parseApiDate` makes Helsinki midnight (commit 489f97260). The consumers then work in local time: `formatDate`, `formatApiDate`, `setTimeOnDate` and `getDate`. In a UTC runtime:
  - `fromApiDateTime("2023-12-25", "15:30")` returns Dec 24 15:30.
  - `formatDate(parseApiDate("2023-12-25"))` prints "24.12.2023".
  - The staff series edit page builds mutation times this way. See `apps/staff/src/pages/reservations/[id]/series/index.tsx:71-76` and `apps/staff/src/modules/reservation.ts:221`.
  - Customer pages render round and pricing dates during SSR this way.
- [ ] Neither `Dockerfile` nor `Dockerfile.final` sets `TZ`. `node:24-slim` defaults to UTC. Check what the OpenShift pods use. If it is UTC, this bug is live.
- [ ] Choose one model. Parse date-only values as local midnight, or use `TZDate` and `formatInTimeZone` everywhere. Set `TZ=Europe/Helsinki` in the runtime image.
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
- `.husky/pre-commit`:
  - It runs `pnpm lint:fix` on the whole frontend, which can change files you did not stage.
  - It runs `npx lint-staged`, but there is no lint-staged dependency or config.
- The apps have 9 `react-hooks/exhaustive-deps` disables and 9 `set-state-in-effect` disables. A short pass can find more effect bugs.
- Two `eventStyleGetter` files have a TODO to merge them.
