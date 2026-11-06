## Frontend glossary

This glossary is for words that are specific to the frontend code and user interface. It does not cover backend concepts.

### Calendar glossary
Use these words when writing text describing the calendar and naming things in the code that are part of the calendar.
The calendar glossary does not necessarily apply to any other parts of the code or interface.

- **Calendar**:
The one shared time grid used by the customer and staff apps to show and pick times. It shows a Weekly Pattern or
concrete dates. _Avoid_: Time selector, scheduler, week view

- **Weekly Pattern**:
A recurring week with no dates. Each column is a weekday. It is used to express Suitable Time Ranges. _Avoid_: Weekly
calendar, schedule

- **Dated Week**:
A week of concrete dates. Each column is a real date. It is used to show and pick Reservations. It also has a single day
layout. _Avoid_: Date view, schedule view, week view

- **Suitable Time Range**:
A span on one weekday when an applicant could use a space. _Avoid_: Time slot, availability

- **Priority**:
A Suitable Time Range has a Priority of Primary or Secondary when it is describing spans wished for in an application.
It tells how strongly the applicant prefers the Suitable Time Range. _Avoid_: Preference, rank

- **Reservable Times**:
The spans on each weekday when an application round accepts Suitable Time Ranges for a reservation unit. They come from
the round's time slots. _Avoid_: Opening hours, availability

- **Draft Reservation**:
The Reservation a customer is placing or changing in the Calendar and has not yet sent. Its date and duration live in
the reservation form. _Avoid_: Initial reservation, pending slot
