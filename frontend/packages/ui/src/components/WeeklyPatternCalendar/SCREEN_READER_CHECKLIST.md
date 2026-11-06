# Weekly Pattern Calendar: screen reader checklist

Run this list by hand before a release that changes the calendar. Automated tests do not replace it.
Axe in the unit tests checks structure. It cannot check speech, focus, contrast or target size.

## Setup

Test with each pair below. Write down the version of each tool in the pull request.

| Screen reader | Browser | System  |
| ------------- | ------- | ------- |
| NVDA          | Firefox | Windows |
| VoiceOver     | Safari  | macOS   |
| VoiceOver     | Safari  | iOS     |
| TalkBack      | Chrome  | Android |

Open the customer application, page 2. Use a unit with opening hours that do not cover the whole day.
Also open one application in the staff app. That view is read only.

## Checks

For each pair, mark pass or fail. Write what you heard when a check fails.

1. **Find the calendar.** The calendar is announced as a grid with the label "Toivotut ajat" (or the label in the current language).
2. **Skip link.** The first tab stop is the link to the form. Activate it. Focus moves to the form.
3. **Enter the grid.** One tab stop reaches the grid. A second tab leaves it.
4. **Cell speech.** Move with the arrow keys. Each cell is read as weekday, time range and state. Example: "maanantai, 10:00–10:15, Varattavissa".
5. **Column and row.** The weekday header is read when you change day. The hour is read when you change hour.
6. **Closed cells.** A closed cell is read as unavailable. Enter on it does nothing.
7. **Paint one cell.** Press Enter on an open cell. The live region says "Lisätty" with the weekday and time. The cell is now read as selected.
8. **Erase.** Press Enter again. The live region says "Poistettu" with the weekday and time.
9. **Sweep.** Press Shift and Arrow Down three times. The live region names the whole range, not only the last cell.
10. **Run start.** Move onto the first cell of a painted range. It is read with the whole range. Check that the other cells in the range are still readable one by one.
11. **Refused paint.** In a build with a validation rule, paint a time that breaks it. The reason is announced. The value does not change.
12. **Stale times.** Load an application with a saved time that is now closed. The cell is visible and can be erased.
13. **Read only.** In the staff view the grid is read as read only. Enter does nothing.
14. **Form.** Add a time with the form. The status line says what was added. Remove it with the remove button. The button name includes the day and time.

## Other checks

- Use the keyboard only. Every check above must work without a mouse.
- Zoom the page to 400 percent. The calendar scrolls inside its own box. The page does not scroll sideways.
- Look at the focus ring on a cell. It must be easy to see on open, closed and painted cells.
- Check that a painted cell is not told apart by colour alone. Primary and secondary cells have different markers.

## Known risk

The first cell of a painted range is named after the whole range. The other cells are named after themselves.
This was chosen to reduce repeated speech. If a screen reader reads the range badly, name every cell after itself.
The change is in `getCellLabel` in `WeeklyPatternCalendar.tsx`.
