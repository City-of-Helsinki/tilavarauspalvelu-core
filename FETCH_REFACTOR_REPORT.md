# Frontend fetch refactor: report

This file is for the review only. Remove this commit before the merge.

## Original goals

The task had three problems:

1. Timeouts were not handled. No backend request had a timeout. Node.js fetch waits up to 300 seconds for the headers.
   The OpenShift router closes the connection first (default 30 seconds) and returns a 504.
   The user saw a gateway error, and our own error page and logging never ran.
2. There was no retry. A dropped connection during a deploy or a pod restart went straight to the user.
3. The error transform was too complex. `transformApolloError` used manual type checks, string matches
   (for example `"Received status code 400"` and `"Failed to fetch"`) and casts.
   It copied the idea of neverthrow without the type safety.

## Decisions from the user

- Put the timeouts in `packages/ui/src/modules/const.ts`, separate for the client and the server.
- The server timeout is 2 seconds. A server request should never take longer.
  After the review this applies to the middleware only. See "1. Timeouts".
- The client timeout is 30 seconds. Slow mutations run as background tasks that the client polls.
  The client value is configurable, because the gateway limit can be higher and a client can be slow.
- Upgrade Apollo Client only if the upgrade changes the implementation a lot. Then do it first.
  The upgrade changes the error handling a lot, so it comes before the error model and the retry.
- Use a chain of local branches. Do not open pull requests.

## Result: four commits

| Branch | Commit |
|---|---|
| `fetch-timeouts` | Add timeouts to the backend requests |
| `apollo-4-upgrade` | Upgrade Apollo Client to version 4 |
| `fetch-error-model` | Replace the query error transform with classifyError |
| `fetch-retry` | Retry the queries that fail with a transient error |

Each branch is one commit on top of the branch before it. Each commit passed the lint, the type check and all tests
before the rebase on the pricing changes. The production builds of both apps passed on `fetch-retry`.

Follow-up commits on `fetch-retry-fast-errors`, after the review:

| Commit | Note |
|---|---|
| Fix the Apollo Client 4 types in the pricing changes | Rebase fix. Squash it into the Apollo Client 4 commit. |
| Retry only the errors that fail fast | See "4. Retry". |
| Let the page continue when the middleware query fails | See "Middleware". |
| Fix the language prefix in the customer middleware URLs | A bug from before this work. |
| Keep the staff user when an other app query fails | See "Middleware". |
| Separate the server timeouts of the middleware, queries and mutations | See "1. Timeouts". |
| Show one toast when a mutation request fails | `displayError` skips the errors that the error link toasts. |
| Remove the user query from the staff middleware | See "Middleware". |

The Apollo Client 3 fixes from the rebase on the pricing changes are squashed into the Apollo Client 4 commit.

### 1. Timeouts

- Three server timeouts. They are constants and not configurable.
  - `MIDDLEWARE_FETCH_TIMEOUT_MS = 2000` for the proxy middleware. Its queries took less than 200 ms before.
  - `SERVER_QUERY_TIMEOUT_MS = 10_000` for SSR queries. This value is a guess. Check it against the SSR query times in Sentry.
  - `SERVER_MUTATION_TIMEOUT_MS = 20_000` for SSR mutations. The delete after a cancelled payment calls the webshop
    (15 second timeout in the backend), so this must be longer. `getOperationType` reads the type from the request body.
- `CLIENT_FETCH_TIMEOUT_MS = 30_000` for the browser. The runtime variable `CLIENT_FETCH_TIMEOUT_MS` overrides it.
  It is in `RuntimeSchema`, so the same image works in all environments. An invalid value uses the default
  and does not break the other runtime settings.
- `fetchWithTimeout` in `packages/ui/src/modules/fetch.ts`. Apollo and the middleware use it.
- A timeout is its own error type in Sentry, grouped by the operation name.

### 2. Apollo Client 4

- The official codemod did most of the import changes. The rest was done by hand.
- The generated hooks import from `@apollo/client/react`, through a small wrapper (see the decisions below).
- `apollo-upload-client` 20 replaces version 18. Version 18 supports only Apollo Client 3.
- The new `useQueryErrorToast` hook replaces the `onError` option of `useQuery`, which Apollo Client 4 removed.
- The checks of `result.errors` after a mutation are removed. With the default error policy the mutation throws,
  so these checks never ran.

