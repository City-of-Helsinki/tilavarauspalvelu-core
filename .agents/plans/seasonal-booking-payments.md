# Seasonal booking payments with verkkokauppa subscriptions

Paid seasonal bookings are billed monthly by invoice through the new subscription invoicing in verkkokauppa (Talpa web shop).
This document is the main plan for the epic. It collects what we know, what we decided, what Varaamo builds, and what is still open.
The verkkokauppa API is not written down by verkkokauppa. Statements marked "assumed" come from meetings, not from a contract or the code.

## Sources

- Varaamo epic: [TILA-4432 Maksaminen 3.0][TILA-4432]
  - [TILA-4555]: customer gives billing info after allocation.
  - [TILA-4443]: monthly invoicing of seasonal bookings.
  - [TILA-4445]: paying for paid seasonal bookings.
  - [TILA-4478], [TILA-4707]: planning meetings with verkkokauppa. The 7.10.2026 meeting has a transcript but no written notes.
- Related pricing work: [TILA-4594] in the epic [TILA-4427 Hinnoittelu 3.0][TILA-4427].
- Verkkokauppa epic: [KYV-1425 Toistuvaislaskutus][KYV-1425]
- Meeting notes: [20261111 Verkkokauppa x Varaamo][meeting-20261111]
- Backlog refinement on 24.11.2026 (transcript, not shared).
- Slack answers from verkkokauppa on 26.–27.11.2026.
- Our proposal to verkkokauppa, the deck "Kausivarausten toistuvaislaskutus" (`~/Downloads/maksaminen-3-verkkokauppa-rajapinnat.html`), 27.11.2026.
- Verkkokauppa docs: [Webhooks][kyv-webhooks], [Service supplied endpoints for E-com][kyv-endpoints]. Both are from 11/2024 and describe the old subscription model.
- Verkkokauppa code: [verkkokauppa-core], [verkkokauppa-experience-api], [verkkokauppa-kassa-ui]
- Order API: [Swagger UI][order-api-swagger]

## Timeline

- 7.12.2026: the summer 2027 outdoor pool round opens for applications. We moved the opening to this date to give the team more time.
- 15.1.2027: customers can confirm their paid slots and give billing info, at the earliest. Release 1 must be in production by then.
  If we absolutely need to, we can move the start to 31.1.2027.
- 28.2.2027: the deadline for customers to confirm and give billing info.
- April and May 2027: the large general round. See "Needed before the spring 2027 round".
- 5/2027: the first invoices for the summer seasonal bookings.

The PO gave these dates on 27.11.2026. Earlier versions of this plan read 15.1. and 31.1. as the confirmation deadline. That was wrong.

The first round is the summer outdoor pools, Stadika and Kumpula. Outdoor pools are new in Varaamo.
The round has only tens of customers, only paid reservation units, and only companies and associations.
The City wants it as a small test run.
Private persons come later. The business (Liikunta) decides if private persons can pay by invoice. Verkkokauppa has started to build person invoicing.

## Decisions

- One subscription order for each application (24.11.2026).
- The confirmation deadline is a field on the application round. Staff set it when they create the round, and can change it later (24.11.2026).
- For now, Varaamo blocks creating an application round that has both paid and free reservation units (24.11.2026).
- Varaamo sends its own confirmation email after the subscription is created (24.11.2026).
- The `subscriptionEndDate` field is not used. A `null` next invoice date ends the subscription (7.10.2026, confirmed by verkkokauppa 27.11.2026).
- The seller of a subscription is one merchant on the application round, not the merchant of each reservation unit (27.11.2026). See "Merchants".
- The invoice line call must have authentication (24.11.2026).
- Varaamo proposes the API contract to verkkokauppa (24.11.2026). Verkkokauppa got the deck on 27.11.2026. Example calls are enough as the contract.
- The subscription order has no rows. Example rows for the first month would promise invoices that might not happen (27.11.2026).
- `lastValidPurchaseDateTime` of the subscription order is the confirmation deadline. We ask verkkokauppa to hide the checkout timer for subscription orders (27.11.2026).
- We ask verkkokauppa to block the customer's own subscription cancellation in the Varaamo namespace. All changes go through Varaamo (27.11.2026).
- The right of purchase check stays off. Varaamo ends a subscription with a `null` next invoice date (27.11.2026).
- Varaamo does not prefill the business ID at checkout. The customer's own input in verkkokauppa is used. Varaamo does not pass its own business ID on (24.11.2026).

