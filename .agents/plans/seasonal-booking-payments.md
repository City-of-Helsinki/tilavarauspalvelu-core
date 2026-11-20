# Seasonal booking payments with verkkokauppa subscriptions

Paid seasonal bookings are billed monthly by invoice through the new subscription invoicing in verkkokauppa (Talpa web shop).
This document collects what we know, what Varaamo builds, and the questions for verkkokauppa.
Many parts of the verkkokauppa API are not defined yet. Statements marked "assumed" come from meetings and memory, not from a written contract.

## Sources

- Varaamo epic: [TILA-4432 Maksaminen 3.0][TILA-4432]
  - [TILA-4555]: customer gives billing info after allocation.
  - [TILA-4443]: monthly invoicing of seasonal bookings.
  - [TILA-4445]: paying for paid seasonal bookings.
  - [TILA-4478], [TILA-4707]: planning meetings with verkkokauppa. The 7.10.2026 meeting has a transcript but no written notes.
- Related pricing work: [TILA-4594] in the epic [TILA-4427 Hinnoittelu 3.0][TILA-4427].
- Verkkokauppa epic: [KYV-1425 Toistuvaislaskutus][KYV-1425]
- Meeting notes: [20261111 Verkkokauppa x Varaamo][meeting-20261111]
- Verkkokauppa code: [verkkokauppa-core], [verkkokauppa-experience-api]
- Order API: [Swagger UI][order-api-swagger]

## Timeline

- About 15.1.2027, hard deadline 31.1.2027: customers confirm their seasonal bookings and give billing info.
- 5/2027: the first invoices for the summer seasonal bookings.

The first round in January is for companies and associations only. Private persons come later.
The business (Liikunta) decides if private persons can pay by invoice. Verkkokauppa has started to build person invoicing.

The first round is the summer outdoor pools, Stadika and Kumpula. It has only tens of customers.
The City wants it as a small test run. The next round in April and May is much larger.

## Flow

### Phase 1: confirmation and subscription (January)

1. Allocation is done. Varaamo sends the results email. The email tells the customer the prices and how to confirm the slots.
2. The customer opens their application in Varaamo and clicks a confirm button.
3. Varaamo creates the order in verkkokauppa and redirects the customer to checkout.
4. The only payment method at checkout is invoice. The customer chooses "I order as a company or association".
5. The customer gives billing info, accepts the terms and confirms.
6. Verkkokauppa creates the subscription, emails the subscription contract, and sends the `SUBSCRIPTION_CREATED` webhook to Varaamo.
7. Varaamo marks the billing info as given and the seasonal booking as confirmed.
8. If the customer does not confirm before the deadline, Varaamo cancels the unconfirmed reservations. The slots can then be booked as single reservations.

Varaamo creates nothing in verkkokauppa before the customer clicks confirm.
This is the same pattern as for single reservations that need handling.
When staff approve a paid reservation, Varaamo creates only a local `PaymentOrder` with status `PENDING`
(`backend/tilavarauspalvelu/models/reservation/actions.py`).
The verkkokauppa order is created when the customer clicks the payment link
(`redirect_to_verkkokauppa_for_pending_reservations` in `backend/tilavarauspalvelu/api/rest/views.py`).
The order exists in verkkokauppa from the click. The subscription exists only after the customer confirms at checkout.

### Phase 2: monthly invoices (from May)

1. On the `invoicingDate`, verkkokauppa first checks the right of purchase. Varaamo answers if the subscription is still valid.
2. Verkkokauppa asks Varaamo for the billable lines of the subscription.
3. Varaamo answers with the lines of the realized reservations that are not billed yet, and the next `invoicingDate`.
4. Verkkokauppa makes the invoice from the lines and sends an event to Varaamo. The invoice goes to SAP the next night.
5. A `null` next date ends the subscription. The same answer still has the last billable lines, so the last invoice covers the end of the series. This covers both the normal end and the customer cancelling all remaining reservations.

Varaamo decides the invoice dates. The 11.11.2026 meeting is the source for this. It replaces the earlier text in [TILA-4443] about invoicing after the last reservation of the month.
The City never invoices in advance, and it invoices as soon as possible.
So the invoice date is the last reservation of the billing period, not a fixed day of the month (7.10.2026 meeting).

Verkkokauppa does not know when SAP marks an invoice as paid. Varaamo can show only if a reservation is invoiced or not invoiced yet.

### Payment type of the reservation units

The reservation units of seasonal bookings have the payment type "online or invoice" in Varaamo.
Varaamo has no "invoice only" type. The seasonal flow does not use this choice.
Every paid seasonal booking goes to a subscription invoice.
The code chooses the flow from "seasonal and paid", not from the payment type of the unit.

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

A renewal order made by verkkokauppa reads the accounting from the product, like a normal order.
[TILA-4594] depends on this.

## State of verkkokauppa (18.11.2026)

[KYV-1425] children:

