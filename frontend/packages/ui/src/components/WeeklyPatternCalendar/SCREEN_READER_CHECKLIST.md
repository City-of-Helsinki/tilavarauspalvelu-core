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
Also open the allocation view of an application round in the staff app, on a reservation unit that has Demand on
several cells, at least one Allocation and at least one Affecting Allocation. That view uses select mode.

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

## Allocation checks

Run these in the allocation view of the staff app. The grid is in select mode there, so a gesture chooses a
Selection and never paints. Checks 1 to 5 apply to this view as they are. Checks 6 to 14 do not. Every cell in this
grid is open, the grid is not read only, and the Selection replaces painting, so the checks below take their place.
The step is 15 minutes, so one cell is a quarter of an hour.

15. **Demand in a cell.** Move with the arrow keys. Each cell is read as weekday, time range and Demand. Example:
    "maanantai, 10:00–10:15, 3 vuorotoivetta". A cell one section wants is read "1 vuorotoive". A cell no section
    wants is read "Ei vuorotoiveita". The same number is on screen in the cell.
16. **Allocated cell.** Find a cell that is allocated on this reservation unit. It is read "Jaettu vuoro" and it
    shows a check icon, so it is not told apart from an affecting cell by colour alone. The label does not say how
    many sections still want that time.
17. **Affecting cell.** Find a cell held by an Affecting Allocation. It is read "Estynyt, aika on jo jaettu" and it
    shows a lock icon. The cell is not read as unavailable, and Enter on it still chooses it, so the cards for that
    time can be read.
18. **Highlight a section.** Activate an Application Section in the left column. Its unfulfilled Suitable Time
    Ranges get a dashed frame. Those cells are read with "korostettu" after the state word, for example
    "3 vuorotoivetta, korostettu". Nothing else in the speech changes.
19. **Highlight one Allocation.** Activate an Allocation in the left column. Only that one Allocation gets a double
    frame and only its cells are read with "korostettu". Another Allocation of the same section on the same weekday
    is not highlighted.
20. **Choose a Selection.** Move to a cell and press Enter. The live region says "Valittu" with the weekday and the
    time range, for example "Valittu: maanantai, 10:00–10:15". The cell is now read as selected, and no Demand
    cell outside the Selection is read as selected. Space does the same as Enter. The right column lists the
    requests for that time, and the number of request cards is the number the cell showed.
21. **Grow and shrink the Selection.** With a Selection on one cell, press Shift and Arrow Down three times. Each
    press announces the whole Selection, not only the cell that moved. Now press Shift and Arrow Up twice. The
    Selection shrinks, the end that focus is on moves, the other end stays, and the smaller range is announced.
    Press a plain arrow key. Focus moves and the Selection stays as it was.
22. **Clear the Selection.** Press Escape. The live region says "Valinta poistettu" with the weekday and the time
    range that was cleared. After it no cell is read as selected.
23. **Form and status line.** The weekday, start and end selects are always visible in the right column, not behind
    a toggle. The skip link before the grid lands on the weekday select. Set a weekday, a start and an end. The
    Selection in the grid follows, and the status line under the form says the time, the number of request cards and
    the number of allocation cards, for example "Maanantai 10:00-11:00. 3 vuorotoivetta, 1 jaettu vuoro.". Choose a
    start at or after the end. The end moves to the start plus 15 minutes and the status line says the new time.
    Then change the Selection in the grid. The grid announces it and the status line does not repeat it. Finish the
    whole task, from choosing a time to allocating it, with the form alone and without entering the grid.
24. **Legend.** Check the legend against the grid. It names the four Demand buckets, the check icon for an allocated
    cell, the lock icon for an affecting cell, the Selection frame and both Highlight frames. Every marker you can
    see in the grid has a line in the legend, and the legend has no line for a marker this view cannot show.

## Other checks

- Use the keyboard only. Every check above must work without a mouse.
- Zoom the page to 400 percent. The calendar scrolls inside its own box. The page does not scroll sideways.
- Look at the focus ring on a cell. It must be easy to see on open, closed and painted cells.
- Check that a painted cell is not told apart by colour alone. Primary and secondary cells have different markers.

## Known risk

The first cell of a painted range is named after the whole range. The other cells are named after themselves.
This was chosen to reduce repeated speech. If a screen reader reads the range badly, name every cell after itself.
The change is in `getCellLabel` in `WeeklyPatternCalendar.tsx`.
