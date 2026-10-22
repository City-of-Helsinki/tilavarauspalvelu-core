# Pricing redesign

Entity diagram: [`pricing-redesign.excalidraw`](pricing-redesign.excalidraw).
Source price list: Liikuntapaikkavarausten hinnasto 1.6.2026 alkaen (PDF from the sports department).

## Goal

- A reservation unit can have several prices that are valid at the same time.
  The reserver selects the price option that applies to them.
- Many reservation units can share one set of prices. Staff manage it in one place.
- A reservation unit can move to another set of prices on a scheduled date.
- Prices can depend on the time of day, the day of the week, the duration, the lead time,
  and on add-ons. All of these are in the structural migration. Each one is turned on in code when it is implemented.
- VAT changes happen in one place, not on every reservation unit.
- Each price row of a reservation goes to the web shop as its own order row, with its own accounting and VAT.

## Terms

| Term                | Meaning                                                                                                                                  |
|---------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| Price option        | A label that the reserver selects. Examples: "Adults", "Juniors, seniors and special groups", "Event A, adults". One unit group owns it. |
| Pricing group       | A shared, named set of prices. Example: "Sports price category 1". Many reservation units can use it.                                    |
| Price component     | One dated rule in a pricing group: an amount, a unit and optional conditions.                                                            |
| Base component      | A component that gives the rent, in €. Exactly one base component matches each piece of a reservation.                                   |
| Surcharge component | A component that adds to the rent, in €. Example: the evening supervision fee of school gyms.                                            |
| Adjustment          | A component that changes the price by a percentage. Example: a summer discount of −20 %.                                                 |
| Tax level           | A named VAT class. Examples: "Sports" (13.5 %) and "General" (25.5 %). Staff select a level, not a percentage.                           |
| Price line          | One row of a reservation's price. It keeps a copy of the values used, so later changes do not change the reservation.                    |

## Entities

New entities are marked with (new). The diagram shows the same entities and fields.
It also shows the entities that the last phase removes, in red.

### TaxLevel (new)

- `name` (translated)

### TaxLevelRate (new)

- `tax_level` → TaxLevel
- `begins: date`
- `percentage: decimal`
- `vat_code: str`. SAP VAT code. Internal. The staff UI does not show it. Only admins edit it.
- Unique `(tax_level, begins)`.

The rate of a tax level is the rate with the latest `begins` that is on or before the **date of the sale**.
This is the legal rule for VAT changes. The date of the sale is:

- The day the web shop order is made, for a paid reservation.
  For a handled reservation, this is the day of approval or the day of a later payment.
- The day the reservation is made, for a reservation with no web shop order.

So the start date of the reservation does not affect the rate.

### PriceOption (new)

- `name`, `description` (translated)
- `is_active: bool`
- `unit_group` → UnitGroup. The organization that owns the option.

The UI shows options in name order.

Each unit group has its own options. Two unit groups can each have an "Adults" option that means different things.
A user can create and edit an option if they have a role on its unit group.
A price component can use an option only if the option's unit group is the pricing group's unit group.
So only shared pricing groups can use options. A reservation unit that needs options must use a shared group.

### PricingGroup (new)

- `name` (translated)
- `unit_group` → UnitGroup, nullable. The organization that manages the group.

A group with a unit group is **shared**. Shared groups show in the central pricing management UI.
A group with no unit group is a reservation unit's **own** group. The migration and the simple mode make these.
To share an own group, staff set its unit group.

UnitGroup already links units and gives permissions through `UnitRole.unit_groups`. So it also controls pricing groups:

- When staff select a pricing group for a reservation unit, the UI shows the shared groups whose `unit_group`
  contains the reservation unit's unit.
- A user can create and edit a shared pricing group if they have a role on its unit group.
- The permissions of an own group follow the unit of the reservation unit that uses it.

### ReservationUnitPricingGroup (new)

