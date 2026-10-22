# Migrating AllocationCalendar to WeeklyPatternCalendar

Status: plan only, nothing implemented. Written 2026-10-22 after reading the code. Decisions settled 2026-10-23.

Goal: replace the custom `CalendarDay` grid in
`frontend/apps/staff/src/lib/application-rounds/[id]/allocation/AllocationCalendar.tsx` with
`WeeklyPatternCalendar` (`frontend/packages/ui/src/components/WeeklyPatternCalendar/`). This is the last
open item in the TODO of [ADR 0001](adr/0001-one-shared-calendar-built-in-house.md).

Terms: Selection, Highlight, Demand, Fulfilled, Allocation, Affecting Allocation and Application Section are
defined in [GLOSSARY.md](../GLOSSARY.md). This plan uses those words and no synonyms.

The ordered steps to build it are in
[allocation-calendar-implementation-steps.md](allocation-calendar-implementation-steps.md). This document holds the
what and the why. That one holds the how and the order.

## What the allocation view does today

1. **Demand.** Per 30-minute cell, counts the Application Sections whose Suitable Time Ranges cover it.
   Ranges are filtered by the `priorityFilter` search param first. Colour buckets: 1, 2-4, 5-10, more than 10.
   Each cell shows the number.
2. **Allocated.** Cells allocated on this reservation unit (any section) show a check icon and the
   "allocated" colour. This wins over every other layer.
3. **Affecting.** Affecting Allocations show a check icon and the "allocated elsewhere" colour. They also block
   allocating: `AllocationColumn` computes `doesCollideToOtherAllocations`.
4. **Highlight.** `?aes=<section pk>` outlines a section's Suitable Time Ranges (dashed) and its Allocations
   (solid). `?allocated=<slot pk>` outlines an Allocation. The two params are mutually exclusive
   (`useFocusApplicationEvent`, `useFocusAllocatedSlot` in `hooks.ts`).
5. **Selection.** Mouse down starts a single-day range, dragging extends it, mouse up ends it.
   State lives in `SelectedSlotsContext` as `{day, begins, ends}` hour floats, where `ends` is the start of the
   last 30-minute slot. `useSlotSelection` exposes it as `"day-hour-min"` string keys. `AllocationColumn`,
   `AllocationCard` and `useAcceptSlotMutation` all consume those keys.
6. **Grid.** Monday to Sunday, 07:00-24:00 (`ALLOCATION_CALENDAR_TIMES = [7, 23]`), 34 rows, every cell open,
   mouse only. There is no keyboard or screen reader access.

Other things worth knowing:

- Two steps upstream already filter what the grid may count. The query asks `suitableTimeRanges(fulfilled: false)`,
  and the page empties the ranges of a section whose option for this unit is locked or rejected. So the builder gets
  data that is already filtered, and the "unhandled only" filter in the grid does nothing. A Fulfilled range belongs
  to a section that can no longer be allocated, or that already has an overlapping Allocation.
- Affecting Allocations are wider than "other units that share a space". `affecting_allocations` in the backend uses
  the `reservation_unit_hierarchy` view, which holds the unit itself plus every unit that shares a space or a
  resource with it. It also spans every application round whose reservation period overlaps. So an Affecting
  Allocation can be on this very unit, for a section that the current text search hides.
- The `00:00` end time means 24:00 (`isInsideCell`, `isInsideSelection`). `endTimeToMinutes` in
  `packages/ui/src/modules/suitableTimes.ts` already handles this.
- A drag stays on the day it started. Each `CalendarDay` has its own `isSelecting` state, so entering another
  day does nothing. Releasing the mouse outside a slot leaves that day in selecting mode (a small existing bug).
- `isSlotDeclined` is hard-coded to `false`, so the declined style and `IconCross` are dead code.
- `?allocated=<pk>` outlines every Allocation that its reservation unit option has on that weekday, not only the
  chosen one (`AllocationCalendar.tsx:301-309`). The new builder gives one Allocation its own Highlight.
- Colours and thresholds are CSS variables `--tilavaraus-allocation-calendar-colour-*` in
  `apps/staff/src/styles/variables.css`. Keep them.
- Staff already uses `WeeklyPatternCalendar` read only in `apps/staff/src/components/TimeSelector.tsx`.
- `force: true` in the create mutation only skips the duration, weekday and suitable range checks. The backend still
  refuses an overlap. So a wrong collision check in the UI causes an error toast, not a double allocation.