| Issue | Content | Status |
|---|---|---|
| [KYV-1382] | Order fields `subscriptionEndDate`, `postCharge` | Development |
| [KYV-1438] | Billing info form and subscription creation | Development |
| [KYV-1446] | Subscription contract template | Development |
| [KYV-1384] | Order confirmation and contract, blocked by [KYV-1446] | Backlog |
| [KYV-1383] | Renewal process that asks Varaamo for the invoice lines | Backlog |
| [KYV-1447] | Invoice changes | Ready for Development |
| [KYV-1448] | `invoicingContactEmail` on product invoicing | Ready for Development |

Phase 1 needs [KYV-1382], [KYV-1438], [KYV-1446] and [KYV-1384]. Phase 2 needs [KYV-1383] and [KYV-1447].

No code for this is public yet. The branch `feature/KYV-1382-subscription-invoicing-order-changes` exists in both repositories but has no commits of its own.
On master, `Order` has no `postCharge` or `subscriptionEndDate` field.
The specifications were to be ready in week 46. None are in Jira.

Phase 1 is at risk. About 8 weeks remain to 15.1.2027, with Christmas in between.
Varaamo also needs time to test against the verkkokauppa test environment after they deploy.

### Existing subscription support in verkkokauppa

- Namespace setting `subscriptionPriceUrl`. At renewal, verkkokauppa posts to it and reads one price (net, VAT, gross, VAT percentage) for the whole subscription
  (`orderapi/.../subscription/CreateOrderFromSubscriptionCommand.java`).
- Namespace setting `subscriptionResolveProductUrl`.
- Merchant setting `merchantSubscriptionWebhookUrl` for the subscription webhooks.
- Events `SUBSCRIPTION_CREATED`, `SUBSCRIPTION_CANCELLED` and `SUBSCRIPTION_RENEWAL_*`.
- One subscription is created for each order item, with its own `merchantId` (`CreateSubscriptionsFromOrderCommand.java`).

The current create order API requires `productId`, the prices and `quantity` for each item.
A contract whose items change every month needs a new request shape. This is likely the largest change in verkkokauppa.

## API contracts

Assumed from the meetings. Nothing is written down by verkkokauppa.

### A. Create the subscription order (Varaamo to verkkokauppa)

- One order is one application. Not confirmed by verkkokauppa. It matches what customers and the business expect.
- The order is created with the `POST /v1/order/` endpoint in a new shape with `type: subscription`. It creates the contract only.
- The order has the first `invoicingDate`. With only `invoicingDate`, it is a single invoice order. With `type: subscription` too, it is a recurring invoice.
- `periodUnit` and `periodFrequency` are not used.
- In the 7.10.2026 meeting, `subscriptionEndDate` was removed from the plans, because it is a second source of truth for the end. [KYV-1382] still lists it.
- The first order has no order rows. Not confirmed. Varaamo gives the rows each month in contract C.
- Today, verkkokauppa offers invoice when an order row has `invoicingDate`. An order without rows needs another place for it.
- Open: Varaamo can reuse `PaymentOrder`, or add a new model for the subscription of an application.
  Today `PaymentOrder` is one order for one reservation, and `remote_id` is the verkkokauppa `orderId`.
  The seasonal flow has one subscription for each application, and one renewal order each month.
- Varaamo creates the order when the customer clicks confirm.

### B. `SUBSCRIPTION_CREATED` webhook (verkkokauppa to Varaamo)

- Sent to `merchantSubscriptionWebhookUrl` with the current event payload.
- Varaamo gets no other data, such as the customer type.
- Verkkokauppa sends nothing if the customer does not finish. Varaamo uses its own deadline.

### C0. Right of purchase (verkkokauppa to Varaamo)

- At each renewal, verkkokauppa first asks if the subscription is still valid. Other subscription services use the same check.
- The request and response shape is not known. It likely needs the same authentication as contract C.

### C. Invoice lines (verkkokauppa to Varaamo)

- Likely `subscriptionPriceUrl` is used again. A new setting is only a small change for Varaamo.
- The request has the `invoicingDate` it asks the lines for. It likely also has the subscription ID and the order ID.
- The response has the list of lines and the next `invoicingDate`.
  A line likely has the product ID, quantity, net, VAT, gross, VAT percentage and meta data such as the reservation dates.
- An empty list with a next date is valid. Verkkokauppa skips the invoice for that month.
- A `null` next date ends the subscription, with or without lines. No reservations are added to a series after its last one, so nothing is left to bill after it. Tests must make sure that Varaamo never sends `null` by mistake.

### D. End of the subscription

- The customer cancels all remaining reservations: Varaamo answers the next contract C call with the last billable lines and a `null` date.
- The deadline passes without confirmation: no subscription exists. The order in verkkokauppa is left to expire.

### E. Credits

- Verkkokauppa adds refunds by amount, which allows partial refunds. It also adds refunds for invoiced orders. Neither exists today.
- A refund on an invoiced order becomes a credit note in SAP automatically.
- Example: the City cancels the last slot of a month after it is billed. Varaamo refunds its price, and SAP makes a credit note.
- It is not known if the customer then gets one net invoice or two documents. Verkkokauppa checks this with the City billing team.

