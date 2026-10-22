# Pricing redesign tickets

One file per ticket. "Blocked by" lists the tickets that must be done first.
Labels: BE (backend), FE (frontend), DES (design), INF (infra), OPS (operations).

## 1. Tax levels

| Ticket | Label | Title | Blocked by |
|---|---|---|---|
| [T1.1](t1.1-tax-level-models.md) | BE | Add TaxLevel and TaxLevelRate models | none |
| [T1.2](t1.2-tax-levels-in-pricings.md) | BE | Use tax levels in reservation unit pricings | T1.1 |
| [T1.3](t1.3-vat-code-to-tax-level-rate.md) | BE | Move vat_code from PaymentAccounting to TaxLevelRate | T1.1, T1.6 |
| [T1.4](t1.4-vat-by-date-of-sale.md) | BE | Pick the VAT rate by the date of the sale | T1.2 |
| [T1.5](t1.5-fe-tax-level-select.md) | FE | Tax level select in the reservation unit pricing form | T1.2 |
| [T1.6](t1.6-ops-check-vat-codes.md) | OPS | Check the VAT codes per VAT rate with finance | none |
| [T1.7](t1.7-ops-name-tax-levels.md) | OPS | Name the migrated tax levels | T1.1 |

## 2. Pricing model and data migration

| Ticket | Label | Title | Blocked by |
|---|---|---|---|
| [T2.1](t2.1-pricing-models.md) | BE | Add the pricing group, price component and price option models | T1.2 |
| [T2.2](t2.2-pricing-data-migration.md) | BE | Migrate reservation unit pricings to pricing groups | T2.1, T2.7 |
| [T2.3](t2.3-coverage-validator.md) | BE | Coverage validator for base components | T2.1 |
| [T2.4](t2.4-pricing-group-batch-api.md) | BE | Batch API to change the components of a pricing group | T2.3 |
| [T2.5](t2.5-price-calculation.md) | BE | Price calculation with pricing groups | T2.2 |
| [T2.6](t2.6-ops-verify-migrated-prices.md) | OPS | Check migrated prices in production | T2.2 |
| [T2.7](t2.7-inf-migration-timeout.md) | INF | Check that the deploy fits the data migrations | none |

## 3. Simple mode for a reservation unit's own pricing

| Ticket | Label | Title | Blocked by |
|---|---|---|---|
| [T3.1](t3.1-simple-mode-pricings-input.md) | BE | Write the reservation unit pricings input to the own pricing group | T2.2, T2.4 |
| [T3.2](t3.2-can-apply-for-discount-on-components.md) | BE | Move "can apply free of charge" to base components | T2.2 |
| [T3.3](t3.3-des-pricing-form.md) | DES | Update the reservation unit pricing form design | none |
| [T3.4](t3.4-fe-pricing-form.md) | FE | Implement the updated reservation unit pricing form | T1.5, T3.1, T3.2, T3.3 |
| [T3.5](t3.5-ops-inform-staff-pricing-form.md) | OPS | Tell staff about the changed pricing form | T3.4 |

## 4. Prices for reservers

| Ticket | Label | Title | Blocked by |
|---|---|---|---|
| [T4.1](t4.1-price-query.md) | BE | Price query for reservers | T2.5 |
| [T4.2](t4.2-price-summary.md) | BE | Price summary for lists and search cards | T2.5 |
| [T4.3](t4.3-des-customer-price-display.md) | DES | Design the price display in the customer app | none |
| [T4.4](t4.4-fe-use-price-query.md) | FE | Use backend prices in the customer app | T4.1, T4.2, T4.3 |
| [T4.5](t4.5-fe-remove-price-calculation.md) | FE | Remove price calculation from the customer app | T4.4 |

## 5. Price lines and handling

| Ticket | Label | Title | Blocked by |
|---|---|---|---|
| [T5.1](t5.1-reservation-price-lines.md) | BE | Save price lines on reservations | T2.5 |
| [T5.2](t5.2-migrate-reservation-price-lines.md) | BE | Migrate existing reservations to price lines | T5.1, T2.7 |
| [T5.3](t5.3-order-item-per-price-line.md) | BE | Send one web shop order item per price line | T5.1 |
| [T5.4](t5.4-handler-override-amount.md) | BE | Handler override per price line | T5.1 |
| [T5.5](t5.5-des-staff-price-lines.md) | DES | Design price lines in the staff reservation view | none |
| [T5.6](t5.6-fe-staff-price-lines.md) | FE | Price lines and override in the staff reservation view | T5.4, T5.5 |
| [T5.7](t5.7-fe-customer-price-lines.md) | FE | Price lines in the customer reservation details | T5.1, T4.3 |