## Flow

### Phase 1: confirmation and subscription (January)

1. Allocation is done. Varaamo sends the results email. The email tells the customer how to confirm the paid slots before the deadline.
2. The customer opens their application in Varaamo, sees the prices and the deadline, and clicks a confirm button.
3. Varaamo creates the subscription order in verkkokauppa and redirects the customer to checkout.
4. The only payment method at checkout is invoice. The customer chooses "I order as a company or association".
5. The customer gives billing info, accepts the terms and confirms.
6. Verkkokauppa creates the subscription, emails the subscription contract, and sends the `SUBSCRIPTION_CREATED` webhook to Varaamo.
7. Varaamo marks the application as confirmed and sends its own confirmation email.
8. If the customer does not confirm before the deadline, Varaamo cancels the paid reservations and the verkkokauppa order. The slots can then be booked as single reservations.

Varaamo creates nothing in verkkokauppa before the customer clicks confirm.
This is the same pattern as for single reservations that need handling.
When staff approve a paid reservation, Varaamo creates only a local `PaymentOrder` with status `PENDING`
(`backend/tilavarauspalvelu/models/reservation/actions.py`).
The verkkokauppa order is created when the customer clicks the payment link
(`redirect_to_verkkokauppa_for_pending_reservations` in `backend/tilavarauspalvelu/api/rest/views.py`).
The order exists in verkkokauppa from the click. The subscription exists only after the customer confirms at checkout.

### Phase 2: monthly invoices (from May)

1. On the `invoicingDate`, verkkokauppa asks Varaamo for the billable lines of the subscription. The right of purchase check stays off.
2. The call has an API token, so Varaamo knows that verkkokauppa calls.
3. Varaamo answers with the lines of the realized reservations that are not billed yet, and the next `invoicingDate`.
4. Verkkokauppa makes the invoice from the lines and sends an event to Varaamo. The invoice goes to SAP the next night.
5. A `null` next date ends the subscription. The same answer still has the last billable lines, so the last invoice covers the end of the series. This covers both the normal end and the customer cancelling all remaining reservations.
6. After a cancellation, verkkokauppa runs one more billing round. If there is nothing to bill, it sends no invoice.

Varaamo decides the invoice dates. The 11.11.2026 meeting is the source for this. It replaces the earlier text in [TILA-4443] about invoicing after the last reservation of the month.
The City never invoices in advance, and it invoices as soon as possible.
So the invoice date is the last reservation of the billing period, not a fixed day of the month (7.10.2026 meeting).

Verkkokauppa does not know when SAP marks an invoice as paid. Varaamo can show only if a reservation is invoiced or not invoiced yet.

### Payment type of the reservation units

The reservation units of seasonal bookings have the payment type "online or invoice" in Varaamo.
Varaamo has no "invoice only" type. The seasonal flow does not use this choice.
Every paid seasonal booking goes to a subscription invoice.
The code chooses the flow from "seasonal and paid", not from the payment type of the unit.

## Application round

The round gets two new fields:

- The confirmation deadline. Staff set it at creation and can change it.
- The subscription merchant. Staff set it in the Django admin. It is required when the round has paid reservation units. Varaamo checks this when the results are sent, not when the round is created.

Until "Needed before the spring 2027 round" is done, Varaamo refuses a round that has both paid and free reservation units.