- `reservation_unit` → ReservationUnit
- `pricing_group` → PricingGroup
- `begins: date`
- Unique `(reservation_unit, begins)`.

The active pricing group of a reservation unit is the row with the latest `begins` that is on or before the **reservation start date**.
A non-draft reservation unit must have a row that begins on or before today. A free reservation unit has a base component with `amount=0`.
The pricing group must have coverage from the row's `begins` date (see "Coverage").

### PriceComponent (new)

One model for all three kinds. Check constraints enforce the differences.

- `pricing_group` → PricingGroup
- `kind: BASE | SURCHARGE | ADJUSTMENT`
- `valid_from: date`
- `valid_until: date`, nullable, exclusive. Null means "no end".
- `price_option` → PriceOption, nullable. Null means the component applies to every option.
- `amount: decimal`. Gross € with VAT for `BASE` and `SURCHARGE`. A percentage for `ADJUSTMENT`, and it can be negative.
- `price_unit: PriceUnit`, nullable. Existing enum. `FIXED` means once per reservation.
- `tax_level` → TaxLevel, nullable
- `accounting` → PaymentAccounting, nullable. Null on a € component means: use the reservation unit's accounting, then the unit's accounting.
- `is_adjustable: bool`. Adjustments change this component.
- `can_apply_for_discount: bool`. The reserver can apply for a discount. The reservation then goes to handling.
  It is on the component, so staff can schedule a change to it, and it can differ by price option.
  The reservation form shows the "apply for free of charge" fields if the pricing that applies to the reservation allows it.
- `material_price_description` (translated). Charges that the reserver pays later, for example materials for a 3D printer.
  The UI shows it next to the price.
- `payment_type: PaymentType`, nullable. Existing enum: online, on site or invoice. How the reservation is paid.

| Field                        | BASE                                     | SURCHARGE    | ADJUSTMENT |
|------------------------------|------------------------------------------|--------------|------------|
| `amount`                     | €                                        | €            | %          |
| `price_unit`                 | required                                 | required     | null       |
| `tax_level`                  | required                                 | required     | null       |
| `accounting`                 | optional                                 | optional     | null       |
| `is_adjustable`              | true                                     | staff choose | false      |
| `can_apply_for_discount`     | staff choose                             | false        | false      |
| `material_price_description` | optional                                 | optional     | empty      |
| `payment_type`               | required if `amount > 0`, else null      | null         | null       |
| Overlap                      | not allowed in the same group and option | allowed      | allowed    |

Conditions. All are nullable. Null means "no condition".

| Field                                      | Kind                 | Example in the source PDF                            |
|--------------------------------------------|----------------------|------------------------------------------------------|
| `weekdays: int[]`                          | Cuts the reservation | Parking area: weekday and weekend prices             |
| `time_begins`, `time_ends: time`           | Cuts the reservation | School evening supervision fee                       |
| `dates_begin`, `dates_end: (month, day)`   | Cuts the reservation | Heating season 15.12. to 15.3.                       |
| `elapsed_from`, `elapsed_to: duration`     | Cuts the reservation | Land area: first day 276 €, each extra day 138 €     |
| `min_total_duration`, `max_total_duration` | Whole reservation    | Events: 6 h or more, under 6 h                       |
| `min_lead_time`, `max_lead_time: duration` | Whole reservation    | Not in the PDF. Early booking or last minute.        |

Every condition column is in the structural migration.
The validator rejects a value in a column until the price calculation supports it.

Validation rules for one component:

- `time_begins` is before `time_ends`. A window over midnight needs two components.
- `valid_from` is before `valid_until`, `elapsed_from` is before `elapsed_to`, and the same for the other ranges.
- `price_unit` is `FIXED` if `min_total_duration` or `max_total_duration` is set.

### Payment type

A reservation is paid in one way, so it needs exactly one payment type.

- All paid base components of a pricing group that are active on the same date have the same `payment_type`.
  The coverage check also checks this. Free base components have none, so one option can be free while another is paid.
