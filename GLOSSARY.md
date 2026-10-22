# Tilavarauspalvelu

Space and resource reservation platform for the City of Helsinki (Varaamo). It has a customer app and a staff app.

## Language

### In the Calendar

**Calendar**:
The one shared time grid used by the customer and staff apps to show and pick times. It shows a Weekly Pattern or concrete dates.
_Avoid_: Time selector, scheduler, week view

**Weekly Pattern**:
A recurring week with no dates. Each column is a weekday. It is used to express Suitable Time Ranges.
_Avoid_: Weekly calendar, schedule

**Dated Week**:
A week of concrete dates. Each column is a real date. It is used to show and pick Reservations. It also has a single day layout.
_Avoid_: Date view, schedule view, week view

**Draft Reservation**:
The Reservation a customer is placing or changing in the Calendar and has not yet sent. Its date and duration live in the reservation form.
_Avoid_: Initial reservation, pending slot

**Selection**:
The span on one weekday that a staff user marks in the allocation calendar, to see who wants it and to allocate it.
_Avoid_: Selected slots, time slot range

**Highlight**:
The outline that shows one Application Section's unfulfilled Suitable Time Ranges, or one Allocation, in the allocation calendar.
_Avoid_: Focus, active, select

### Applications and allocation

**Application Section**:
One part of an application. It asks for regular weekly times, with its own Suitable Time Ranges, durations and wanted reservation units.
_Avoid_: Application event, aes, applicant

**Suitable Time Range**:
A span on one weekday, with a Priority, when an applicant could use a space.
_Avoid_: Time slot, availability

**Priority**:
Whether a Suitable Time Range is Primary or Secondary. It tells how strongly the applicant prefers it.
_Avoid_: Preference, rank

**Reservable Times**:
The spans on each weekday when an application round accepts Suitable Time Ranges for a reservation unit. They come from the round's time slots.
_Avoid_: Opening hours, availability

**Allocation**:
A weekly time on one weekday that staff give an Application Section on one reservation unit.
_Avoid_: Allocated time slot, accepted slot

**Affecting Allocation**:
An Allocation that takes a time from the shown reservation unit. It is on that unit, or on a unit that shares a space or a resource with it, in an overlapping reservation period.
_Avoid_: Related allocation, allocated elsewhere

**Fulfilled**:
A Suitable Time Range is fulfilled when its Application Section has an Allocation that overlaps it on the same weekday, or when the section can no longer be allocated.

**Demand**:
How many Application Sections still want a time on the shown reservation unit, counted from their unfulfilled Suitable Time Ranges.
_Avoid_: Applicants, heat, event count