## Billing rules (Varaamo logic)

From [TILA-4443]:

- A cancelled single reservation is still billed.
- If the customer cancels all remaining reservations from a date, those are not billed. Billing ends at the last realized reservation.
- A reservation denied by staff is not billed.
- If the length of a reservation changes, its price changes.

From the 7.10.2026 meeting:

- An invoice has all realized reservations before the invoice date that are not billed yet.
- A reservation moved past the invoice date goes on the next invoice. The City must state this in the payment terms.
- Extra services, such as cleaning, can go on the invoice as extra lines if they have a product.

Material fees are paid on site, as now. They are usually not known in advance, for example the material used in a 3D printer.
The Liikunta reservation units of the first rounds likely have no material fees.

These rules do not depend on the verkkokauppa API. Varaamo can build them before the contract is ready.

## Dependency on [TILA-4594]

[TILA-4594] creates one verkkokauppa product for each combination of reservation unit, sales item and merchant, each with its own accounting.
It also creates one order line for each price line.
It works with the current single-reservation order API and does not depend on verkkokauppa.

The monthly invoice lines use these products and their accountings. So [TILA-4594] blocks [TILA-4443].
It does not block the parts of [TILA-4555] that do not build order lines:
the confirm button, the email changes, the deadline cancellation and the `SUBSCRIPTION_CREATED` handler.

A renewal order reads the accounting and the invoicing data from the products when the invoice is made, at the end of the renewal.
Verkkokauppa confirmed this on 27.11.2026. A product change affects the next invoice.

## Merchants

One application can have reservation units of many merchants. The round validation does not check merchants
(`backend/tilavarauspalvelu/services/pricing/application_round_options.py`).
In production on 27.11.2026, the general rounds have this often:

- Round 76, "Kausivaraus syksy 2026 - kevät 2027": 42 merchants. 125 of 1185 applications have more than one, up to 21.
- Round 43, "Kausivaraus syksy 2025 - kevät 2026": 42 merchants. 63 of 302 applications have more than one.

No general round is paid yet. They will likely use the subscriptions from the spring of 2027.

Verkkokauppa does not support many merchants in one order. It reads the merchant from the first row
(`parseMerchantIdFromFirstOrderItem` in `order-experience-api/src/api/confirmAndCreatePayment.ts` and `invoicingRedirectController.ts`, `items[0]?.merchantId` in `createRefund.ts`).

For an invoice order, the merchant does less than it looks (from the code, not confirmed by verkkokauppa):

- The invoice return reads it from the first row. Without it, the return fails.
- The subscription webhook URL is a namespace setting, despite its name `merchantSubscriptionWebhookUrl` (`RestWebHookService.postCallWebHook`).
- The checkout and the order confirmation show the merchant's name, contact info and terms.
- Online payments and refunds go to the merchant's Paytrail account. An invoice does not use Paytrail.
- Accounting comes from the product accounting, not from the merchant on the order row.
- SAP data comes from the product invoicing, not from the merchant.

Decision: one subscription merchant on the application round. Varaamo sends it in a new `merchantId` field on the subscription order.

Today verkkokauppa sets the merchant of each row from the product mapping at order creation (`createController.ts`), so Varaamo cannot choose it.
We ask verkkokauppa for the order-level `merchantId` (27.11.2026). The same field gives a zero-row order its merchant.
The other way, extra products for each round merchant in Varaamo, would multiply the products and is not chosen.

- The applicant never sees or chooses a merchant.
- The order of the application stores the merchant it was created with. Every renewal uses it. A later change on the round does not change a running subscription.
- The merchant of a reservation unit is not used for the subscription. A unit can change its merchant during the season without effect.
- The products and their accounting stay for each reservation unit, so the money still goes to the right place.

Rejected: a guard on the round or the application (blocks the general rounds), and one subscription for each merchant (brittle, and the applicant sees the merchants).

Open:

