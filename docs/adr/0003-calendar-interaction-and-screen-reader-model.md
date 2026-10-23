# Calendar interaction and screen reader model

The grid is a native `<table role="grid">` as in the ARIA Authoring Practices grid pattern. Rows, cells and headers have explicit roles. A roving tabindex gives the grid one tab stop. A plain table with a roving tabindex was rejected, because screen readers then keep table browse mode and take the arrow keys.

## Labels

The Calendar builds the weekday and time part of a cell label with `Intl`. The consumer gives only the translated state word. The label is "{weekday}, {time range}, {state}". There is no default state word.

The first cell of a painted run is named after the whole run. The other cells name only themselves. The first plan was to hide the other cells from the accessibility tree. That was rejected, because hidden cells that can take focus break the grid. If a screen reader reads this badly, name every cell after itself.

## Keyboard

- Arrow keys move focus. Page Up and Page Down move one hour. Home and End go to the first and last row.
- Enter or Space paints or erases the cell. Shift and Arrow Up or Down extend a sweep. The mode of a sweep is fixed when it starts.
- A polite live region says what changed.
- A consumer can refuse a paint with `isValidPaint`. The Calendar says the reason and does not change the value.
  The prop refuses a paint, not a Selection, so it is not called `isValidSelection`.
- A cell outside the Reservable Times cannot be painted. It can be erased.

## Choosing a Selection in the Weekly Pattern

The Weekly Pattern has a third mode beside editable and read only. In it the consumer owns a Selection, which is one
span on one weekday. The staff allocation view uses it. The mode is a third props variant, as the other two are, so
each variant only has the props that mean something in it.

- The grid never changes `value` in this mode. The painted value stays the layer the consumer draws, such as Demand.
  A Selection and a painted cell can therefore live in the same cell.
- `aria-selected` marks only the Selection in this mode. In the other two modes it still marks a painted cell, because
  there the paint is the choice the user made.
- Enter or Space chooses the focused cell alone and replaces any Selection. Escape clears it. Plain arrow keys move
  focus and keep the Selection.
- Shift with Arrow Up or Down moves the end of the Selection that focus is on. The other end stays. So the Selection
  can grow and shrink. A paint sweep can only grow, which is why this is a separate model with an anchor.
- A pointer press, drag and release chooses a span on the weekday it started on. A press alone chooses one cell. A tap
  chooses one cell.
- Every change is announced in the live region. The consumer gives the words for chosen and cleared.

## Not built yet

These belong to the Dated Week.

- The move mode for a Draft Reservation. Enter grabs it, arrows move it, Shift and arrows resize it, Enter confirms and Escape cancels.
- On touch, tap only for painting. Explicit Move and Resize buttons for the Draft Reservation. Long press clashes with VoiceOver and TalkBack gestures.
- The Calendar keeps a local preview while a move or resize is in progress. The consumer owns the saved value and the validation.
