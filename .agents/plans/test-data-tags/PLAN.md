# Test data tags for finding reservation units

## Goal

Find local test reservation units by their properties in the customer search.
Example: "requires payment" AND "has material price" AND "has cancellation rule".

Today the only label is the reservation unit type (`Ilmainen`, `Maksullinen`, `Kausikäyttöinen` ...).
A unit has only one type. The type cannot say "paid with material price and cancellation rule".

## Current state

- Test data: `backend/tilavarauspalvelu/management/commands/data_creation/create_reservation_units.py`.
  - Each `_create_*_reservation_units` function makes one type and many combinations.
  - `_create_reservation_units` gives each unit a random subset of intended uses and equipments at the end (line ~203).
- Intended uses: `_create_intended_uses` in `create_reservation_related_things.py`. Ten real purposes with images.
- Equipments: `_create_equipments` in the same file. 30 random factory names in 10 random categories.
- Filter: `backend/tilavarauspalvelu/api/graphql/types/reservation_unit/filtersets.py`.
  - `intended_uses = IntMultipleChoiceFilter()` is OR.
  - `equipments = IntMultipleChoiceFilter(conjoined=True)` is already AND.
- Customer search (`frontend/apps/customer/src/pages/search/index.tsx`) sends `intendedUses` and `equipments`
  straight to the GraphQL filter. No frontend change is needed for either.
- Robot test data (`create_robot_test_data.py`) sets its own intended uses with `.set([...])`. New tags do not affect it.
- Nothing in frontend or e2e code depends on the type names.

## Decision: intended uses or equipments

Recommendation: use equipments.

| | Intended uses | Equipments |
|---|---|---|
| AND search | Needs a new setting and filter change in production code | Works today |
| Customer front page | Tags show as purpose cards without images | Not shown |
| Search form label | "Käyttötarkoitus" | "Varustelu" |
| Current data lost | Ten real purposes stay, tags are added | Random factory equipments go away, nobody uses them |

The equipments route keeps all changes in test data. This matches the project rule to not add code for needs the service does not have.
If you want intended uses anyway, see "Intended uses route" below.

## Plan (equipments route)

1. In `_create_equipments`, replace the random factory data with one category `Testidata`
   and one equipment per tag. Give fi, en and sv names.
2. Add a function `_add_test_data_tags()` that runs after all reservation units exist.
   It reads the real fields of each unit, so the tags are always true. It does not need changes in each `_create_*` function.
   It bulk creates rows in `ReservationUnit.equipments.through`.
3. Remove `reservation_unit.equipments.add(*random_subset(equipments))` from `_create_reservation_units`.
4. Keep reservation unit types as they are. The staff UI filters and the unit table use them.

### Tags and the field that sets each one

| Tag (fi) | Rule |
|---|---|
| Maksuton | Active pricing has `highest_price == 0` |
| Maksullinen | Active pricing has `highest_price > 0` |
| Materiaalimaksu | Active pricing has a non-empty `material_price_description` |
| Pitkä materiaalimaksu | Description equals `LONG_MATERIAL_PRICE_INFO.fi` |
| Peruutettava | `cancellation_rule` is not null |
| Ei peruutettava | `cancellation_rule` is null |
| Vaatii käsittelyn | `require_reservation_handling` is true |
| Maksuton käyttö haettavissa | `can_apply_free_of_charge` is true |
| Kulkukoodi | Active access type is `ACCESS_CODE` |
| Kausivaraus | `reservation_kind` is `SEASON` or `DIRECT_AND_SEASON` |
| Vahva tunnistautuminen | `authentication` is `STRONG` |

Check the field names on `ReservationUnitPricing` and `ReservationUnitAccessType` when you write the queries.
Use the pricing and access type that is active today, as the models define it.

### Check

- `just` command for test data creation (see `just help`), then open the customer search.
- Select Maksullinen + Materiaalimaksu + Peruutettava. Expect only paid toilets with both properties.
- Test data creation has no unit tests. Only check it by hand.

## Intended uses route

Same steps 2 to 4, but the tags go into `_create_intended_uses` without images, and the rows go into `intended_uses.through`.
The random purpose assignment can stay.

AND search needs a backend change:

1. Add a setting in `backend/config/settings.py`, for example `RESERVATION_UNIT_INTENDED_USES_MATCH_ALL = False` in `Common`.
   Set it from the env locally.
2. In the filterset, change `intended_uses` to a method filter.
   If the setting is true, chain one `.filter(intended_uses=pk)` per pk. Otherwise keep the current OR behaviour.
   Do not use `conjoined=settings.X`. The class reads it at import, so tests cannot override it.
3. Add a test in `backend/tests/test_graphql_api/test_reservation_unit/test_filtering.py` for both values of the setting.

Downsides:
- A local-only switch in production filter code. Production never turns it on.
- The customer front page (`apps/customer/src/lib/index/IntendedUses.tsx`) shows all intended uses as cards.
  About ten tag cards without images will show there locally.