### 3. Error model

- `classifyError(error)` in `packages/ui/src/modules/apollo/errors.ts` returns one discriminated union, `FetchError`:
  `graphql`, `invalid_query`, `csrf`, `timeout`, `connection`, `http` or `unknown`.
  It uses the `is()` type guards of Apollo Client 4. It has no casts and no string matches on Apollo messages.
- zod parses the GraphQL error extensions. Each field is parsed on its own,
  so an unexpected value in one field does not hide the error code.
- `getValidationErrors`, `getPermissionErrors` and `getSeriesOverlapErrors` are now short filters over `getApiErrors`.
- The error link is the only place that logs request errors to Sentry.
  Before, some SSR pages logged the same error twice.

### 4. Retry

- `RetryLink` after the error link, so the error link sees only the last error.
- It retries a query only on a connection error, 502 or 503. These errors fail fast.
- It does not retry a timeout or a 504. After these errors the backend can still run the request,
  because a uWSGI worker (`threads: 1`) does not stop when the client goes away.
  A retry adds more work to a backend that is already slow.
- Attempts: 2 on the server, 3 in the browser. The delay starts at 300 ms, doubles and stops at 2 seconds, with a random part.
- The proxy middleware sends a query again once if there was no connection.

### Middleware

- The customer middleware queries the backend on every page request. If the query fails, the page continues.
  The queries of the page decide if it can show. Before, any failed query showed the 503 page on every page.
- Exception: a customer reservation or application page still shows the 503 page.
  There the middleware is the access check, so the page must not show without it.
- The staff middleware makes no backend request now. Its user query only set the `x-session-is-valid` header,
  and no code reads that header. `_app` queries the user for every page.
- The staff `_app` runs three queries on every server rendered page. Only the current user is required.
  If it fails, the page shows the 503 error. If the handling data or the notifications fail, the page shows without them.
  Before, one failed query showed the sign in page, also to a user who is logged in.

## Decisions made during the work

These were not in the original task. Review them.

### Correctness

- **Never retry a mutation.** A mutation can complete on the backend even if the client sees an error.
  Examples are reservations and payments. Only queries are retried.
- **Mutation timeout message.** A mutation that times out shows "Your change can still be saved.
  Refresh the page before you try again", not "try again". A retry can cause a double booking.
- **No retry of a timeout or a 504.** See "4. Retry".
- **The middleware does not retry a mutation.** It sends one mutation (`SaveUserLanguage`),
  so the retry checks the operation type with the `graphql` parser.

### Behaviour that stays the same as before

- `notifyOnNetworkStatusChange` stays `false`. Apollo Client 4 changed the default to `true`.
  With `true`, polling pages such as the allocation page would show the loading state on every poll.
- `MockLink` has no delay in the tests. Apollo Client 4 added a random delay of 20 to 50 ms,
  and tests with fake timers failed with it.
- A 400 response is still an invalid query. graphene-django returns 400 only for a query that is not valid.
  Errors from the resolvers return 200.

### Fixes found on the way

- **File uploads** get their own timeout, `CLIENT_UPLOAD_TIMEOUT_MS = 300_000`.
  The timeout includes the time to send the file, so 30 seconds is too short for a large image on a slow connection.
- **Personal data in Sentry.** `removePi` changed the operation variables in place when it masked the personal data.
  It now works on a copy.
- **Overlap errors on the series page.** The codemod left an `instanceof ApolloError` check.
  That check is always false in Apollo Client 4, so the overlap errors would not show. The check is removed.
- **`EconnRefusedError` is removed.** It only renamed the Node.js error. `classifyError` reads the error code directly.
- **Browser fetch errors.** The failed fetch messages of Firefox and Safari are now detected, not only Chrome.

### Technical decisions

- **`AbortController` and not `AbortSignal.any`.** Older Safari and Firefox do not have `AbortSignal.any`.
  A missing method there would break every request in the browser.
- **The timeout covers the response headers, not the body.** The backend sends the headers when the response is ready,
  so this is where a slow backend makes the client wait.
