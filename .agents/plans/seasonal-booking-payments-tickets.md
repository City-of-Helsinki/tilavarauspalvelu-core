# Seasonal booking payments: work split

Paid seasonal bookings of the summer 2027 round are billed monthly by invoice through verkkokauppa subscriptions.
This document splits the work into tickets and releases. Each ticket has one sentence and its blockers.
The decisions and their sources are in [seasonal-booking-payments.md](seasonal-booking-payments.md).

## Deadlines

- 7.12.2026: the summer 2027 outdoor pool round opens for applications.
- 15.1.2027: customers can confirm their paid slots and give billing info, at the earliest. If we absolutely need to, this moves to 31.1.2027.
- 28.2.2027: the deadline for customers to confirm and give billing info.
- April and May 2027: the large general round.
- May 2027: the first monthly invoices.

## How to read this

- Types: BE (backend), FE (frontend), UX (design or text), OPS (configuration or business process), E2E (end-to-end tests).
- `KYV-*` tickets are verkkokauppa work. Varaamo cannot change them.
- Each release has only what its deadline needs. The text under each release says what is left out on purpose.

## Release 0: already built

| ID          | Type | Ticket                                                                                                           | Blocked by |
|-------------|------|------------------------------------------------------------------------------------------------------------------|------------|
| [TILA-4594] | BE   | Make a payment product for each reservation unit, sales item and merchant, and an order row for each price line. | -          |

## Release 1: confirm and give billing info

Target: in production by 15.1.2027, when the confirmation opens. The last fallback is 31.1.2027.

Scope: companies and associations only. The outdoor pool round has only paid reservation units.
The customer sees the prices of the paid slots on the application page, clicks confirm, and gives billing info in verkkokauppa.
Varaamo records the confirmation and sends its own confirmation email.

Left out: prices in the email, cancellation at the deadline, staff views, rounds with both paid and free units.
Until release 2, an unconfirmed application keeps its reservations.

Varaamo builds the flow against the verkkokauppa mock first, like the single reservation flow (`MOCK_VERKKOKAUPPA_API_ENABLED`).
Only BE-3, BE-5, E2E-1 and OPS-6 wait for verkkokauppa. The rest can start before the API contract is agreed.
The E2E tests likely use the real verkkokauppa test environment, not the mock. So E2E-1 waits for BE-5.
The mock can hide wrong guesses. We expect small changes after the API contract.

Decided (see the plan):

- One subscription order for each application.
- The deadline and the subscription merchant are fields on the application round.
- The order has no rows. Verkkokauppa must support this (OPS-2).
- The order gets the merchant in a new `merchantId` field. Verkkokauppa must add it (OPS-2).
- `lastValidPurchaseDateTime` is the confirmation deadline.

Open: Varaamo can reuse `PaymentOrder`, or add a new model for the subscription of an application. Decide in the refinement of BE-4.

| ID      | Type | Ticket                                                                                                                                               | Blocked by                                    |
|---------|------|------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------|
| [OPS-2] | OPS  | Get the API contract for release 1 from verkkokauppa by 4.12.2026, and their code in the test environment by 11.12.2026.                            | -                                             |
| [OPS-4] | OPS  | Check that every paid reservation unit of the outdoor pool round has its payment products, and that the round has its deadline and merchant.         | [TILA-4594], [BE-1]                           |
| [UX-1]  | UX   | Design the prices, the confirmation state and the confirm button on the customer application page.                                                   | -                                             |
| [UX-2]  | UX   | Write the results email text that tells the customer to confirm the paid slots before the deadline.                                                  | -                                             |
| [BE-1]  | BE   | Add the deadline and the subscription merchant to the application round, block rounds with paid and free units, and show the state in the API.      | -                                             |
| [BE-2]  | BE   | Mark a paid application as confirmed when its subscription is created, and send the Varaamo confirmation email.                                     | [BE-1]                                        |
| [BE-3]  | BE   | Handle the `SUBSCRIPTION_CREATED` webhook of verkkokauppa, and set its URL in verkkokauppa.                                                          | [BE-2], [OPS-2]                               |
| [BE-4]  | BE   | Let the customer confirm a paid application and send them to checkout, with verkkokauppa replaced by the mock checkout page.                         | [BE-1], [BE-2]                                |
| [BE-5]  | BE   | Create the real subscription order in verkkokauppa when the customer confirms, instead of the mock.                                                  | [BE-4], [OPS-2], [KYV-1382], [KYV-1438]       |
| [BE-6]  | BE   | Add the confirmation text and a link to the application to the results email of paid applications.                                                   | [UX-2], [BE-1]                                |
| [FE-1]  | FE   | Show the prices, the confirmation state and the confirm button on the customer application page.                                                     | [UX-1], [BE-1], [BE-4]                        |
| [FE-2]  | FE   | Show the result to the customer when they return from the verkkokauppa checkout.                                                                     | [BE-4]                                        |
| [UX-3]  | UX   | Check the return page of [FE-2].                                                                                                                     | [FE-2]                                        |
| [E2E-1] | E2E  | Test the confirm flow on the customer application page, and fix the current application page tests.                                                  | [FE-1], [FE-2], [BE-3], [BE-5]                |
| [OPS-6] | OPS  | Test the full confirm flow against the verkkokauppa test environment.                                                                                | [BE-3], [BE-5], [FE-1], [KYV-1384], [KYV-1446] |