- A reservation uses the `payment_type` of the base component that matches its start.
- If a different payment type per price option is needed later, only this rule changes to "per date and option".

### Coverage

The validator checks the base components of a whole pricing group after every change. A price option is offered on a date
if a base component for it is active on that date. A base component with no option counts for every offered option.
If a date has only base components with no option, the reserver selects nothing.

- From the earliest `valid_from` in the group onward, with no end, every date has at least one offered option.
  So the last base components have no `valid_until`.
- On every date where an option is offered, its base components cover all other axes exactly once:
  weekdays, time of day, recurring dates, elapsed time, total duration and lead time.
  This includes hours when the reservation unit is closed, because opening hours come from Hauki and change.
- Price options can start and end over time. The set of options does not need to stay the same.

The check is exact. All boundaries of the base components cut each axis into ranges.
The ranges make a grid of cells, and every cell must match exactly one base component for each offered option.

### Changing prices

- Staff can edit or delete future components freely.
- On an active component, staff can only set `valid_until` to a future date.
- Past components never change. So a recalculation for an existing reservation uses the prices that were valid then.
- A price change closes components and adds replacements. Coverage holds only when both are saved together.
  So the API takes a pricing group ID and a batch of changed components. The backend merges them with the rest
  of the group from the database and validates the result. Errors can point to components that the user did not change.
- The UI design decides how staff edit. A "change prices from date X" action is one option.

### ReservationPriceLine (new)

- `reservation` → Reservation
- `price_component` → PriceComponent, nullable, `SET_NULL`
- `description` (translated). A copy of the option name and the component label.
- `quantity: decimal`, `price_unit: PriceUnit`
- `unit_amount: decimal`
- `amount_before_adjustment: decimal`
- `adjustment_percentage: decimal`. The sum of the matching adjustments.
- `amount: decimal`. The amount after adjustments.
- `override_amount: decimal`, nullable. Set by the handler. If it is set, it is the final amount of the line.
- `tax_percentage: decimal`, `vat_code: str`
- `accounting` → PaymentAccounting
- `payment_product` → PaymentProduct, nullable

There is one line per base or surcharge component. Adjustments have no lines of their own.
An adjustment can apply to components with different VAT rates, so a separate line would mix VAT rates.

The price lines are the record of the price at the time of the reservation. They are copies, not links.
A change to a price component or a tax rate does not change them. The link to the component is only for reference.
The lines change only in these cases:

- The reservation itself changes, for example a new time or a handler's override.
- A web shop order is made. Then `tax_percentage` and `vat_code` are set again from the rate on that day.
  The amounts do not change, because they include VAT.

`Reservation.price` is the sum of the final amounts. `Reservation.non_subsidised_price` is the sum without the overrides.

### Changes to existing entities

- `PaymentProduct`: new fields `reservation_unit` → ReservationUnit, `accounting` → PaymentAccounting and `tax_level` → TaxLevel.
  Unique `(reservation_unit, accounting, tax_level, merchant)`.
  The web shop makes the product ID from these same values (see "Web shop products and accounting").
  So each product belongs to exactly one combination, and a separate link table would add nothing.
- `PaymentAccounting`: no `vat_code`. The VAT code comes from `TaxLevelRate`.
- `Reservation`: `price_option` → PriceOption, nullable. Price fields as above. No `tax_percentage_value` and no `unit_price` after the last phase.
- `ApplicationSection`: `price_option` → PriceOption, nullable.
- `ReservationUnit`: no `payment_product`, after the last phase.
- `ReservationUnit`: no `can_apply_free_of_charge`. The value moves to `can_apply_for_discount` on its base components.
- `ReservationUnitPricing` and `TaxPercentage` are removed in the last phase.

## Price calculation

Inputs: reservation unit, price option, begin, end, and the creation time.