- Verkkokauppa must confirm that the order merchant can differ from the product accounting merchant.
- The City decides which merchant is set on each round.
- Card payment for subscriptions later would send all the money to one Paytrail merchant. Not in scope now.

### SAP sales organisation

The SAP export makes one sales order for each verkkokauppa order. It takes `salesOrg`, `salesOffice` and `orderType` from the first row
(`InvoicingExportService.generateSalesOrderContainer`). These come from the product invoicing.
An application with units in different places gets every invoice with the sales organisation of its first row.
Verkkokauppa would need to split one order into one sales order for each `salesOrg`, `salesOffice` and `orderType`. We asked this in the deck.
The outdoor pool round likely has one sales organisation, so this matters from the spring of 2027.

## Mixed paid and free applications

For now, Varaamo blocks creating a round with both paid and free reservation units.
The outdoor pool round has only paid units.

The PO said on 24.11.2026 that a round with both comes in the spring of 2027. Free slots must never be affected by a missing confirmation.
Options from the meeting:

- Cancel only the paid reservations, and keep the free ones. Needs its own messages to the customer.
- The customer confirms all or nothing.

Decide this before the spring 2027 round.

## State of verkkokauppa (27.11.2026)

[KYV-1425] children:

| Issue | Content | Status |
|---|---|---|
| [KYV-1382] | Order fields `type` and `invoicingDate`. The description still lists `subscriptionEndDate` and `postCharge`. | Done, merged 25.11. |
| [KYV-1438] | Billing info form and subscription creation | Development. No description. |
| [KYV-1446] | Subscription contract template | Development. No description. |
| [KYV-1384] | Order confirmation and contract, blocked by [KYV-1446] | Backlog. No description. |
| [KYV-1383] | Renewal process that asks Varaamo for the invoice lines. The description still uses `subscriptionEndDate`. | Backlog |
| [KYV-1447] | Invoice changes | Ready for Development. No description. |
| [KYV-1448] | `invoicingContactEmail` on product invoicing | Ready for Development. No description. |

Phase 1 needs [KYV-1382], [KYV-1438], [KYV-1446] and [KYV-1384]. Phase 2 needs [KYV-1383] and [KYV-1447].

Code on 27.11.2026:

- [KYV-1382] is on `master` in both repositories. `Order` has `type` and `invoicingDate`. There is no `postCharge` or `subscriptionEndDate`.
  On 25.11 the developer wrote in Jira that it was in review and not in test yet. On 27.11 Slack says it is in test.
- The experience API validates `type` with an object schema (`typeSchema` in `order-experience-api/src/lib/validation.ts`).
  I think a plain string `"subscription"` fails the validation. No test sends `type`.
- [KYV-1438] has branches in both repositories. A subscription order with `invoicingDate` gets only the invoice payment methods.
  The handling after the invoice checkout is a placeholder (`handleInvoicingSubscription` in `invoicingRedirectController.ts`).
- The invoice return reads the merchant from the first order row. With no rows, it redirects to the failure URL.
  `CreateSubscriptionsFromOrderCommand` still makes one subscription for each row.

The specifications were to be ready in week 46. None are in Jira. No ticket has a date.

Phase 1 is at risk. About 7 weeks remain to 15.1.2027, with Christmas in between. 31.1.2027 is the last fallback.
Varaamo also needs time to test against the verkkokauppa test environment after they deploy.

Deadlines that we proposed to verkkokauppa in the deck:

- 4.12.2026: the API contract for release 1.
- 11.12.2026: [KYV-1438], [KYV-1446] and [KYV-1384] in the test environment.
- 31.1.2027: the API contract for the renewal, the invoice line call and the right of purchase.
- 31.3.2027: [KYV-1383] and [KYV-1447] in the test environment.

The first two matter most. The first invoices are only in May.

## API contracts

Our proposal is in the deck that verkkokauppa got on 27.11.2026. It has example calls for each contract.