- **The `reactHooks.ts` wrapper.** Next.js builds the proxy middleware with the `react-server` condition.
  With it, `@apollo/client/react` has no `skipToken`, and the generated suspense hooks use it. The build failed.
  The wrapper defines `skipToken` as `Symbol.for("apollo.skipToken")`, the same value as in Apollo.
  The codegen plugin has no option to turn off the suspense hooks.
- **No neverthrow.** A discriminated union with type guards gives the same type safety in plain TypeScript.
  A new maintainer knows this pattern, and the callers still use `try` and `catch`.
- **Codegen does not make the `MutationFn` and `MutationOptions` types.** Apollo Client 4 removed their base types,
  and no code used them.
- **Apollo Client version.** The repository has a `minimumReleaseAge` policy of 7 days.
  The first upgrade used 4.3.1. The rebases moved it to 4.3.5 when the newer versions passed the age limit.
- **`sentryLink.ts` from main.** Main changed the Sentry link during the rebases. Its version ends the span
  in all cases and marks failed requests. It is kept, only with the Apollo Client 4 types.

## Changes in behaviour to know before the merge

- **The Sentry fingerprints changed for the errors that are not GraphQL errors.** GraphQL errors keep the same fingerprint.
  `network_error` becomes `connection_error`, `http_error` and `invalid_query`. `connection_refused` becomes
  `connection_error` with `ECONNREFUSED`. `non_api_error` becomes `unknown_error`. `timeout` is new.
  Resolve the old issues after the deploy, and check the alert rules that use them.
- **The server timeouts show an error page.** An SSR query slower than 10 seconds shows an error page now.
  Before, it waited until the gateway returned a 504. Look at the SSR query times in Sentry first.
  If a page fails, raise `SERVER_QUERY_TIMEOUT_MS`. Recheck the middleware query times against the 2 second limit.
- **New toasts.** A mutation that times out shows the "can still be saved" message.

## TODO

### Before the merge

- [ ] **Find the gateway timeout of each route.** It is not in this repository. All values assume the OpenShift default
  of 30 seconds. On OpenShift, look for the `haproxy.router.openshift.io/timeout` annotation on the routes of the
  customer app, the staff app and the backend (for example `oc get route -o yaml` in each namespace), or ask Platta.
  Also ask if a second gateway or a WAF is in front of the routes, with a shorter timeout.
  - If the gateway is 30 seconds or less, set `CLIENT_FETCH_TIMEOUT_MS` a little lower (for example 25 seconds),
    so our own message shows before the gateway 504.
  - `SERVER_MUTATION_TIMEOUT_MS` (20 seconds) must stay below the gateway timeout.
- [ ] **Check the SSR query times in Sentry** against `SERVER_QUERY_TIMEOUT_MS` (10 seconds). See "Sentry queries" below.
- [ ] **Check the middleware query times** against `MIDDLEWARE_FETCH_TIMEOUT_MS` (2 seconds):
  `MiddlewareQuery` and `SaveUserLanguage` (customer). The staff middleware makes no backend request now.
  These requests do not go through Apollo, so they have no `op:graphql` span. See "Middleware" below.
- [ ] **Check the SSR mutation times** against `SERVER_MUTATION_TIMEOUT_MS` (20 seconds):
  `DeleteReservation` (the webshop cancel callback), `CreateReservation` and `CreateApplication`.
- [ ] **Test by hand with the chaos proxy.** See "Local error tests" below.
- [ ] **Merge with `fix-proxy-has-access`.** Expect a small conflict in `apps/customer/src/proxy.ts`.
  Keep both the new owner check and the 503 page for reservation and application pages.
- [ ] **Move the branches** `apollo-4-upgrade`, `fetch-error-model` and `fetch-retry` to the new commits,
  or use `fetch-retry-fast-errors` in place of them.
- [ ] **Drop this report commit.**

### After the deploy

- [ ] **Clean up Sentry.** Resolve the old `network_error`, `connection_refused` and `non_api_error` issues.
  Update the alert rules and the saved searches that use them.
- [ ] **Watch the new issues** for a week: `TIMEOUT: <operation>`, `Connection error` and `HTTP error: 502/503`.
  Many timeouts of one operation means that its timeout is too short, or that the query is slow.
