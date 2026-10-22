# Allocation calendar: implementation steps

Status: not started. Written 2026-10-23.

The what and the why are in [the migration plan](allocation-calendar-migration-plan.md). The decisions are numbered
there, and this document points at them as "decision N". The words are defined in [GLOSSARY.md](../GLOSSARY.md).

Every step is one commit. Each one keeps the apps working, so the branch is never broken in the middle.

Commands: `just fe test`, `just fe lint`, `just fe lint-css`, and `just fe test-watch ui` while you work.
The backend needs no change. One query field is added in step 10, which needs `just fe codegen-staff`.

## Order and why

Steps 1 to 6 change the shared calendar in `packages/ui` and touch no app behaviour. Steps 7 and 8 add the new
pure code and the new state shape beside the old grid, which still runs. Step 9 is the swap, and it is the first
step a user would notice. Steps 10 to 14 finish the column and the words. Steps 15 to 18 clean up and check.

Step 8 comes before step 9 on purpose (decision 9). The swap is much simpler when the context already speaks in
intervals.

The grid is 15-minute throughout (decision 17), which is 68 rows. The customer funnel already paints a grid that
size, so the library is proven at it.

## Library steps

### 1. Rename `isValidSelection` to `isValidPaint`

Decision 11. Do this first, so "selection" is free to mean the Selection.

- Files: `WeeklyPatternCalendar/types.ts`, `useWeeklyPatternCalendar.ts`, `WeeklyPatternCalendar.tsx`,
  `WeeklyPatternCalendar.test.tsx`.
- No app uses the prop, so nothing outside the package changes. ADR 0003 already carries the new name.
- Done when `just fe lint` finds no reference to the old name.

### 2. Split `painted` from `selected`

Decision 12.

- `WeeklyPatternCellInfo` gets both fields. `painted` is the old meaning, which is `data !== undefined`.
  `selected` is what `aria-selected` reports.
- In editable and read only mode `selected` equals `painted`, so nothing changes yet.
- `getCellContent` in `WeeklyPatternCalendar.tsx` switches to `painted`. The `data-selected` attribute follows
  `selected`, and a new `data-painted` follows `painted`, because the styles key off the paint.
- Files: `types.ts`, `useWeeklyPatternCalendar.ts` (`cellInfo`), `WeeklyPatternCalendar.tsx`, `styles.tsx` if it
  reads `data-selected`.
- Tests: `WeeklyPatternCalendar.test.tsx`. The customer tests in
  `apps/customer/src/components/application/funnel/TimeSelector.test.tsx` must pass untouched. If they need an
  edit, the split is wrong.
- Done when `just fe test` passes with no change to any customer test.

### 3. Make the size overridable

Decision 7.

- In `WeeklyPatternCalendar/styles.tsx` replace the fixed values with variables that keep today's numbers as the
  default: the root height, the day column minimum width, and `--step-height`.
- The customer funnel and the staff application view pass nothing, so they must look exactly as before.
- Tests: none. This is visual.
- Done when the customer funnel and the staff application view are unchanged in the browser.

### 4. Add `renderCellContent`

- An optional prop that replaces what a cell shows. The current function stays as the default.
- Files: `types.ts`, `WeeklyPatternCalendar.tsx`.
- Tests: one test that a custom renderer is used, and one that the default still applies without the prop.

### 5. Show short weekday names

Decision 7.

- A new optional prop chooses long or short visible names. Long stays the default.
- The visible text is the short name. The `th` keeps the long name through `aria-label`, the same way the hour
  `rowheader` already does. The cell label keeps using the long name, so speech does not change.
- Files: `types.ts`, `WeeklyPatternCalendar.tsx`. `weekdayNames(locale, "short")` already exists.
- Tests: the column header's accessible name is still the long weekday name when short names are shown.

### 6. Add select mode

Decisions 1, 10, 12 and 13. This is the large one. Keep it to the library and its tests.

- A third props variant beside `EditableProps` and `ReadOnlyProps`, holding `selection: WeekdayInterval | null`,
  `onSelectionChange(next: WeekdayInterval | null)`, and the two required words for chosen and cleared. There is
  no return value, so a refusal can be added later as an optional prop without breaking a call site.
