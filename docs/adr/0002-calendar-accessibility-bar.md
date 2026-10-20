# Calendar accessibility bar

The Calendar must meet WCAG 2.2 AA. It must also meet these AAA criteria: 2.4.13 Focus Appearance, 1.4.6 Contrast (Enhanced), and 2.5.5 Target Size (Enhanced) in the single day layout. Full AAA is not realistic for a reservation grid.

Every action the old calendar had stays in the grid. These are select a slot, select a span, move a Draft Reservation and resize it. Each action has a way to do it without dragging, to meet 2.5.7 Dragging Movements.

Every use of the Calendar needs an equal form for the same task. The Calendar requires a skip link target for it (the `alternative` prop). For Suitable Time Ranges the form is `SuitableTimeRangeForm` in the customer funnel. In the read only staff view the text list of the same times is the alternative.

## Done means

- Axe runs in the unit tests as a floor. It is not proof.
- Someone completes `SCREEN_READER_CHECKLIST.md` with NVDA and Firefox, VoiceOver on macOS and iOS, and TalkBack.
- Keyboard only use and 400 percent zoom are checked.
- The City or an outside auditor checks the Calendar before any old calendar is removed.

## Tests

- Engine unit tests.
- React Testing Library and user-event for keyboard flows and live region text.
- Axe for each state.
- Playwright for pointer drag, touch, zoom, focus, contrast and target size, because jsdom and happy-dom cannot check them. This is not set up yet. It starts with the Dated Week.