- [ ] **Make the backend tickets** in "Backend changes" below.

## Local error tests

Manual tests with the chaos proxy. See "Error testing" in `README.md` for the setup and all settings.

### How the proxy reaches the code

| Traffic | Channel | Timeout |
|---|---|---|
| Proxy middleware (`MiddlewareQuery`, `SaveUserLanguage`) | `ssr` | 2 s |
| SSR queries (`getServerSideProps`, staff `_app`) | `ssr` | 10 s |
| SSR mutations (webshop cancel callback, reservation after login) | `ssr` | 20 s |
| Browser queries and mutations | `client` | 30 s, or `CLIENT_FETCH_TIMEOUT_MS` |

Limits of the proxy:

- The middleware and the SSR use the same channel. A delay between 2 and 10 seconds times out
  the middleware but not the SSR queries. That is how test 2 separates them.
- The proxy can not select one operation. So it can not show the difference between the 10 second query timeout
  and the 20 second mutation timeout. The unit test in `helpers.test.ts` covers that.
- The delay comes before the proxy sends the request to the backend. If the client stops waiting during the delay,
  the backend never gets the request. So a timeout test shows the message, but the change is not saved.
- The browser reaches the proxy through the Caddy gateway. When the proxy drops a connection, Caddy returns 502
  to the browser. So the browser sees a 502, not a dropped connection. Both are retried for a query.
- The dev frontends show the Next.js error overlay in place of the error page. Use the release frontends
  for the tests that expect an error page.

### Before you start

1. Start the setup: `just stack up-chaos`. Use `COMPOSE_PROFILES=backend,frontend-release` for the release
   frontends. They show the real 404 and 500 pages.
2. Open the customer UI at `http://localhost:8000` and the staff UI at `http://localhost:8000/kasittely`. Log in to both.
3. Have this test data: one of your own reservations (`/reservations/<id>`), one of your own applications
   (`/applications/<id>/view`), a reservation unit page, and a paid reservation unit that uses the mock webshop.
4. Open the browser developer tools on the Network tab. Keep the output of `just stack up-chaos` visible.
   The proxy logs each drop and each injected error with the prefix `chaos`.
5. Run `just stack chaos-reset` after each test.

### Tests

**1. Baseline**

- Setup: `just stack chaos-reset`
- Do: open the customer front page, a reservation unit, your reservation and a staff page.
- Expect: all pages load. `just stack chaos-status` shows requests on both channels.

**2. Slow middleware (customer)**

- Setup: `just stack chaos ssr '{"delayMs": 3000}'`
- Do: open the customer front page and a reservation unit page.
- Expect: the pages load after a few seconds. No 503 page. The middleware query times out after 2 seconds,
  and the page continues. The SSR queries wait 3 seconds and succeed.
- Do: open `/reservations/<id>` and `/applications/<id>/view`.
- Expect: the 503 page. On these pages the middleware is the access check.
- Do: open `/en/reservations/<id>` and `/sv/applications/<id>/view`.
- Expect: the 503 page in English and in Swedish. The address bar keeps the page URL.
  Before the fix, the rewrite went to a wrong path such as `/en/applications/12/en/503`.

**3. Slow SSR query**

- Setup: `just stack chaos ssr '{"delayMs": 11000}'`
- Do: open a customer reservation unit page.
- Expect: after about 10 seconds the error page of the app. Not a gateway error, not an endless wait.
- Do: open a staff page, for example `/kasittely/reservations`.
- Expect: after about 10 seconds the 503 page with status 503 (see the Network tab). Not the sign in page.

**4. Staff page with some failed queries**

- Setup: `just stack chaos ssr '{"path": "/graphql/", "errorRate": 0.5, "errorStatus": 500}'`
- Do: reload a staff page about ten times.
- Expect: each time either the page or the 503 page. Sometimes the page shows without the handling count
  in the navigation, or without the banner notifications. Never the sign in page while you are logged in.
  A 500 is not retried, so the result changes from one reload to the next.

**5. SSR retry when the connection drops**