1. Find the active pricing group by the reservation start date.
2. Keep the components of the group where `price_option` is null or equal to the selected option.
3. Keep the components whose whole-reservation conditions match: total duration and lead time.
4. Cut the reservation into pieces. Cut at local midnight, at `valid_from` and `valid_until`,
   and at every boundary of `weekdays`, `time_*`, `dates_*` and `elapsed_*`.
5. For each piece:
   1. Find the one base component that matches. Coverage makes sure there is one.
      If there is none, the price cannot be calculated and the reservation is not allowed.
   2. Add the base and the matching surcharges with `is_adjustable=true`.
   3. Add up the percentages of the matching adjustments. The total cannot go below −100 %.
      Apply it to the sum of step 2.
   4. Add the matching surcharges with `is_adjustable=false`.
6. Add the pieces together per € component. A `FIXED` component counts once. Other units count the duration of the matching pieces.
   Round the total duration up to the next 15 minutes, the same as now. Units of a day or more count each started unit.
7. Make one price line per € component. Get the tax rate and VAT code from the tax level by today's date.
   The web shop order sets them again on the day it is made.
   Get the accounting from the component, then the reservation unit, then the unit.

## Discounts

- The reserver can apply for a discount if any base component that matches the reservation has `can_apply_for_discount`.
  A reservation over the date of a change matches two base components. "Any" means the reserver keeps the right to apply.
- The handler sets `override_amount` per price line. So the handler can make one part free and keep another part paid,
  or correct a wrong price. The override is applied after adjustments.
- The staff UI offers "free of charge" at first. It sets every override to 0. Any value works in the backend.
- Adjustments are rules in the pricing group and apply automatically. The handler's override is a decision for one reservation.

## API and UI

### Reservation unit's own pricing (simple mode)

Most reservation units have one price with no options and no conditions. The current staff form fits this case.
It edits the active pricing and one future pricing. Each pricing maps to one `BASE` component with no option and no conditions.

- The reservation unit mutation keeps a `pricings` input. The backend writes it to the unit's own pricing group
  (no unit group) as base components. It sets `valid_until` from the next pricing's `valid_from`.
- The backend accepts this input only if the group is an own group and has only base components with no option and no conditions.
- Changes to the current form:
  - Remove `lowestPrice` and the net price fields.
  - The tax percentage select becomes a tax level select.
  - Remove the `isActivatedOnBegins` checkbox.
  - Move the "can apply for free of charge" checkbox from the reservation unit into each pricing.