- The grid is 30-minute today, but a Suitable Time Range can begin or end at a quarter hour, and an Allocation only
  has to be a multiple of 15. So the grid already draws some requests and some Allocations wrongly.
- A begin time must match the unit's start interval, capped at 30 minutes. An end time only has to be a multiple of
  15. So the two ends of an Allocation have different rules.

## Decisions

1. **Select mode belongs in the library.** A faked Selection would have to be painted into `value`, which holds
   Demand, and it would take on paint behaviour, because `paintModeFor` erases a cell that already holds the brush.
2. **One rule for "a section wants this time".** A section counts for a cell or a Selection when one of its ranges
   overlaps it. Today Demand and the cards use two different rules, neither of them overlap. At a 15-minute step
   all three rules agree, because every range boundary is a multiple of 15 and so lands on a cell boundary. So this
   is a tidy-up, not a fix: one rule in one place, and one invariant the builder tests lock down, which is that the
   number in a cell equals the number of request cards you get when you select only that cell.
   The behaviour fix next to it is real. The column ignores the priority filter that Demand applies, so a cell can
   read 2 while selecting it lists 3 cards.
3. **The builder resolves precedence.** Each cell gets one state, which is allocated, affecting, or Demand with a
   count. `data` holds what the user sees, the default shallow `isDataEqual` works, and runs join by what the user
   sees. The cost is that a label cannot say "allocated, and 2 others still want this". Nobody can see that today.
4. **Hours extend, they do not clip.** ADR 0001 says painted spans extend the grid. Clipping would hide Demand, and
   worse, hide an Affecting Allocation, so a Selection at the edge could look free when it is not. 07:00-24:00 stays
   the minimum. The builder returns the extent, and both the grid and the selects in the column use it. The extent
   also covers the current Selection, so a poll cannot push the Selection out of view.
5. **Two old bugs get fixed on the way.** See "Bugs fixed on the way".
6. **Affecting cells get their own shape.** Today allocated and affecting cells differ only by background colour,
   which ADR 0001 forbids. Allocated keeps the check icon. Affecting takes a lock icon. The legend is therefore not
   optional.
7. **Rows are 24px and the whole day shows.** 68 rows make about 1632px, against about 1430px today, so the page
   grows by about 14 percent. There is no inner vertical scroll. 24px is the WCAG 2.5.8 minimum target, so it is
   the floor. The customer funnel instead uses 12px rows inside a 500px scrolling box, which is below that floor.
   The header shows short weekday names, because "keskiviikko" does not fit a 60px column. Screen readers still get
   the long name.
8. **The alternative form is the column's selects.** A weekday select joins the start and end selects, and the three
   are always visible, not behind the "Muuta aikaa" toggle. The skip link lands on the weekday select. Demand stays
   readable through the cell labels, so there is no separate text table of Demand.
9. **Everything lands before the audit.** ADR 0002 says the City or an outside auditor checks the Calendar before any
   old calendar is removed. This branch has already removed old calendars, so that means before `add-master-calendar`
   merges. Every phase lands as a commit on this branch, so the audit covers select mode too. Step 4.1 moves before
   phase 3, because the swap is simpler when the context already speaks in intervals.
10. **Select mode is a controlled pair.** `selection: WeekdayInterval | null` and `onSelectionChange(next)`, with no
    return value, as edit mode is a controlled pair. The allocation view never refuses a Selection, because staff
    select allocated and affecting cells to read their cards. If a refusal is ever needed, an optional validator prop
    can be added without breaking a consumer. The callback style of the sibling calendars, which returns a refusal
    reason, cannot be added later without changing every call site.
11. **`isValidSelection` becomes `isValidPaint`.** After the split "selection" means the select mode range, and that
    prop refuses a paint.
12. **`aria-selected` splits by mode.** In select mode it marks only the Selection, so a Demand cell is never read as
    selected. In editable and read only mode it still marks a painted cell, which keeps the customer tests and
    checklist item 7 valid.
13. **A Selection can shrink.** Shift with Arrow Up or Down moves the end that focus is on and leaves the other end.
    The paint sweep can only grow, so select mode needs its own model with an anchor, like the pointer drag.