- The grid never calls `onChange` in this mode, and `value` is still drawn.
- `selected` in `cellInfo` now means "inside the Selection". `painted` is unchanged.
- Gestures:
  - A pointer press starts a Selection, dragging moves its open end, and release commits. The press alone chooses
    one cell. A touch tap chooses one cell. Reuse the existing window level `pointerup` listener.
  - Enter or Space chooses the focused cell and replaces the Selection.
  - Shift with Arrow Up or Down moves the end that focus is on and leaves the other end. So the Selection can grow
    and shrink. The paint sweep cannot shrink, so this needs its own anchor, held like the pointer gesture's anchor.
  - Escape clears the Selection.
  - Plain arrows move focus and keep the Selection.
  - A Selection cannot start on a closed cell or cross one.
- Expose `data-selection-start` and `data-selection-end` so an app can style the ends of the run.
- Every committed change is announced in the live region, with the weekday and the time range appended, as the
  paint announcements already are.
- Files: `types.ts`, `useWeeklyPatternCalendar.ts`, `WeeklyPatternCalendar.tsx`, `styles.tsx`.
- Tests in `WeeklyPatternCalendar.test.tsx`: each gesture above, that `onChange` is never called, that
  `aria-selected` marks only the Selection, that a Demand cell with data is not announced as selected, the live
  region text, and axe in select mode.
- Done when `just fe test` passes and the customer and staff application views still behave as before.

## Staff app steps

### 7. Add the pure builder

Decisions 2, 3, 4 and 14. No UI change, so the old grid keeps running.

New module `apps/staff/src/lib/application-rounds/[id]/allocation/modules/allocationPattern.ts`:

- `toAllocationPattern({ sections, affecting, priorityFilter, selection })` returns the
  `WeeklyPatternValue<AllocationCellData>` and the extent. One resolved state per cell, with precedence allocated,
  then affecting, then Demand with a count.
- It takes the flat affecting list from the query, not a day indexed array. `getRelatedTimeSlots` goes away with
  it, and so does its midnight bug.
- A section counts for a cell when one of its ranges overlaps the cell. The ranges are filtered by
  `priorityFilter` first. Do not filter by section status. The query already asks for unfulfilled ranges only, and
  the page already empties the ranges of a locked or rejected option.
- No rounding or snapping is needed. Every boundary in the data is a multiple of 15, because a Suitable Time Range
  is constrained to `:00`, `:15`, `:30` and `:45` by a database check, and an Allocation is validated as a multiple
  of 15. At a 15-minute step every span lands exactly on cell boundaries.
- The extent is the union of 07:00-24:00, every span, and the current Selection. The Selection is included so a
  poll cannot push it out of view.
- `toHighlightRanges(...)` returns `{ weekday, beginMinutes, endMinutes, kind }` for a highlighted section, or for
  one single highlighted Allocation. One Allocation means one range, which is the fix for the old behaviour.
- `fitsSection(selection, section)` merges that section's ranges on the weekday first, then asks whether the
  Selection lies fully inside one merged range. This is the backend's rule in
  `backend/tilavarauspalvelu/models/suitable_time_range/queryset.py`.
- `findBlockingAffecting(selection, affecting)` answers whether an Affecting Allocation overlaps the Selection.
  Both the cell state and the column's block use this one function, so they cannot drift apart.

Tests in `allocationPattern.test.ts`, covering at least: an end time of `00:00`, an Affecting Allocation that ends
at midnight, a 10:15 to 10:45 request landing on exactly two cells, an Allocation of 10:00 to 10:45 landing on
exactly three, the priority filter, all three precedence pairs, an Affecting Allocation on this same unit, the
extent growing past 07:00 and past 24:00, a Selection inside one range, a Selection spanning two touching ranges,
and a Selection crossing a gap between two ranges.

Done when the new tests pass and no existing test changed.

### 8. Move the context to an interval

Decision 9, first half of the selection model work.

- `SelectedSlotsContext` holds a `WeekdayInterval | null`, with an exclusive end.
- `useSlotSelection` stays as a string key adapter over it, so `AllocationCalendar`, `AllocationColumn`,
  `AllocationCard` and `useAcceptSlotMutation` keep working with no edit.
- Files: `SelectedSlotsContext.tsx`, `hooks.ts`, `hooks.test.tsx`.
- Done when `just fe test` passes and the old grid still selects a range in the browser.

### 9. Swap the grid

Decisions 3, 6, 7, 15 and 17. The first step a user sees.