- The reservation unit form has one choice: "own pricing" (this form) or "shared pricing group" (a select of the
  shared groups that the reservation unit's unit can use).

### Pricing groups (full mode)

A new pricing group editor with its own mutations. It edits all component kinds, options and conditions.
It saves changes as a batch (see "Changing prices").

- Staff manage price options in the same part of the staff app as pricing groups.
  The designer decides if it is the same page or a separate one.
- The editor has a price preview. Staff select a price option, a date and a time range, and see the price lines
  that a reservation would get. It uses the same calculation as the price query, on the group's saved components
  merged with the unsaved batch. So staff see a mistake before they save.
  This catches mistakes that the validator cannot see, for example the same surcharge added twice.
- Tax levels and tax level rates are managed only in the Django admin.

### Prices for reservers

The customer app calculates prices itself today, from `highestPrice`, `lowestPrice` and `priceUnit`
(`getPriceString` in `frontend/apps/customer/src/modules/reservationUnit.ts`).
This cannot work with options, conditions, surcharges or adjustments.

- The backend gives a price query: the price for a reservation unit, a price option and a time range.
  It returns the price lines that a reservation would get, and if the reserver can apply for a discount.
- The backend gives a summary for lists and search cards, for example "from 20 €/h".
- Every customer view that shows a price uses these. This applies to all reservation units, not only shared pricing groups.

## Application rounds

- An applicant selects a price option for each application section.
- An application round accepts only reservation units whose pricing groups offer the same set of price options
  on every date of the round's reservation period. The groups can be different.
  Example: "Sports price category 1" and "Sports price category 3" have different prices but the same options,
  so units from both can be in one round.
- The offered options come from the base components, because each base component links to an option.
  The check runs when the round is created and when a unit is added to it.
- A change of pricing group or of base components inside that period must keep those options offered.
  The validators of `ReservationUnitPricingGroup` and of the coverage check test this against open application rounds.

## Web shop products and accounting

Facts from the web shop code (`City-of-Helsinki/verkkokauppa-core`):

- The product ID is `UUID3(UUID3(namespace, namespaceEntityId), merchantId)`.
  So the product is fixed by the namespace, the entity ID and the merchant.
  [ProductMappingService.java](https://github.com/City-of-Helsinki/verkkokauppa-core/blob/master/productmapping/src/main/java/fi/hel/verkkokauppa/productmapping/service/product/ProductMappingService.java)
- The web shop keeps one accounting per product, with `vatCode`.
  It also has `activeFrom` and `nextEntity` for a scheduled accounting change. Varaamo does not use them.
  [ProductAccounting.java](https://github.com/City-of-Helsinki/verkkokauppa-core/blob/master/productapi/src/main/java/fi/hel/verkkokauppa/product/model/ProductAccounting.java)
- Each order item has its own accounting copy.

Design:

- One web shop product per `(reservation unit, accounting, tax level, merchant)`. Each one is a `PaymentProduct` row.
  When the merchant changes, the web shop gives a new product ID, so a new row is made.
  The old row stays for old orders and refunds.
- `namespaceEntityId` is `"<reservation unit pk>"` for the reservation unit's own accounting and the default tax level.
  This keeps the existing product IDs. Other combinations use `"<reservation unit pk>:<accounting pk>:<tax level pk>"`.
- The product accounting sends the `vat_code` of the tax level's current rate.
  When a new `TaxLevelRate` is added, a task sends `nextEntity` with `activeFrom` set to the rate's `begins` date.
- An order has one item per price line that has a positive final amount.

## Migration of existing data

The structural migration does this in one go:

1. Make one TaxLevel for each enabled TaxPercentage value in use. Name them by the percentage. Staff rename them later.
   Each gets one TaxLevelRate. The VAT code comes from the accountings that use that percentage.
   If accountings disagree, the migration stops and lists them.
2. For each reservation unit with pricings: make one own PricingGroup (no unit group), named after the reservation unit,
   and one ReservationUnitPricingGroup with the date of its first pricing.
3. For each ReservationUnitPricing: make one `BASE` PriceComponent with `valid_from=begins`,
   `valid_until` equal to the `begins` of the next pricing of the same reservation unit (null for the last one),
   `price_option=null`, `amount=highest_price`, the same `price_unit`, and the matching tax level.
4. `can_apply_for_discount` on a base component is true if the reservation unit has `can_apply_free_of_charge=True`
   and the pricing has `highest_price>0`.
   `payment_type` and `material_price_description` are copied from the pricing.
5. Pricings with `is_activated_on_begins=True` exist only for VAT changes. They become a TaxLevelRate on their `begins` date,
   and not a new component, if the amount did not change. The previous component then continues.
6. Existing reservations get one price line from their current price fields. If `price` is lower than
   `non_subsidised_price`, the line gets `override_amount=price`.
7. Each existing PaymentProduct gets the reservation unit that links to it with `ReservationUnit.payment_product`,
   that reservation unit's accounting (or its unit's accounting), and the tax level of its active pricing.

## Open questions

- Does SAP require that a product's VAT code matches the `vatPercentage` of the order item?
  The design keeps them from one row, so they match on the Varaamo side.
- Does `ProductMappingController` handle entity IDs that are not numbers?
  `findByNamespaceEntityId` returns one mapping. A string ID is unique, so I think it works. Test it in phase 5 against the test web shop.
