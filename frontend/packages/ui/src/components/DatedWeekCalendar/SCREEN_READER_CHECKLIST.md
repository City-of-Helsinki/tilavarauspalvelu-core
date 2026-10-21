# Dated Week Calendar: screen reader checklist

Run this list by hand before a release that changes the calendar. Automated tests do not replace it.
Axe in the unit tests checks structure. It cannot check speech, focus, contrast, target size or touch.

## Setup

Test with each pair below. Write down the version of each tool in the pull request.

| Screen reader | Browser | System  |
| ------------- | ------- | ------- |
| NVDA          | Firefox | Windows |
| VoiceOver     | Safari  | macOS   |
| VoiceOver     | Safari  | iOS     |
| TalkBack      | Chrome  | Android |

The Dated Week has two uses. Check both.

- **Read only, with links.** Staff app, a reservation page, the calendar accordion. Also the calendar on the
  reservation unit page of a unit in the staff app (My units).
- **Choosing and moving.** Customer app, a reservation unit page, the reservation calendar. Use a unit with
  opening hours that do not cover the whole day, and with at least one reservation in the shown week.

## Read only checks

For each pair, mark pass or fail. Write what you heard when a check fails.

1. **Find the calendar.** The calendar is announced as a grid with its label. The grid is read as read only.
2. **Skip links.** The first tab stops are the links to the equal form (customer only) and to the list of
   reservations. Activate the list link. The list opens and focus moves to it.
3. **Toolbar.** The toolbar has a name. Previous, Today and Next say what they step (a day or a week). Day and Week
   say which one is pressed.
4. **Range.** Activate Next. The new date range is announced without moving focus.
5. **Enter the grid.** One tab stop reaches the grid. A second tab leaves it.
6. **Cell speech.** Move with the arrow keys. Each cell is read as weekday and date, time range and state.
   Example: "keskiviikko 21. lokakuuta, 09.00–11.00, Hyväksytty: Bändikoe".
7. **Column and row.** The date header is read when you change day. The hour is read when you change hour.
8. **Event start.** Move onto the first cell of a reservation. It is read with the whole time range. The other cells
   of the reservation are read one by one, each with its own time.
9. **Overlap.** Find a cell where two reservations overlap. The name lists both.
10. **Closed cells.** A closed cell is read as unavailable. Enter on it does nothing.
11. **Today.** The header of today says it is the current date.
12. **Busy.** While the week loads, the grid is announced as busy (slow the network to see it).
13. **Links.** On a cell with one linked reservation the name ends with "avautuu uuteen välilehteen". Enter opens it
    in a new tab. On a cell with several linked reservations Enter opens the list and moves focus to the first link.
14. **List.** Open the list by hand. Every reservation of the shown range is there, in time order, as a link when it
    has one. Each link says it opens a new tab.
15. **Empty week.** Go to a week with nothing in it. The list says so.

## Choosing and moving checks

16. **Choose a time.** On a free open cell press Enter. The status line says "Valittu aika" with the weekday and time.
    The form fields have the new time.
17. **Refused time.** Press Enter on a cell where the reservation cannot be made. The reason is announced. The form
    does not change.
18. **Draft hint.** Move onto the cell of your own draft reservation. After its name the hint is read: how to move it.
19. **Grab.** Press Enter on the draft. The status line explains the keys.
20. **Move.** Press Arrow Down. The new time is announced and focus stays on the draft. Press Arrow Right. The draft
    moves to the next day.
21. **Resize.** Press Shift and Arrow Down. The new length is announced.
22. **Confirm and cancel.** Press Enter. The status line says the reservation moved. Grab again, move, then press
    Escape. The status line says the move was cancelled and the draft is back where it was.
23. **Leave while moving.** Grab the draft and Tab out of the grid. The move is cancelled.
24. **Buttons.** Use Earlier, Later, Shorter and Longer with the keyboard and with touch. Each change is announced
    and none of them needs dragging.
25. **Quota.** With the reservation quota reached, the grid is read as read only and the move buttons are gone.
26. **Form.** Change the time with the form. The draft in the calendar follows. The skip link from the calendar
    reaches the form.

## Other checks

- Use the keyboard only. Every check above must work without a mouse.
- Touch: on iOS and Android tap a free open cell. It is chosen with one tap. The draft can be moved with the buttons
  without long press.
- Zoom the page to 400 percent. The calendar scrolls inside its own box. The page does not scroll sideways.
- Look at the focus ring on a cell. It must be easy to see on open, closed and event cells, and on the draft.
- Check that nothing is told apart by colour alone: the draft, your own and other reservations, buffers and closed
  time.
- Check that the line for the current time is not the only way to find today.
- Check target size: the toolbar buttons and the move buttons are at least 44 by 44 pixels, and a cell is at least
  24 pixels high.

## Known risks

- **Event naming.** The first cell of an event is named after the whole event. The other cells are named after
  themselves. If a screen reader reads this badly, name every cell after its own time. The change is in the cell
  label in `DatedWeekCalendar.tsx`.
- **Grid with a long list of cells.** A week is about 250 cells. If NVDA or JAWS is slow to announce when moving, try
  a larger `step` for the view, for example 60 minutes.
- **Status line.** The line is a `role="log"` region. If a screen reader reads each message twice, change it to
  `role="status"`.