## Release 2: cancel at the deadline

Target: in production before the deadline 28.2.2027 passes.

Scope: staff see which applications are not confirmed, and cancel their paid slots and their verkkokauppa orders by hand.
Then the slots can be booked as single reservations.
The summer round has only tens of customers, so a manual step is enough.

Left out: automatic cancellation (moved to release 3), reminder emails.

| ID    | Type | Ticket                                                                                                                            | Blocked by     |
|-------|------|-----------------------------------------------------------------------------------------------------------------------------------|----------------|
| FE-3  | FE   | Show the confirmation state in the staff UI application list.                                                                     | [BE-1]         |
| UX-4  | UX   | Check the confirmation state in the staff UI.                                                                                     | FE-3           |
| OPS-8 | OPS  | Cancel the paid reservations and the verkkokauppa orders of unconfirmed applications by hand after the deadline, and tell the customers. | FE-3     |

## Release 3: monthly invoices

Target: in production and tested before the first invoice date in May 2027.

Scope: verkkokauppa asks Varaamo for the invoice lines. Varaamo answers with the billable reservations and the next invoice date.
Varaamo also cancels unconfirmed applications and their verkkokauppa orders automatically, before the large round of April and May.

Left out: customer and staff views of what is billed, credits, price change messages.
Material fees stay out of the invoice. They are paid on site, as now.
Until release 4, the customer sees the billed amounts only on the invoice.
The right of purchase check stays off. We asked verkkokauppa to confirm that the new renewal does not call it.

| ID     | Type | Ticket                                                                                                                       | Blocked by                            |
|--------|------|------------------------------------------------------------------------------------------------------------------------------|---------------------------------------|
| OPS-9  | OPS  | Get the API contract for the invoice line call, its API token and its retries from verkkokauppa by 31.1.2027.                | [OPS-2]                               |
| BE-7   | BE   | Cancel the paid reservations and the verkkokauppa order of unconfirmed applications when the deadline passes, and tell the customer. | [BE-1]                        |
| BE-8   | BE   | Record which reservations are billed on which invoice.                                                                       | -                                     |
| BE-9   | BE   | Build the billable lines of an application for one invoice period with the billing rules.                                    | BE-8                                  |
| BE-11  | BE   | Serve the invoice lines and the next invoice date to verkkokauppa, with an API token, also after a cancellation.             | BE-9, OPS-9, [KYV-1383]               |
| OPS-10 | OPS  | Set the invoice line URL and the API token in verkkokauppa and in Varaamo, in test and production.                           | OPS-9, BE-11                          |
| OPS-11 | OPS  | Test a full monthly invoice against the verkkokauppa test environment.                                                       | BE-11, OPS-10, [KYV-1383], [KYV-1447] |

## Before the spring 2027 round

Target: in production before the general round of April and May 2027 opens, if that round uses subscriptions.

| ID     | Type | Ticket                                                                                                                  | Blocked by           |
|--------|------|-------------------------------------------------------------------------------------------------------------------------|----------------------|
| OPS-14 | OPS  | Decide how an application with both paid and free units is confirmed, and what happens to its free slots.               | -                    |
| BE-18  | BE   | Allow rounds with both paid and free units, by the rule of OPS-14.                                                      | OPS-14, [BE-1]       |
| OPS-15 | OPS  | Get the SAP split by sales organisation from verkkokauppa, for applications with units in different places.             | [OPS-2]              |

## Release 4: later

No deadline. Order by need after release 3.