- Setup: `just stack chaos ssr '{"path": "/graphql/", "dropEvery": 3}'`
- Do: open a customer reservation unit page and a staff page.
- Expect: the pages load. The proxy log shows `drop` lines. `chaos-status` shows more requests than queries,
  because the dropped queries were sent again.
- Note: do not use `dropEvery: 2`. The staff `_app` sends three queries at the same time, so the retry of a dropped
  query can be the next even request. Then it is dropped too, and with 2 attempts the page can fail.

**6. SSR retry of 502 and 503, no retry of 504**

- Setup: `just stack chaos ssr '{"path": "/graphql/", "errorRate": 0.3, "errorStatus": 503}'`
- Do: reload a customer reservation unit page a few times.
- Expect: the page loads almost every time. In the proxy log, a `503` line is followed by the same request again.
- Setup: `just stack chaos ssr '{"path": "/graphql/", "errorRate": 0.3, "errorStatus": 504}'`
- Expect: the error page shows more often. The proxy log shows no new attempt after a `504`.

**7. Browser retry when the connection drops**

- Setup: `just stack chaos client '{"path": "/graphql/", "dropEvery": 3}'`
- Do: on the customer search page, change the filters a few times. In the staff UI, open the reservation list.
- Expect: the results load. No error toast. The Network tab shows requests with status 502 that were sent again.

**8. Short backend break in the browser (like a deploy)**

- Setup: `just stack chaos client '{"errorForSeconds": 1}'`, then click around at once.
- Expect: the queries succeed after a retry. No toast, or at most one "Unable to connect" toast.
- Setup: `just stack chaos client '{"errorForSeconds": 10}'`, then click around at once.
- Expect: one toast "Unable to connect to the service. Please try again.: 503" at a time,
  not one toast for each failed query.
  The pages work again after 10 seconds without a reload.

**9. Browser mutation is not retried and shows one toast**

- Setup: `just stack chaos client '{"path": "/graphql/", "dropEvery": 1}'`
- Do: save a change, for example the working memo of a reservation in the staff UI.
- Expect: the proxy log shows one `drop` for the mutation, not a second attempt.
  One toast "Unable to connect to the service. Please try again.: 502". No "Undefined error." toast next to it.

**10. Browser mutation timeout**

- Setup: add `CLIENT_FETCH_TIMEOUT_MS=5000` to `frontend/apps/staff/.env` and restart the staff container.
  Use the dev frontend here. The release container builds again when it restarts, and that takes long.
  Then `just stack chaos client '{"path": "/graphql/", "delayMs": 6000}'`
- Do: save the working memo of a reservation.
- Expect: after 5 seconds one toast "The service did not respond in time. Your change can still be saved.
  Refresh the page before you try again." No "Undefined error." toast. The proxy log shows one attempt.
  The change is not saved, because the proxy did not send the request (see "Limits of the proxy").
- Do: with the same setup, open a page that loads data in the browser.
- Expect: the "Unable to connect" toast after 5 seconds. The query is not sent again.
- Clean up: remove `CLIENT_FETCH_TIMEOUT_MS` from `.env` and restart the container.

**11. Webshop cancel callback**

- Do: reserve the paid reservation unit, go to the mock webshop and cancel the payment.
  Before you cancel, set up the faults below. The callback page is `/callbacks/webstore/cancel`.
- Setup A: `just stack chaos ssr '{"delayMs": 3000}'`
- Expect A: the page shows that the reservation is cancelled. The reservation is gone from your reservations.
- Setup B: `just stack chaos ssr '{"delayMs": 11000}'`
- Expect B: after about 10 seconds the error state. The query timed out, so the delete was not sent.
  The reservation is still waiting for payment. Run `just stack chaos-reset` and reload the callback page.
  Then the page shows that the reservation is cancelled.

**12. Stopped backend**

- Do: `docker compose -f docker-compose.yml -f docker-compose.gateway.yml -f docker-compose.chaos.yml stop backend`
- Expect: the proxy returns 502. A customer reservation unit page shows the error page. A customer reservation page
  shows the 503 page. A staff page shows the 503 page. In the browser, one "Unable to connect" toast at a time.
- Do: start the backend again with `start backend`, and wait until it is ready.
- Expect: the pages work again without a restart of the frontends.

**13. Backend restart (like a deploy)**

