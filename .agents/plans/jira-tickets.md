# Pricing redesign: Jira tickets

The tickets of epic [TILA-4427](https://helsinkisolutionoffice.atlassian.net/browse/TILA-4427), in the order of development.

- **NEW** marks a ticket that does not exist yet. Its title is a proposal.
- "Desc." says if the Jira ticket has a description from this design.
- Labels: BE (backend), FE (frontend), DES (design), OPS (operations), INF (infra).

Schedule: on 30.11. the team confirms if the outdoor pool seasonal round can use the new pricing.
The round opens 1.12. Applicants must be able to select a price option by then. Prices are needed only
when the allocated slots become reservations.

## Step 1. Tax levels

Self-contained. The VAT code tickets must be done before step 7.

| Ticket    | Label  | Title                                                   | Desc. | Blocked by           |
|-----------|--------|---------------------------------------------------------|-------|----------------------|
| TILA-4543 | BE, FE | Tax percentage becomes a tax level                      | yes   | none                 |
| TILA-4569 | OPS    | Find out how VAT codes work in SAP and in Varaamo       | yes   | none                 |
| TILA-4570 | BE     | Move the VAT code from accounting to the tax level rate | yes   | TILA-4543, TILA-4569 |

## Step 2. New models and APIs (backend, not used yet)

The new models and every API that the current views need. Only non-breaking changes: the old API stays.
The web shop still sends one order item. The test data commands make pricing groups and price lines,
so the frontend can work against the new APIs locally. The data migration is not part of this step.

| Ticket    | Label | Title                                                                      | Desc.  | Blocked by                  |
|-----------|-------|----------------------------------------------------------------------------|--------|-----------------------------|
| TILA-4544 | BE    | New pricing data model, validator, API, calculation and test data          | yes    | none (relates to TILA-4543) |
| TILA-4551 | BE    | Price lines, price query and price summary for the single reservation flow | yes    | TILA-4544                   |
| TILA-4573 | BE    | Handler's price override per price line                                    | yes    | TILA-4551                   |

## Step 3. Frontend uses the new APIs

Each view is its own ticket. These ship to production together with step 4.

| Ticket    | Label | Title                                                                 | Desc. | Blocked by                            |
|-----------|-------|-----------------------------------------------------------------------|-------|---------------------------------------|
| TILA-4546 | DES   | Old pricing form supports the new model                               | own   | none                                  |
| TILA-4572 | FE    | Old pricing form uses the new model                                   | yes   | TILA-4546, TILA-4544                  |
| TILA-4548 | DES   | Price in the single reservation flow, one price per unit              | yes   | none                                  |
| TILA-4576 | FE    | Price summary on search cards, lists and the reservation unit page    | yes   | TILA-4551, TILA-4548                  |
| TILA-4577 | FE    | Price query in the reservation flow and the reservation edit flow     | yes   | TILA-4551, TILA-4548                  |
| TILA-4578 | FE    | Price lines in the customer's reservation details ("my reservations") | yes   | TILA-4551, TILA-4548                  |
| TILA-4579 | FE    | Remove price calculation from the customer app                        | yes   | TILA-4576, TILA-4577, TILA-4578       |
| TILA-4574 | DES   | Handler's price override per price line in the staff UI               | yes   | none                                  |
| TILA-4575 | FE    | Handler's price override per price line                               | yes   | TILA-4573, TILA-4574                  |

All step 3 FE tickets relate to TILA-4545, because they ship in the same release.

## Step 4. Migration and switch (one release with step 3)

| Ticket    | Label | Title                                                                  | Desc.  | Blocked by                                  |
|-----------|-------|------------------------------------------------------------------------|--------|---------------------------------------------|
| TILA-4545 | BE    | Migrate units and reservations to the new model and switch the backend | yes    | TILA-4544, TILA-4551                        |
| TILA-4547 | OPS   | Check that the single reservation flow works with the new model        | yes    | TILA-4545                                   |
| TILA-4558 | BE    | Remove everything that is no longer needed, including the old API      | yes    | TILA-4543, TILA-4545                        |

TILA-4545 has:

- the pricing data migration,
- the price line migration of about 600,000 existing reservations,
- the switch of create, confirm, approve, reschedule and payment to the new calculation,
- a run time measurement on a copy of production.

## Step 5. Price options in the seasonal application

Only the selection of an option. Prices come later. Shared pricing groups and options are set up in the Django admin.
The single reservation flow does not need options yet: an own pricing group works without them.

| Ticket    | Label | Title                                                                                           | Desc. | Blocked by           |
|-----------|-------|-------------------------------------------------------------------------------------------------|-------|----------------------|
| TILA-4580 | BE    | Price options in application sections: offered options per round, selected option, round check | yes   | TILA-4544            |
| TILA-4550 | DES   | Price option selection in the application form and the staff application section pages         | yes   | none                 |
| TILA-4581 | FE    | Price option selection in the customer application form                                         | yes   | TILA-4580, TILA-4550 |
| TILA-4582 | FE    | Selected price option in the staff application section pages                                    | yes   | TILA-4580, TILA-4550 |
| TILA-4583 | OPS   | Set up the outdoor pool pricing groups and options in the Django admin                          | yes   | TILA-4544, TILA-4580 |

## Step 6. Seasonal reservations with price lines

Needed when the allocated slots become reservations. The rule components that the outdoor pool prices need
must be done by then. Decide which ones are needed.

| Ticket    | Label | Title                                                           | Desc. | Blocked by           |
|-----------|-------|-----------------------------------------------------------------|-------|----------------------|
| TILA-4549 | BE    | Reservation series use the selected option and make price lines | yes   | TILA-4545, TILA-4580 |
| TILA-4553 | DES   | Prices in the "my seasonal reservations" view                   | yes   | none                 |
| TILA-4554 | FE    | Prices in the "my seasonal reservations" view                   | yes   | TILA-4553, TILA-4549 |
| TILA-4552 | DES   | Prices of reservation series in the staff UI                    | yes   | none                 |
| TILA-4584 | FE    | Prices of reservation series in the staff UI                    | yes   | TILA-4552, TILA-4549 |

### Rule components

Backend only. Staff set them up in the Django admin until the editor in step 8 supports them.

| Ticket    | Label | Title                    | Desc.  | Blocked by           |
|-----------|-------|--------------------------|--------|----------------------|
| TILA-4556 | BE    | Surcharge components     | yes    | TILA-4545, TILA-4551 |
| TILA-4585 | BE    | Adjustment components    | yes    | TILA-4556            |
| TILA-4586 | BE    | Total duration condition | yes    | TILA-4545            |
| TILA-4587 | BE    | Weekday condition        | yes    | TILA-4545            |
| TILA-4588 | BE    | Time of day condition    | yes    | TILA-4545            |
| TILA-4589 | BE    | Recurring date condition | yes    | TILA-4545            |
| TILA-4590 | BE    | Elapsed time condition   | yes    | TILA-4545            |
| TILA-4591 | BE    | Lead time condition      | yes    | TILA-4545            |

### Several price lines and varying prices in the customer app

Must be in production before the first surcharge or condition goes live.
The step 3 tickets cover one price line and list extra lines as plain text, so a new line never disappears.

| Ticket    | Label | Title                                                      | Desc. | Blocked by           |
|-----------|-------|------------------------------------------------------------|-------|----------------------|
| TILA-4603 | DES   | Several price lines and a varying price in the customer app | yes   | none                 |
| TILA-4604 | FE    | Several price lines and a varying price in the customer app | yes   | TILA-4603, TILA-4556 |

## Step 7. Several order items in the web shop

| Ticket    | Label | Title                                                                               | Desc. | Blocked by                      |
|-----------|-------|-------------------------------------------------------------------------------------|-------|---------------------------------|
| TILA-4592 | OPS   | Check with the web shop team: several products per unit, subscriptions, order items | yes   | none                            |
| TILA-4594 | BE    | Web shop products per accounting and tax level, one order item per price line       | yes   | TILA-4570, TILA-4549, TILA-4592 |
| TILA-4600 | BE    | Scheduled accounting change in the web shop when a VAT rate changes                 | yes   | TILA-4594, TILA-4569            |

The scheduled accounting change may not be needed. That depends on the TILA-4569 answer about VAT codes when a rate changes.

## Step 8. Shared pricing configurator

| Ticket    | Label | Title                                                                                          | Desc. | Blocked by                                 |
|-----------|-------|------------------------------------------------------------------------------------------------|-------|--------------------------------------------|
| TILA-4447 | DES   | Pricing configurator design                                                                    | own   | none                                       |
| TILA-4593 | BE    | Configurator API: permissions, groups, options, schedule a unit's group, price preview         | yes   | TILA-4545                                  |
| TILA-4595 | FE    | Pricing group list page                                                                        | yes   | TILA-4447, TILA-4593                       |
| TILA-4596 | FE    | Pricing group view page                                                                        | yes   | TILA-4447, TILA-4593                       |
| TILA-4597 | FE    | Pricing group edit page, including rule components and conditions                              | yes   | TILA-4447, TILA-4593                       |
| TILA-4598 | FE    | Price option management                                                                        | yes   | TILA-4447, TILA-4593                       |
| TILA-4601 | FE    | Price preview in the edit page                                                                 | yes   | TILA-4597                                  |
| TILA-4599 | FE    | "Own pricing" or "shared pricing group" in the reservation unit page, with a start date        | yes   | TILA-4447, TILA-4593, TILA-4572            |
| TILA-4559 | OPS   | Unit group for liikunta                                                                        | yes   | none                                       |
| TILA-4602 | OPS   | Set up the liikunta pricing groups and options                                                 | yes   | TILA-4597, TILA-4598, TILA-4559, TILA-4586 |

## Older stories

These are from before this design. They will be replaced by the tickets above. Changing them needs PO approval.

| Ticket    | Title                                             | Replaced by                     |
|-----------|---------------------------------------------------|---------------------------------|
| TILA-4439 | Correct default price for a reservation           | TILA-4544, TILA-4545            |
| TILA-4440 | Add-on services in the price list                 | TILA-4556 (surcharges)          |
| TILA-4441 | Price changes when a reservation is changed       | TILA-4545, TILA-4551            |
| TILA-4444 | Several prices and VAT rates per reservation unit | NEW options (step 5), TILA-4543 |
| TILA-4481 | Several accountings per reservation unit          | NEW web shop products (step 7)  |

## Pending Jira changes

None.