## 6. Price options and application rounds

| Ticket | Label | Title | Blocked by |
|---|---|---|---|
| [T6.1](t6.1-price-options.md) | BE | Price options with unit group ownership | T2.1, T9.1 |
| [T6.2](t6.2-store-price-option.md) | BE | Store the selected price option | T6.1, T4.1 |
| [T6.3](t6.3-application-round-option-check.md) | BE | Application round check for price options | T6.2, T2.3 |
| [T6.4](t6.4-des-price-option-selection.md) | DES | Design price option selection | none |
| [T6.5](t6.5-fe-reservation-option.md) | FE | Price option selection in the reservation flow | T6.2, T6.4 |
| [T6.6](t6.6-fe-application-option.md) | FE | Price option selection in the application form | T6.2, T6.4 |

## 7. Web shop products per accounting and tax level

| Ticket | Label | Title | Blocked by |
|---|---|---|---|
| [T7.1](t7.1-payment-product-per-accounting.md) | BE | Web shop products per accounting and tax level | T1.3, T5.1, T7.3 |
| [T7.2](t7.2-scheduled-accounting-change.md) | BE | Scheduled accounting change in the web shop when a VAT rate changes | T7.1 |
| [T7.3](t7.3-ops-web-shop-products.md) | OPS | Confirm several products per reservation unit with the web shop team | none |

## 8. Conditions and component kinds

| Ticket | Label | Title | Blocked by |
|---|---|---|---|
| [T8.1](t8.1-total-duration-brackets.md) | BE | Total duration brackets | T2.3, T2.5 |
| [T8.2](t8.2-surcharge-components.md) | BE | Surcharge components | T2.5, T5.1 |
| [T8.3](t8.3-adjustment-components.md) | BE | Adjustment components | T8.2 |
| [T8.4](t8.4-weekday-condition.md) | BE | Weekday condition | T2.3, T2.5 |
| [T8.5](t8.5-time-of-day-condition.md) | BE | Time of day condition | T2.3, T2.5 |
| [T8.6](t8.6-recurring-date-condition.md) | BE | Recurring date condition | T2.3, T2.5 |
| [T8.7](t8.7-elapsed-time-condition.md) | BE | Elapsed time condition | T2.3, T2.5 |
| [T8.8](t8.8-lead-time-condition.md) | BE | Lead time condition | T2.3, T2.5 |

## 9. Shared pricing groups

| Ticket | Label | Title | Blocked by |
|---|---|---|---|
| [T9.1](t9.1-shared-pricing-groups.md) | BE | Shared pricing groups with unit group ownership | T2.1 |
| [T9.2](t9.2-price-preview.md) | BE | Price preview with unsaved changes | T2.4, T4.1 |
| [T9.3](t9.3-des-pricing-group-editor.md) | DES | Design the pricing group editor | none |
| [T9.4](t9.4-fe-pricing-group-editor.md) | FE | Pricing group editor | T2.4, T9.1, T9.3 |
| [T9.5](t9.5-fe-price-options.md) | FE | Price option management | T6.1, T9.3 |
| [T9.6](t9.6-fe-price-preview.md) | FE | Price preview in the pricing group editor | T9.2, T9.4 |
| [T9.7](t9.7-fe-own-or-shared-pricing.md) | FE | "Own pricing" or "shared pricing group" in the reservation unit form | T3.4, T9.1, T9.3 |
| [T9.8](t9.8-ops-liikunta-unit-group.md) | OPS | Create the sports department unit group | none |
| [T9.9](t9.9-ops-liikunta-pricing-setup.md) | OPS | Set up the sports department's pricing groups | T9.4, T9.5, T9.7, T9.8, T8.1, T6.5 |

## 10. Cleanup

| Ticket | Label | Title | Blocked by |
|---|---|---|---|
| [T10.1](t10.1-remove-old-pricing.md) | BE | Remove the old pricing models and fields | T3.1, T3.2, T5.2, T7.1, T10.2 |
| [T10.2](t10.2-fe-remove-old-pricing-fields.md) | FE | Remove the old pricing fields from the frontend | T3.4, T4.5, T5.6 |
