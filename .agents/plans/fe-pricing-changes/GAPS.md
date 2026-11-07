# Gaps in the new pricing API for the customer app

Written after TILA-4575 to TILA-4579. Branch: `worktree-fe-pricing-changes`.

## Summary

The customer app no longer reads `pricings`, `lowestPrice` or `highestPrice`.
The new API did not give the data for three features, so TILA-4579 removed them.
Gaps 1 and 2 are now filled with the material price description of the price summary. Gap 3 is still open.

## 1. Material price description of a reservation unit (done)

**Status:** `PriceSummaryType` has `materialPriceDescriptionFi/En/Sv`, from the cheapest base price that has one.
The section, the tooltip and the "+ materiaalimaksu" text on search cards are back.

**Removed in TILA-4579:**

- The "Materiaalimaksu" section on the reservation unit page.
- The material price tooltip next to the price in the head of the reservation unit page.

**Before:** The text came from the active `ReservationUnitPricingNode`.

**Now:** `ReservationUnitNode.priceSummary` has no material price description.
`reservationPrice` has it on each line, but the query needs a start and an end time.
The unit page has no selected time when it loads.

**Proposal:** Add `materialPriceDescriptionFi/En/Sv` to `PriceSummaryType`.
Take them from the same BASE components that the summary uses.
If the components have different texts, the backend must pick one rule. For example, the text of the cheapest component.

## 2. Material price text on own reservations (filled for now)

**Status:** The "+ materiaalimaksu" text is back. It comes from the price summary of the reservation unit,
so it is the material price of today, not of the time of the reservation. The proposal below is still the correct fix.

**Removed in TILA-4579:** The "+ materiaalimaksu" text after the price of a reservation. This applies to the card in the reservation list,
and to the info card on the reservation page, on the cancel page and in the first edit step.
A free reservation now shows "Maksuton". Before, it showed "Materiaalimaksu".

**Before:** The text came from the active pricing of the reservation unit, not from the reservation.

**Now:** `ReservationPriceLineNode` has no material price description.
A line is a copy of the price at the time of the reservation, so the text belongs on the line too.

**Proposal:** Copy `material_price_description_*` from the price component to `ReservationPriceLine`
when the line is made, and add the fields to `ReservationPriceLineNode`.

**Still shown:** The reservation funnel and the second edit step still show "+ materiaalimaksu".
They use `reservationPrice`, which has the material price descriptions.

## 3. Future price change notice

**Removed:** The notice in the "more details" of the reservation unit page:
"Tämän kohteen hinta muuttuu {date} alkaen. Uusi hinta on {price}", with the VAT.
The translation keys `reservationUnit:futurePricingNotice` and `reservationUnit:futurePriceNoticeTax` are removed.

**Before:** The notice came from a future `ReservationUnitPricingNode` inside the reservation period
or the period of an active application round.

**Now:** `priceSummary` is for today only. A price can change in two ways:

- The reservation unit moves to another pricing group (`ReservationUnitPricingGroupNode.begins`).
- A component in the same group changes (`PriceComponentNode.validFrom` and `validUntil`).

The frontend can read both from `reservationUnitPricingGroups`.
But then the frontend must find the next change itself. This is the price logic that the new model moves to the backend.

**Proposal:** Add a field for the next change to `ReservationUnitNode`. For example:

```graphql
nextPriceChange: PriceChangeType  # null if no change is known
type PriceChangeType {
  begins: Date!
  summary: PriceSummaryType!
}
```

The backend decides how far ahead to look. Before, the limit was the reservation period of the unit
or of an active application round.

## Notes on the old `pricings` field

`ReservationUnitNode.pricings` is not kept in sync with the pricing groups.
The serializer saves `pricings` and `ownPricings` separately.
When staff save prices through `ownPricings`, `pricings` keeps the old values.
So reading `pricings` again in the customer app is not a safe workaround.

## Related open points

- **Reservations without price lines.** The backend did not make lines for old reservations.
  The customer app and the approve dialog use `price` and `taxPercentageValue` for these.
  The approve dialog sends `price` for them.
- **More than one price line in the approve dialog.** The dialog has one price input.
  With more than one line, it sends `price`. This does not happen yet.
- **`priceSummary.varies`** is not used yet. It belongs to "FE: Useampi hintarivi ja vaihteleva hinta asiakassovelluksessa".
