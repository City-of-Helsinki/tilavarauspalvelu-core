# One shared Calendar in the ui package, built in house

Every existing calendar is replaced by one Calendar in `packages/ui`. These are the react-big-calendar wrapper, the weekly pattern selector and the staff unit timeline. We build it ourselves. No maintained library offers an accessible time grid. react-big-calendar has little keyboard and screen reader support. ilamy was dropped because it needs Tailwind and has few features.

## Shape

- There are two exported components over one internal engine: `WeeklyPatternCalendar` and `DatedWeekCalendar`. Each has its own props type. A `mode` prop would leave half of the props meaningless in each mode.
- The Calendar is generic. Consumers turn their own data (Reservations, buffers, Reservable Times) into spans, events and background ranges. This keeps domain words out of the component.
- Every span or event keeps its position fields apart from a `data` object that holds domain values. Example: `data: { priority: Priority.Primary }`. `data` is typed `Record<string, unknown>`.
- Two `data` objects are compared with `isDataEqual`. The default is a shallow compare. Neighbouring cells with equal data join into one span.
- `step` is a required prop. The visible hours come from the open ranges unless the consumer sets them. Painted spans outside the visible hours always extend the grid, so saved times stay visible and can be removed.
- Time is shown in Europe/Helsinki. The week starts on Monday. Time uses the 24 hour clock. Weekday names come from `Intl`.
- There is no month view.
- Styling uses styled-components and HDS tokens. A state is never shown by colour alone.

## Order of replacement

1. The Weekly Pattern for Suitable Time Ranges, in the customer funnel and the staff application view. This is done in one change. `ApplicationTimeSelector` is deleted.
2. The dated Reservation calendars in both apps.
3. The unit-list timeline in the staff application view.
4. The staff allocation calendar.

The shared conversions between API data and the Weekly Pattern live in `packages/ui/src/modules/suitableTimes.ts`.

The staff application view is read only. A cell is open when at least one requested reservation unit accepts that time.

## TODO

- Fix calendar controls, to look correct.
- Check which views already have an alternative listing of events, or an alternative way to enter a time, and don't 
  show the generic ListAlternative and/or the generic time entry form. The allocation view already has both, which 
  are the weekday, start and end time selects of the allocation column and the request cards beside them, so its 
  calendar points `alternative` at the weekday select.
- Keep the Dated Week drag path cheap. The Resource Day calendar already renders only the rows that changed (a memoised row, a tooltip that owns its state, stable navigation callbacks), so hover and focus no longer render the whole grid. The Dated Week calendar still renders every cell for each cell the pointer crosses while dragging the draft, because the preview lives in state at the top of the component. Its grid is small (about 250 cells), so measure before changing it. If dragging lags, memoise a column or cell the same way and pass the preview down as a primitive.