### A. Create the subscription order (Varaamo to verkkokauppa)

- One order is one application.
- The order uses the same fields as a normal order, with `type: subscription` and the first `invoicingDate` on the order (confirmed).
- `periodUnit`, `periodFrequency` and `subscriptionEndDate` are not used.
- The order has the subscription merchant of the round in a new `merchantId` field. Asked from verkkokauppa.
- No rows. Verkkokauppa says an order can have zero rows, but its code needs at least one row for the merchant and the subscription.
  We asked verkkokauppa to support zero rows in the checkout, the return and the subscription creation.
  Verkkokauppa recommended example rows for the first month. We do not send them, because they promise invoices that might not happen.
- `lastValidPurchaseDateTime` is the confirmation deadline. The checkout timer and the checkout block come only from this field.
  After it, verkkokauppa blocks the checkout itself. We asked verkkokauppa to hide the timer for subscription orders, because the deadline is days away.
  Varaamo still cancels the order at the deadline.
- Single reservations that need handling send now + 10 minutes instead, and the pay link makes a new order after that
  (`redirect_to_verkkokauppa_for_pending_reservations`). The reason is not documented. We think it is because an order freezes the price and the VAT when it is made,
  and the handled payment expiry logic counts on 10 minutes (`expired_handled_payments`). Verkkokauppa had to force a cutoff for old 24 % VAT orders in 2024.
  This does not apply to the subscription order, because it has no rows. The rows come at each renewal.
- Open: Varaamo can reuse `PaymentOrder`, or add a new model for the subscription of an application.
  Today `PaymentOrder` is one order for one reservation, and `remote_id` is the verkkokauppa `orderId`.
  The seasonal flow has one subscription for each application, and one renewal order each month.
- Varaamo creates the order when the customer clicks confirm. A second click reuses the order until it is cancelled or `lastValidPurchaseDateTime` passes.

### B. Return from checkout and `SUBSCRIPTION_CREATED` (verkkokauppa to Varaamo)

- After an invoice checkout, verkkokauppa redirects to the namespace setting `ORDER_CREATED_REDIRECT_URL` with `orderId` and `user`.
  Cancel at checkout returns to the "order cancelled" URL. These are the same URLs as for single reservations.
  Varaamo looks up the `orderId` in its own data to tell a reservation and an application apart.
- `SUBSCRIPTION_CREATED` is sent to the namespace setting `merchantSubscriptionWebhookUrl`. The payload is `subscriptionId`, `orderId`, `orderItemId`, `namespace`, `eventType`, `timestamp` and `eventTimestamp`.
  A non-200 answer is retried up to 5 times. Today there is one subscription and one event for each order row. We ask for one for each order.
- The webhook has no key. Varaamo answers only 200, and checks the state by fetching the order from verkkokauppa with its own API key, like the current webhooks
  (`backend/tilavarauspalvelu/api/webhooks/views.py`).
- We asked that the event is sent when the customer accepts the invoice subscription, without `orderItemId`, and that the order shows `subscriptionId`.
  Today the event is sent after a payment.
- The 2024 docs also list `SUBSCRIPTION_RENEWAL_ORDER_CREATED` to `merchantOrderWebhookUrl`, marked "TBR". Varaamo does not need it now.
- Verkkokauppa sends nothing if the customer does not finish.

### C0. Right of purchase (verkkokauppa to Varaamo)

- Before a renewal, verkkokauppa can ask the service if the customer can still buy. With `false`, it does not renew.
- The 2024 docs: settings `orderRightOfPurchaseUrl` and `orderRightOfPurchaseIsActive`. The request has one `orderItem`. The response has `rightOfPurchase` and `errorMessage`.
- It is off unless the namespace sets `ORDER_RIGHT_OF_PURCHASE_IS_ACTIVE` and the URL. When it is on, it is called for each row.
- Varaamo keeps it off, because a `null` next date already ends the subscription. We asked verkkokauppa to confirm that the new renewal does not call it.

