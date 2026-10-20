# Calendar interaction and screen reader model

The grid is a native `<table role="grid">` as in the ARIA Authoring Practices grid pattern. Rows, cells and headers have explicit roles. A roving tabindex gives the grid one tab stop. A plain table with a roving tabindex was rejected, because screen readers then keep table browse mode and take the arrow keys.

## Labels

The Calendar builds the weekday and time part of a cell label with `Intl`. The consumer gives only the translated state word. The label is "{weekday}, {time range}, {state}". There is no default state word.

The first cell of a painted run is named after the whole run. The other cells name only themselves. The first plan was to hide the other cells from the accessibility tree. That was rejected, because hidden cells that can take focus break the grid. If a screen reader reads this badly, name every cell after itself.

## Keyboard

- Arrow keys move focus. Page Up and Page Down move one hour. Home and End go to the first and last row.
- Enter or Space paints or erases the cell. Shift and Arrow Up or Down extend a sweep. The mode of a sweep is fixed when it starts.
- A polite live region says what changed.
- A consumer can refuse a paint with `isValidSelection`. The Calendar says the reason and does not change the value.
- A cell outside the Reservable Times cannot be painted. It can be erased.

## Not built yet

These belong to the Dated Week.

- The move mode for a Draft Reservation. Enter grabs it, arrows move it, Shift and arrows resize it, Enter confirms and Escape cancels.
- On touch, tap only for painting. Explicit Move and Resize buttons for the Draft Reservation. Long press clashes with VoiceOver and TalkBack gestures.
- The Calendar keeps a local preview while a move or resize is in progress. The consumer owns the saved value and the validation.