## Authentication of contract C

Varaamo accepts webhooks without authentication. It then checks the state from verkkokauppa with its own API key
(`backend/tilavarauspalvelu/api/webhooks/permissions.py`, `backend/tilavarauspalvelu/api/webhooks/views.py`).
Contract C cannot work like this. Varaamo returns billing data in the response, so it must know who the caller is.

The current `subscriptionPriceUrl` call sends no authentication. It sends only `Content-Type`
(`postCall` in `common/.../rest/RestServiceClient.java`).

Verkkokauppa already has two ways to authenticate its calls to a service:

- The webhook client sends the headers `webhook-api-key` and `namespace`. The key is the namespace setting `namespaceWebhookAccessToken`.
- `Authorization: Bearer`, added in [KYV-1402].

Varaamo asks verkkokauppa to send `webhook-api-key` on the contract C call. Varaamo compares it with the key it keeps.
This needs a ticket in both projects.

The verkkokauppa HTTP clients skip TLS certificate checks by default (`ALLOW_INSECURE_SSL` defaults to `true`).
This weakens a key sent in a header. Tell verkkokauppa about it when asking for the key.

## Merchants

The round validation requires the same price options for every reservation unit on every day of the reservation period
(`backend/tilavarauspalvelu/services/pricing/application_round_options.py`).
It does not check merchants. One application can have units with different merchants.

Verkkokauppa sets the merchant on each order item. But the payment and refund flows read the merchant from the first item only
(`parseMerchantIdFromFirstOrderItem` in `order-experience-api/src/api/confirmAndCreatePayment.ts`, `items[0]?.merchantId` in `createRefund.ts`).
Single reservations never hit this, because one reservation has one merchant.

On an invoice, SAP takes the sales organisation, the sales office and the order type from the first row of the order.
The material comes from each row. With one order for each application, an application with units in different places
gets every monthly invoice with the sales organisation of its first row.

## Varaamo work

Not blocked by verkkokauppa:

- [TILA-4594]: products and accountings for each reservation unit and sales item. Blocks the invoice lines.
- [TILA-4555]: the confirm button on the application page, prices and instructions in the results email, the deadline cancellation.
- Handler for the `SUBSCRIPTION_CREATED` webhook.
- [TILA-4443]: the billing rules, and the record of which reservations are billed.

Blocked by verkkokauppa:

- Creating the subscription order (contract A). Needs [KYV-1382] and [KYV-1438].
- The contract C endpoint. Needs the request and response format from [KYV-1383].
- Authentication of contract C. Needs a ticket in both projects.

## Questions for verkkokauppa

Answers from the 7.10.2026 meeting are under each question.

1. Is the API contract written down anywhere? If not, when will it be? The specifications were to be ready in week 46.
2. Contract A: what is the request shape for a subscription order without fixed items? Which fields does Varaamo send?
   Partly answered: `invoicingDate` and `type: subscription`. The items are still open.
3. Contract A: can one order or subscription have products of many merchants? The payment and refund flows read only the first item's merchant.
4. Contract B: does `SUBSCRIPTION_CREATED` use `merchantSubscriptionWebhookUrl` and the current payload?
5. Contract C: is it `subscriptionPriceUrl`, or a new setting? What are the exact request and response?
   Partly answered: rows, prices and the next `invoicingDate`, one order at a time.
6. Contract C: will verkkokauppa send `webhook-api-key` on the call? Will it retry when Varaamo returns an error?
7. Does a renewal order read the accounting from the product, like a normal order?
   Likely yes, if the product mapping has the accounting.
8. When does the code reach the test environment, so that Varaamo can test before 15.1.2027?
   Order creation can be tested at once. The rest can be tested only after verkkokauppa builds its part.
9. Contract A: is `subscriptionEndDate` still in [KYV-1382]? The 7.10.2026 meeting removed it.
10. Contract C0: what are the request and response of the right of purchase check?
11. Credits: does the customer get one net invoice, or an invoice and a separate credit note?
12. Contract A: where does `invoicingDate` go, when the first order has no rows?
13. Contract C: on an invoice, the first row sets the sales organisation, the sales office and the order type. Is that right when an application has units in different places?

## Questions for the City

1. What is the deadline for the customer to confirm and give billing info? ([TILA-4555])
   Not answered. The allocations are done by the end of January at the latest.
2. What happens to an application that has both paid and free sections, or a section with both paid and free units? ([TILA-4445])
3. How are credits handled, for example when a slot could not be used? ([TILA-4443])
   Partly answered: through a refund by amount and a credit note. See contract E.
4. How does Varaamo tell the customer when the price changes, for example after a length change, a denied reservation or a credit? ([TILA-4443])

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
[order-api-swagger]: https://checkout-test-api.test.hel.ninja/v1/order/docs/swagger-ui/#/
[verkkokauppa-core]: https://github.com/City-of-Helsinki/verkkokauppa-core
[verkkokauppa-experience-api]: https://github.com/City-of-Helsinki/verkkokauppa-experience-api