### C. Invoice lines (verkkokauppa to Varaamo)

- A new setting with a new payload. Not `subscriptionPriceUrl`. Not defined yet.
- The request has the `invoicingDate` it asks the lines for. It likely also has the subscription ID and the order ID.
- The response has the list of lines and the next `invoicingDate`.
  A line likely has the product ID, quantity, net, VAT, gross, VAT percentage, the merchant and meta data such as the reservation dates.
- An empty list with a next date is valid. Verkkokauppa skips the invoice for that month.
- A `null` next date ends the subscription, with or without lines. No reservations are added to a series after its last one, so nothing is left to bill after it. Tests must make sure that Varaamo never sends `null` by mistake.
- After a cancellation, verkkokauppa calls once more. Varaamo must answer for a cancelled subscription.
- Open: which `invoicingDate` is in that last call, and does it come before or after `SUBSCRIPTION_CANCELLED`. We asked this in the deck.

### D. End of the subscription

- The customer cancels all remaining reservations: Varaamo answers the next contract C call with the last billable lines and a `null` date.
- The deadline passes without confirmation: no subscription exists. Varaamo cancels the verkkokauppa order. Verkkokauppa never removes an unfinished order by itself.
- The customer cancels the subscription in verkkokauppa: the experience API has `POST /subscription/:id/cancel`, and it accepts the customer's own Helsinki profile token.
  The reservations would stay in Varaamo. We asked verkkokauppa to block it in the Varaamo namespace. The customer cancels the slots in Varaamo instead.

### E. Credits

- Verkkokauppa adds refunds by amount, which allows partial refunds. It also adds refunds for invoiced orders. Neither exists today.
- A refund on an invoiced order becomes a credit note in SAP automatically.
- Example: the City cancels the last slot of a month after it is billed. Varaamo refunds its price, and SAP makes a credit note.
- Verkkokauppa has not specified credits. The verkkokauppa lead assumes an invoice and a separate credit invoice. A credit is likely made only if the order is already invoiced.
- The City said on 24.11.2026 that credits depend on who cancels, the customer or staff, and why. Some reasons can be OK, for example holidays.
- Release 4.

## Authentication of contract C

Varaamo accepts webhooks without authentication. It then checks the state from verkkokauppa with its own API key
(`backend/tilavarauspalvelu/api/webhooks/permissions.py`, `backend/tilavarauspalvelu/api/webhooks/views.py`).
Contract C cannot work like this. Varaamo returns billing data in the response, so it must know who the caller is.
Without authentication, anyone who knows a subscription ID could read data that is only for the customer and verkkokauppa.

The current `subscriptionPriceUrl` call sends no authentication. It sends only `Content-Type`
(`postCall` in `common/.../rest/RestServiceClient.java`).

Verkkokauppa already has two ways to authenticate its calls to a service:

- The webhook client sends the headers `webhook-api-key` and `namespace`. The key is the namespace setting `namespaceWebhookAccessToken`.
- `Authorization: Bearer`, added in [KYV-1402].

Varaamo asks verkkokauppa to send `webhook-api-key` on the contract C call. Varaamo compares it with the key it keeps.
This needs a ticket in both projects.

The verkkokauppa HTTP clients skip TLS certificate checks by default (`ALLOW_INSECURE_SSL` defaults to `true`).
This weakens a key sent in a header. Tell verkkokauppa about it when asking for the key.

## Needed before the spring 2027 round

The spring round (applications in April and May 2027) is the large general round. Release 1 does not support these:

- Applications with both paid and free units. See "Mixed paid and free applications".
- Many merchants in one application, and the SAP split. See "Merchants".
- Automatic cancellation at the deadline, because the round is large.

## Varaamo work

Not blocked by verkkokauppa:

