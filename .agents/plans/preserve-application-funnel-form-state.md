# Preserve form state in the application funnel

## Problem

The seasonal application funnel has four pages under
`frontend/apps/customer/src/pages/applications/[id]/`.
Each page has its own `useForm`. Each page gets its default values from the
server in `getServerSideProps`. The form saves only on "Next".

The user can leave a page in three ways without a save:

- The "Prev" button on page 2 (`components/application/funnel/Page2.tsx`) and page 3.
- A click on a step in `ApplicationStepper.tsx`.
- The browser back button.

In all three cases the unsaved changes on the current page are lost.
There is no warning. The user goes back to page 1 to check an answer,
comes back, and must enter page 2 or page 3 again.

## Real fix (recommended first)

The user goes back because the later pages do not show what they put on page 1.
Show those answers on the later pages. Then most users do not need to go back.

- Page 2: show the page 1 data of each application section above its time picker.
  `ApplicationSectionSummary.tsx` already shows this data on page 1. Reuse it.
  Add the missing fields to `APPLICATION_PAGE2_QUERY` if needed.
- Page 3: no change needed. Page 3 does not depend on page 1 answers.
- Page 4 already shows all data.

This is a small change with no new state. Do it even if we also do the steps below.

## Preserve state (if we still need it)

### Option A. Draft in `sessionStorage` (recommended)

Keep a copy of the unsaved form values per tab.

1. Add a hook `useFunnelDraft(form, applicationPk, page)` in
   `components/application/funnel/`.
2. Key: `application-draft:{pk}:{page}`.
   Store `{ values, savedAt }`, where `savedAt` is the `updatedAt` of the
   application that the server returned. Add `updatedAt` to the `ApplicationForm`
   fragment if it is not there.
3. On change: `watch` the form and write the values to `sessionStorage`.
   Write only when `formState.isDirty` is true. A short debounce is enough.
4. On mount: read the draft. Use it only when `savedAt` equals the current
   `updatedAt`. If the application changed on the server, discard the draft.
   Apply it with `form.reset(values, { keepDefaultValues: true })`
   so `isDirty` stays correct.
5. On a successful save in `saveAndNavigate` / `onSubmit`: remove the draft for
   that page. Also remove all drafts of the application after "Send" on page 4.
6. Wrap every read and write in `try/catch`. If storage fails, the page works as now.
7. Parse the stored values with the page schema in a non-strict way
   (`safeParse` on shape only, or a plain type guard). If it does not match,
   discard it. This protects against old drafts after a deploy that changes the form.

Why `sessionStorage` and not `localStorage`:
the data stays in one tab and goes away when the tab closes.
Page 3 holds personal data (name, address, phone, email). We do not want it
to stay in the browser after the session. Also clear all `application-draft:*`
keys on logout.

Page 2 detail: the form has a list of sections keyed by `pk`.
If the user changes the sections on page 1 and saves, `updatedAt` changes,
so the page 2 draft is discarded. This is the correct result.

### Option B. Warn before losing changes (cheap fallback)

If we do not do option A, add a guard when the form is dirty:

- `beforeunload` for reload and tab close.
- `router.events.on("routeChangeStart")` for "Prev", the stepper and browser back.
  Show a confirm. Throw to cancel the route change (the known Next.js pages router pattern).

This does not keep the data, but the user does not lose it by accident.
It can be combined with option A for the reload case only if we choose not to
restore drafts after reload.

### Rejected options

- **Save on back navigation.** Pages 2 and 3 can be invalid when the user leaves.
  `updateApplication` would need to accept partial data, and the stepper state
  in `calculateAvailableStep` would change. More backend work and a risk of a
  half filled application on the server.
- **One shared form for all pages in a React context.** A big refactor of four
  pages. It still loses data on reload. Not worth it for this problem.

## Tests

- Unit tests for `useFunnelDraft`: write, restore, discard on `updatedAt`
  mismatch, discard on bad shape, clear on save, works when storage throws.
- Page 2 test: change a time, go back, come back, the change is still there.
- Page 2 test: the page 1 summary shows for each section.

## Order of work

1. Page 1 summary on page 2 (real fix).
2. Option A draft hook on page 2 and page 3.
3. Clear drafts on send and on logout.
4. Option B only if A is not done.