- Do: open a staff page that loads data in the browser. Run the same command with `restart backend`, and click around
  in both UIs while the backend starts.
- Expect: short waits and at most one toast at a time. No sign in page in the staff UI. No error pages after the backend
  is ready.

## Sentry queries

The frontend makes a span for each GraphQL request: `op:graphql`, name `GRAPHQL: <operation name>`.
The span covers all attempts of the retry. The backend names each GraphQL transaction `/graphql/ <operation name>`.
Use the span search in Explore (Traces), production environment, the last 30 days.

- **SSR queries.** Filter `span.op:graphql transaction.op:http.server`. Group by `span.description`.
  Show `p95(span.duration)`, `p99(span.duration)`, `max(span.duration)` and `count()`. Sort by `p99` from high to low.
  Every `p99` must be well below 10 seconds. A `max` above 10 seconds is a page that would show the error page now.
- **Browser requests.** The same search with `transaction.op:pageload` or `transaction.op:navigation`.
  Compare the `p99` with `CLIENT_FETCH_TIMEOUT_MS` (30 seconds).
- **Middleware.** Filter the transactions of the middleware (the name starts with `middleware`), `span.op:http.client`.
  Show `p99(span.duration)` and `max(span.duration)` and compare them with 2 seconds.
  It is easier in the backend view: `/graphql/ MiddlewareQuery` and `/graphql/ SaveUserLanguage`.
- **Backend view.** Filter `transaction:"/graphql/ DeleteReservation"` and the other operations above.
  Show `p99(transaction.duration)`. This is the time in Django, without the network and the Next.js server.
- **Sample rate.** The traces are sampled (`SENTRY_TRACES_SAMPLE_RATE`). With a low rate, `p99` of a rare operation
  is not reliable. Look at `count()`, and use `max` over 30 days for the rare operations.
- **Peak.** Do the same search for the hour when the summer cottages opened. That is the worst case.
- The backend transaction names with the operation are new. Older data has only `/graphql/`.

## Backend changes

These are separate backend tasks. They do not block the merge of the frontend.

### 1. External calls in the GraphQL request take longer than the frontend waits

Some customer mutations call the webshop (`REQUEST_TIMEOUT_SECONDS = 15` in `integrations/verkkokauppa/constants.py`)
and Pindora (`REQUEST_TIMEOUT_SECONDS = 10` in `integrations/keyless_entry/client.py`) in the request.
The worst cases are longer than the frontend waits. After a frontend timeout the backend continues,
so the user sees a timeout message for a change that completes.

| Mutation | External calls in the request | Worst case | Frontend waits |
|---|---|---|---|
| `DeleteReservation` (tentative delete, also the webshop cancel callback in SSR) | webshop status, webshop cancel, Pindora delete | 15 + 15 + 10 = 40 s | 20 s SSR, 30 s browser |
| `ConfirmReservation` | webshop create order, Pindora activate | 15 + 10 = 25 s | 30 s browser |
| `CreateReservation` (also after login in SSR) | Pindora create | 10 s | 20 s SSR, 30 s browser |

The webshop cancel callback also runs a query before the mutation. Its worst case is 10 + 20 = 30 seconds
in the frontend, the same as the assumed gateway timeout.

Suggestions, simplest first:

- Use shorter timeouts for the external calls, for example 5 seconds. A healthy webshop or Pindora answers much faster.
- In the tentative delete, always delete the Pindora access code in the background task.
  The code already uses `delete_pindora_reservation_task` when the call fails. The reservation is deleted anyway,
  so the user does not need to wait for Pindora.
- In the tentative delete, cancel the webshop order in a background task.
  The status check must stay in the request, because it decides if the reservation is paid.
  `cancel_together_with_verkkokauppa(cancel_on_error=True)` already accepts a failed cancel.

### 2. Set `harakiri` in uWSGI

Set it a little above the gateway timeout. It does not stop the work of a dropped request,
but it limits how long one request can hold a worker (`threads: 1`).
`uwsgi.yml` already sends `HARAKIRI` log lines to Sentry, so that alarm starts to work when the value is set.

## Other notes

- **`hds-react` contains its own copy of Apollo Client 3.** It is an internal dependency of `hds-react` and is harmless.
