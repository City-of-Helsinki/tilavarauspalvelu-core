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

## Dated Week events

The Dated Week uses the same grid model. Only the slot cells are gridcells. An event is drawn as decorative stripes inside the cells it covers, so there is one focus model and no focusable overlay.

- A cell is named "{date}, {time range}, {state}". A cell with one event that begins in it is named after the whole event. Other cells name only themselves.
- Overlapping events are drawn side by side. The label of a cell lists every event in it, so nothing needs to be opened to read it.
- The consumer gives the translated description of an event with `getEventLabel`, including whether it is selected. A visual outline alone is not enough.
- Events are cut at midnight into one segment per day. Rows are wall-clock minutes in Europe/Helsinki. The repeated hour on the day the clocks go back is not given extra rows.
- The Dated Week has its own toolbar, with a slot for extra buttons. The shown range is announced when it changes. The equal alternative is a text list of the events in the shown range, with a skip link to it.
- Arrow keys stop at the first and last shown day. They do not change the week.
- An event can lead somewhere, always in a new tab. Enter or Space on a cell opens the only linked event in it. With several linked events Enter opens the text list and moves focus to the first one, where every linked event is a real link. A cell and a list link that open a new tab say so in their name.
- The grid is marked busy while its events load.

## Choosing a time and moving the Draft Reservation

The Dated Week can be read only, or the consumer can let the user place and move a Draft Reservation. The consumer owns the saved value and every rule. The Calendar only asks, and a reason to refuse is announced in the live region.

- Click, tap, Enter or Space on a free open cell asks `onSelectSlot` to use that cell. A cell with a linked event opens the link first.
- Enter or Space on a cell of the draft starts keyboard move mode. Up and Down move it by a step, Left and Right by a day, Shift with Up or Down change its length, Enter asks `onMoveDraft` to accept it, Escape cancels. Leaving the grid cancels. The grid shows a local preview and keeps focus on the cell where the draft starts. A move stays inside the shown days.
- The buttons Earlier, Later, Shorter and Longer change the draft by one step each. They need no move mode, no dragging and no keyboard, so they are the single pointer alternative for 2.5.7 on touch and for pointer users. The first plan was Move and Resize mode buttons. Four direct buttons are simpler.
- The draft cell is described by a hidden hint on how to move it. The grid is read only (`aria-readonly`) only when nothing can be chosen.
- An `alternative` skip link leads to the equal form for the same task.
- Whether a cell is open can be given as a list of ranges (`openRanges`) or as a function (`isOpen`) for rules that are not a list of ranges, such as the earliest and latest day a unit can be reserved.

## Not built yet

- Pointer drag and resize of the Draft Reservation, which the old calendar had. Clicking a cell and the four buttons do the same things. Add it only if mouse users miss it.
- Touch long press. It clashes with VoiceOver and TalkBack gestures, so the buttons are the touch way.
- Playwright checks for focus, zoom, contrast and target size.