| ID     | Type | Ticket                                                                                      | Blocked by                                                  |
|--------|------|---------------------------------------------------------------------------------------------|-------------------------------------------------------------|
| OPS-12 | OPS  | Agree how credits are handled and how the customer is told about price changes.             | -                                                           |
| OPS-13 | OPS  | Agree when and how private persons can confirm and pay seasonal bookings by invoice.        | -                                                           |
| BE-12  | BE   | Show the billed and the unbilled reservations of an application in the API.                 | BE-8                                                        |
| UX-5   | UX   | Design the billing view of the customer application page.                                   | -                                                           |
| FE-4   | FE   | Show the billed and the unbilled reservations on the customer application page.             | UX-5, BE-12                                                 |
| E2E-2  | E2E  | Test the billing view of the customer application page.                                     | FE-4                                                        |
| BE-13  | BE   | Add the slot prices to the results email.                                                   | [BE-1]                                                      |
| BE-14  | BE   | Send a reminder email before the confirmation deadline.                                     | [BE-1]                                                      |
| BE-15  | BE   | Tell the customer about price changes.                                                      | OPS-12, BE-9                                                |
| BE-16  | BE   | Refund billed reservations that the City cancels, so that verkkokauppa makes a credit note. | OPS-12, BE-8, verkkokauppa refund by amount (no ticket yet) |
| BE-17  | BE   | Let private persons confirm and pay seasonal bookings by invoice.                           | OPS-13, [BE-4]                                              |

## Outside the releases

Small fixes found on the way. They do not block any release.

| ID   | Type | Ticket                                                                               | Blocked by |
|------|------|--------------------------------------------------------------------------------------|------------|
| FE-5 | FE   | Show a correct banner text when a single reservation is paid by invoice, not "paid". | -          |
| UX-6 | UX   | Check the banner text of FE-5.                                                       | FE-5       |

## Removed tickets

- OPS-1 (deadline and paid and free mix): decided on 24.11.2026. The decisions are in BE-1. The later support for mixed rounds is OPS-14 and BE-18.
- OPS-3 (`subscriptionEndDate`): verkkokauppa confirmed on 27.11.2026 that it is not used.
- OPS-5 (subscription webhook URL): the URL is one namespace setting, not one for each merchant. Setting it is part of BE-3.
- OPS-7 (customer service process): a City process. Varaamo builds nothing for it.
- BE-10 (right of purchase): Varaamo does not need the check. We asked verkkokauppa to keep it off.

## Existing Jira tickets

- [TILA-4555] becomes release 1, OPS-8 and BE-7.
- [TILA-4445] becomes BE-1 (which slots need a confirmation), OPS-14 and BE-18.
- [TILA-4443] becomes release 3, OPS-12, BE-15 and BE-16.

[BE-1]: tickets/BE-1.md
[BE-2]: tickets/BE-2.md
[BE-3]: tickets/BE-3.md
[BE-4]: tickets/BE-4.md
[BE-5]: tickets/BE-5.md
[BE-6]: tickets/BE-6.md
[E2E-1]: tickets/E2E-1.md
[FE-1]: tickets/FE-1.md
[FE-2]: tickets/FE-2.md
[OPS-2]: tickets/OPS-2.md
[OPS-4]: tickets/OPS-4.md
[OPS-6]: tickets/OPS-6.md
[UX-1]: tickets/UX-1.md
[UX-2]: tickets/UX-2.md
[UX-3]: tickets/UX-3.md
[KYV-1382]: https://helsinkisolutionoffice.atlassian.net/browse/KYV-1382
[KYV-1383]: https://helsinkisolutionoffice.atlassian.net/browse/KYV-1383
[KYV-1384]: https://helsinkisolutionoffice.atlassian.net/browse/KYV-1384
[KYV-1438]: https://helsinkisolutionoffice.atlassian.net/browse/KYV-1438
[KYV-1446]: https://helsinkisolutionoffice.atlassian.net/browse/KYV-1446
[KYV-1447]: https://helsinkisolutionoffice.atlassian.net/browse/KYV-1447
[TILA-4443]: https://helsinkisolutionoffice.atlassian.net/browse/TILA-4443
[TILA-4445]: https://helsinkisolutionoffice.atlassian.net/browse/TILA-4445
[TILA-4555]: https://helsinkisolutionoffice.atlassian.net/browse/TILA-4555
[TILA-4594]: https://helsinkisolutionoffice.atlassian.net/browse/TILA-4594