14. **The fit rule is the backend's rule.** A Selection fits a section when it lies fully inside one merged range of
    that section's ranges on that weekday. The card warning today checks one range at a time, so a Selection across
    two touching ranges, such as primary 10:00-11:00 next to secondary 11:00-12:00, wrongly warns. The priority
    filter decides which cards show, not whether a time fits. The mutation takes the weekday from the Selection.
15. **The Selection and the Highlight differ by shape.** Today both use a 2px solid black frame, and the new grid adds
    a 3px focus ring on top. The Selection gets a tint and a 3px solid frame around the whole run. A highlighted
    range keeps a dashed frame. A highlighted Allocation gets a double frame. A cell's state word says when the cell
    is in the Highlight, because `aria-selected` already covers the Selection.
16. **The Selection clears when the reservation unit changes.** Today it survives, because it is React state that
    nothing resets, and the right column then shows cards for a different unit at the same time. A Selection means
    "this time on this unit". The Highlight clears with it. Both stay when only the filters change.
17. **The step is 15 minutes for every unit.** This is a requirement, and it is also a correctness fix. A Suitable
    Time Range may begin or end at a quarter hour, because the database allows `:00`, `:15`, `:30` and `:45`, and
    the customer funnel now paints at 15 minutes. A 30-minute grid cannot draw a 10:15 to 10:45 request at all, so
    it misrepresents Demand. Taking the step from the unit's own interval was rejected. It would reshape the grid
    between tabs, change what a Demand cell means per tab, and still draw a quarter-hour request wrongly on a
    30-minute unit. The unit's interval limits what can be allocated, not what can be shown or selected.
    The grid becomes 68 rows, the same size the customer funnel already paints.
18. **A begin time the unit refuses is warned about, not blocked.** The backend caps the staff start interval at 30
    minutes (`is_valid_staff_start_interval`), so on a unit whose interval is 30 or 60 a begin time of 10:15 is
    refused. An end time only has to be a multiple of 15, so an end at `:45` is always legal, and a 10:00 to 10:45
    allocation is now possible everywhere. Staff may select a begin time the unit refuses. The card then shows an
    inline warning and disables the allocate button, exactly as a wrong duration already does. This needs no
    refusal in the library, so decision 10 stands. Refusing the Selection in the grid was rejected, because it
    would also stop staff selecting an allocated or an affecting cell to read its cards.
    This is the one change that needs the API: `reservationStartInterval` is required in the schema but is not in
    the allocation query.

## Gaps in WeeklyPatternCalendar

| Gap | Today | Needed |
|---|---|---|
| Selection without editing | `readOnly` disables all gestures. Painting writes to `value`. | Select mode: `selection`, `onSelectionChange`, and `value` never written. |
| `selected` means "painted" | `aria-selected` follows `data !== undefined`. | Split into `painted` and `selected`. In select mode only the Selection is selected. |
| Cell content | Hard-coded hour or run labels. | A `renderCellContent(cell)` override for the count and the icons. |
| Layers | One `data` value per cell. | One resolved state per cell from the builder. The default `isDataEqual` then works. |
| Highlight | None. | Pass `data-` attributes through the existing `getCellProps` and style them in the staff app. No new library prop. |
| Sizing | Root has `height: 500px`, table `min-width: calc(30px + 7 * 110px)`, rows 12px. | CSS variables (`--day-min-width`, `--step-height`) and no forced height. 1632px would not fit a fixed 500px box. |
| Weekday names | Always long (`WeeklyPatternCalendar.tsx:139`). | A prop for short visible names, with the long name kept for screen readers. |
| Visible hours | Already extends for painted spans. | Keep. The consumer passes the extent it wants as the minimum. |

Stays as is: `useGridNavigation` (keyboard model), single-day gestures, window-level pointer up,
`availability` (pass all 7 days open for parity).

## Steps

The ordered, commit-sized steps live in
[allocation-calendar-implementation-steps.md](allocation-calendar-implementation-steps.md), so the order is written
down in one place only. In outline: the shared calendar in `packages/ui` first, then the pure builder and the new
state shape beside the old grid, then the swap, then the column and the words, then the clean-up and the checks.

## Finnish strings

Staff ships only the Finnish locale. These are drafts, to be corrected by a native speaker.

State words, which appear in the cell label after the weekday and time range:

| State | Word |
|---|---|
| No Demand | `Ei vuorotoiveita` |
| Demand, one | `1 vuorotoive` |
| Demand, many | `{{count}} vuorotoivetta` |
| Allocated here | `Jaettu vuoro` |
| Affecting Allocation | `Estynyt, aika on jo jaettu` |

A cell in the Highlight adds `korostettu`, for example `3 vuorotoivetta, korostettu`.

Announcements: `Valittu` and `Valinta poistettu`. The library appends the weekday and the time range.

Status line, for example: `Maanantai 10:00-11:00. 3 vuorotoivetta, 1 jaettu vuoro.`

Card warning when the unit refuses the begin time, beside the two duration warnings that already exist:
`Aloitusaika ei kelpaa tälle tilalle`.

Legend: `1 vuorotoive`, `2-4 vuorotoivetta`, `5-10 vuorotoivetta`, `Yli 10 vuorotoivetta`, `Jaettu vuoro`,
`Estynyt`, `Valittu aika`, `Hakijan vuorotoiveet`, `Hakijan jaettu vuoro`.

## Behaviour changes to expect

- The grid is 15-minute, so a quarter-hour request is drawn where it really is, and staff can select and allocate
  quarter-hour times. An end at `:15` or `:45` works on every unit. A begin at `:15` or `:45` works only on a
  15-minute unit, and the card says so when it does not.
- The grid is 68 rows instead of 34, and about 1632px tall against about 1430px today.
- Rows get shorter, 24px against 42px today. 24px is the WCAG 2.5.8 minimum target.
- A drag ends on a window-level pointer up, which fixes the stuck drag.
- A drag can now shrink. Today it only grows.
- The grid becomes keyboard and screen reader usable.
- Demand and the request cards agree, because they share one rule and one filter.
- The grid grows past 07:00-24:00 when an Allocation or a request falls outside it.
- The Selection clears when the reservation unit changes.
- Touch can tap one cell but cannot drag a range. A tap-start, tap-end range would be a follow-up.

## Bugs fixed on the way

- The 30-minute grid cannot draw a quarter-hour time. A 10:15 to 10:45 request is drawn as 10:30 to 11:00, and an
  Allocation at 10:00 to 10:45 is drawn as 10:00 to 11:00. The customer funnel now paints at 15 minutes, so this
  data exists.
- `getRelatedTimeSlots` (`applicationRoundAllocation.ts:233`) reads an end time of `00:00` as minute 0, so an
  Affecting Allocation that ends at midnight is never drawn and never blocks a Selection.
- The collision check (`AllocationColumn.tsx:347`) compares against the start of the last selected slot. Select
  10:00-11:00 with an Affecting Allocation starting at 10:30 and the button stays enabled.
- The card warning checks one range at a time, so a Selection across two touching ranges wrongly warns.
- `?allocated=<pk>` highlights every Allocation its option has on that weekday, not only the chosen one.

In every case the backend still refuses a bad allocation, so these cause wrong display or an error toast.

## Tests and checks

- Unit tests cover the builder, the select mode keyboard flows, the live region text, and axe in select mode.
- The pointer drag, the 24px target size and the focus ring stay manual checks in the checklist. Playwright is not
  set up yet, and ADR 0002 says it starts with the Dated Week.

## Key files

- `frontend/apps/staff/src/lib/application-rounds/[id]/allocation/` - `AllocationCalendar.tsx`,
  `AllocationColumn.tsx`, `AllocationCard.tsx`, `ApplicationEventCard.tsx`, `ApplicationEvents.tsx`, `hooks.ts`,
  `SelectedSlotsContext.tsx`, `modules/applicationRoundAllocation.ts`
- `frontend/packages/ui/src/components/WeeklyPatternCalendar/` - `WeeklyPatternCalendar.tsx`,
  `useWeeklyPatternCalendar.ts`, `engine.ts`, `styles.tsx`, `types.ts`
- `frontend/packages/ui/src/components/CalendarGrid/useGridNavigation.ts`
- `frontend/packages/ui/src/modules/suitableTimes.ts`
- `frontend/apps/staff/src/components/TimeSelector.tsx` (existing read-only usage)
- `backend/tilavarauspalvelu/models/allocated_timeslot/queryset.py` (what an Affecting Allocation is)
- `backend/tilavarauspalvelu/models/suitable_time_range/queryset.py` (the fit rule)