- [TILA-4594]: products and accountings for each reservation unit and sales item. Blocks the invoice lines.
- [TILA-4555]: the deadline and the subscription merchant on the round, the block on mixed rounds, the confirm button on the application page,
  the instructions in the results email, the Varaamo confirmation email, the deadline cancellation.
- Handler for the `SUBSCRIPTION_CREATED` webhook.
- [TILA-4443]: the billing rules, and the record of which reservations are billed.

Blocked by verkkokauppa:

- Creating the real subscription order (contract A). Needs [KYV-1382], [KYV-1438], and an answer on zero rows.
- The contract C endpoint. Needs the request and response format from [KYV-1383].
- Authentication of contract C. Needs a ticket in both projects.

## Open questions

The main open questions:

- Verkkokauppa, all asked in the deck: the API contract and the dates, `merchantId` on the order and zero rows, one `SUBSCRIPTION_CREATED` for each order,
  the hidden timer, the `type` validation, blocking the customer's own cancellation, the invoice line call with its API token and retries,
  the last billing round after a cancellation, the right of purchase staying off, and the SAP split.
- City: the seller merchant of each round, credits, price change messages, private persons, and how mixed paid and free applications are confirmed.
- Varaamo: `PaymentOrder` or a new model for the order of an application (BE-4).

[KYV-1382]: https://helsinkisolutionoffice.atlassian.net/browse/KYV-1382
[KYV-1383]: https://helsinkisolutionoffice.atlassian.net/browse/KYV-1383
[KYV-1384]: https://helsinkisolutionoffice.atlassian.net/browse/KYV-1384
[KYV-1402]: https://helsinkisolutionoffice.atlassian.net/browse/KYV-1402
[KYV-1425]: https://helsinkisolutionoffice.atlassian.net/browse/KYV-1425
[KYV-1438]: https://helsinkisolutionoffice.atlassian.net/browse/KYV-1438
[KYV-1446]: https://helsinkisolutionoffice.atlassian.net/browse/KYV-1446
[KYV-1447]: https://helsinkisolutionoffice.atlassian.net/browse/KYV-1447
[KYV-1448]: https://helsinkisolutionoffice.atlassian.net/browse/KYV-1448
[TILA-4427]: https://helsinkisolutionoffice.atlassian.net/browse/TILA-4427
[TILA-4432]: https://helsinkisolutionoffice.atlassian.net/browse/TILA-4432
[TILA-4443]: https://helsinkisolutionoffice.atlassian.net/browse/TILA-4443
[TILA-4445]: https://helsinkisolutionoffice.atlassian.net/browse/TILA-4445
[TILA-4478]: https://helsinkisolutionoffice.atlassian.net/browse/TILA-4478
[TILA-4555]: https://helsinkisolutionoffice.atlassian.net/browse/TILA-4555
[TILA-4594]: https://helsinkisolutionoffice.atlassian.net/browse/TILA-4594
[TILA-4707]: https://helsinkisolutionoffice.atlassian.net/browse/TILA-4707
[meeting-20261111]: https://helsinkisolutionoffice.atlassian.net/wiki/spaces/KAN/pages/11158552607/20261111+Verkkokauppa+x+Varaamo
[kyv-webhooks]: https://helsinkisolutionoffice.atlassian.net/wiki/spaces/KYV/pages/7595294732/Webhooks
[kyv-endpoints]: https://helsinkisolutionoffice.atlassian.net/wiki/spaces/KYV/pages/7751172127/Service+supplied+endpoints+for+E-com
[order-api-swagger]: https://checkout-test-api.test.hel.ninja/v1/order/docs/swagger-ui/#/
[verkkokauppa-core]: https://github.com/City-of-Helsinki/verkkokauppa-core
[verkkokauppa-experience-api]: https://github.com/City-of-Helsinki/verkkokauppa-experience-api
[verkkokauppa-kassa-ui]: https://github.com/City-of-Helsinki/verkkokauppa-kassa-ui