- Run the builder once in `AllocationPageContent` and pass its result to both the calendar and the column. Both
  need the same pattern and the same extent, and Demand should not be computed twice. The priority filter moves
  there with it.
- `AllocationCalendar` becomes a thin wrapper in select mode: `value` is the pattern, `selection` and
  `onSelectionChange` come from the context, `step` is 15, `availability` is all seven days open, and
  `visibleHours` is the extent.
- Rows are 24px and there is no inner vertical scroll, so the grid is about 1632px tall and the page carries it.
- Colours and shapes come from `getCellProps` data attributes, styled in the staff app with the existing
  `--tilavaraus-allocation-calendar-colour-*` variables.
- `renderCellContent` draws the count, a check icon for allocated, and a lock icon for affecting. The two states
  must not differ by colour alone.
- The Highlight comes from `getCellProps` data attributes. A Selection gets a tint and a 3px solid frame around
  the run. A highlighted range keeps a dashed frame. A highlighted Allocation gets a double frame.
- Add the legend in the staff app, showing the four Demand buckets, both icons, the Selection frame and both
  Highlight frames.
- Add the Finnish words this step needs to `allocation.json`: the state words, the two announcements and the
  legend labels. They are listed in the migration plan.
- Delete `CalendarDay`, `CalendarSlot`, `Selection`, `Active`, `HourLabel` and the `Slot` helpers.
- Tests: a render test that a cell's accessible name carries the state word, and axe on the view.
- Done when the view works with a mouse and a keyboard, and `just fe lint-css` passes.

### 10. Add the start interval to the query

Decision 18. The only API-facing change in this work.

- Add `reservationStartInterval` to the reservation unit inside `reservationUnitOptions`, in the allocation query
  in `apps/staff/src/pages/application-rounds/[id]/allocation/index.tsx`, not in the shared
  `ApplicationSectionFields` fragment. Other users of that fragment should not pay for a field they ignore.
- The field is `ReservationStartInterval!` on `ReservationUnitNode`, so it is never null.
- Run `just fe codegen-staff` and commit the generated types with the query.
- `getNormalizedInterval` in `apps/staff/src/modules/helpers.ts` already mirrors the backend's cap of 30 minutes,
  and `getIntervalMinutes` in `packages/ui/src/modules/conversion.ts` turns the enum into minutes. Reuse them
  rather than writing the cap again.
- Done when the types build and the field arrives in the query result.

### 11. Move the column to the interval

Decisions 2, 14 and 18, and three of the five bug fixes.

- `AllocationColumn`, `AllocationCard` and `useAcceptSlotMutation` take the `WeekdayInterval`. The mutation reads
  `dayOfTheWeek` straight off the Selection, so the reverse lookup through a range goes away.
- The cards apply the priority filter, so a cell's number equals the number of request cards for that cell.
- The card warning uses `fitsSection`, so a Selection across two touching ranges no longer warns wrongly.
- The block uses `findBlockingAffecting`, so an Affecting Allocation starting inside the Selection blocks it.
- A third card warning appears when the Selection's begin time does not match the unit's capped start interval, and
  it disables the allocate button. Put it beside the two duration warnings, using the same `NotificationInline`.
- The duration comes from the interval. `selection.length * 30` in `AllocationCard.tsx` goes away, so a 45-minute
  Selection now reads as 45 minutes.
- Replace `ALLOCATION_CALENDAR_TIMES` with a `VisibleHours` constant, and feed the selects from the extent.
- Files: `AllocationColumn.tsx`, `AllocationCard.tsx`, `hooks.ts`, `modules/const.ts`, and the tests
  `AllocationCard.test.tsx` and `applicationRoundAllocation.test.ts`.
- Tests: a begin time of `:15` warns and disables on a 30-minute unit, and allocates on a 15-minute unit. An end
  time of `:45` is accepted on both.
- Done when a cell's number and the card count agree for every cell you try, including with a priority filter on.

### 12. Delete the string keys

- Remove `encodeTimeSlot`, `decodeTimeSlot`, `getTimeSeries`, `timeSlotKeyToTime`, `timeSlotKeyToScheduleTime`,
  `Cell`, `applicationEventSchedulesToCells`, `isInsideCell`, `isInsideSelection` and `getRelatedTimeSlots`.
- `useSlotSelection` loses its adapter and returns the interval.
- `getTimeSlotOptions` goes too. It only makes `:00` and `:30` options, and its end-option trick labels a slot with
  the next slot's time, which is built around 30-minute slots. The selects generate 15-minute options from the
  extent instead, with the end select offering exclusive end times.
- Files: `modules/applicationRoundAllocation.ts`, `hooks.ts`, and the three test files that use them.
- Done when `just fe lint` reports no unused export in that module.

### 13. Clear the Selection when the unit changes

Decision 16.

- The Selection and the Highlight clear when the reservation unit changes. They stay when only the filters change.
- The Selection is React state that nothing resets today, so it survives a unit change and the column then shows
  cards for a different unit at the same time.
- Files: `ApplicationEvents.tsx` or `SelectedSlotsContext.tsx`, and `hooks.ts` for the Highlight params.
- Done when switching tabs clears both, and changing a filter keeps both.

### 14. Build the alternative form

Decision 8. ADR 0002 requires an equal form for the same task.

- Add a weekday select beside the start and end selects. All three are always visible, not behind the
  "Muuta aikaa" toggle.
- The `alternative` prop of the calendar points at the weekday select, so the skip link lands there.
- The options come from the extent, not from a constant, at 15-minute steps.
- Changing the weekday keeps the times. A start at or after the end moves the end to the start plus one step, which
  is 15 minutes. Today it moves by 30, because that was the step.
- Add a polite status line under the form. After a change made in the form it states the time, the number of
  request cards and the number of allocation cards. A change made in the grid is announced by the grid, so
  nothing is said twice.
- Add the Finnish words for the weekday select label and the status line.
- Tests: choosing a weekday, a start and an end through the form produces the same Selection as the grid, and the
  status line text is right.
- Done when the whole task can be done with the form alone, without entering the grid.

### 15. Update the screen reader checklist

- Add an allocation section to `packages/ui/src/components/WeeklyPatternCalendar/SCREEN_READER_CHECKLIST.md`.
- Skip the stale time item and the read only item. This grid has no closed cells and is not read only.
- Add items for: the Demand count in a cell label, an allocated cell, an affecting cell, both Highlights, choosing
  a Selection with Enter, growing and shrinking it with Shift and the arrows, clearing it with Escape, the status
  line of the form, and that the legend matches what is on screen.

### 16. Clean up

- Delete the dead declined style and `IconCross` use.
- Fix the typo `Myonnetty aika` in `apps/staff/public/locales/fi/allocation.json`.
- Update the TODO in [ADR 0001](adr/0001-one-shared-calendar-built-in-house.md). The allocation calendar item is
  done, and the note about which views have their own alternative can name the allocation view now.

### 17. Manual browser checks

- A drag that grows and a drag that shrinks.
- A drag released outside the grid, which used to leave the day stuck in selecting mode.
- The whole keyboard model from step 6.
- Both Highlights, from the left column cards and from an allocated slot.
- The block on an Affecting Allocation, including one that starts inside the Selection and one that ends at
  midnight.
- A priority filter on, with a cell number matched against the card count.
- A request that begins or ends at a quarter hour, which must sit exactly where its times say.
- A begin time of `:15` on a 30-minute unit, which must warn and disable, and on a 15-minute unit, which must
  allocate. An end time of `:45` on both, which must allocate.
- A poll arriving while a Selection is open, which must not clear or move it.
- A unit tab change, which must clear the Selection.
- 400 percent zoom, and the focus ring on every cell state.
- The height of the page with the grid at 68 rows, and how a drag feels across 476 cells. ADR 0001 says to measure
  before optimising a grid this size. The customer funnel already paints one, so expect it to be fine.

### 18. Screen reader and audit

- Someone runs the checklist with the pairs ADR 0002 names, and records the tool versions in the pull request.
- The City or an outside auditor checks the Calendar. ADR 0002 requires this before any old calendar is removed,
  which on this branch means before it merges.

## Not in this work

- Touch drag of a range. A tap chooses one cell. A tap-start and tap-end range would be a follow-up.
- Playwright for the pointer drag, the target size, the contrast and the focus ring. ADR 0002 says it starts with
  the Dated Week, and it is not set up yet. Until then those stay manual checks.
- Naming the reservation unit that holds an Affecting Allocation. The view cannot say which unit blocks a time,
  and the query would have to fetch the unit name for that.
