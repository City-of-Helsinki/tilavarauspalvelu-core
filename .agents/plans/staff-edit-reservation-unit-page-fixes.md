## TODO: staff edit reservation-unit page

Work on top of fe-pricing-changes (these are not accute and go after / stacked with them).

Bug:
- not translated error in staff reservation-unit page: RESERVATION_UNIT_MISSING_ACTIVE_ACCESS_TYPE
- happens because frontend allows adding a future acccess_type and only validates that there is at least one (starting any time)
- fix both the cause (missing validation) and the missing error translation

Test data (django create):
- fix missing access types when creating test data

Feature:
- preserve the open accordions on page refresh (save them in to url params)

Feature:
- rework the keep accordion open when validation error
- problem with it now is that it closes the accordion when the error is handled
- using the normal HDS initiallyOpen can't reopen after it's mounted (e.g. validation error)
- the accordion functionality should be inside a component (+ a hook if needed)
- that accordion should be moved to packages/ui

Feature:
- add jump links to the top error summary

Refactor:
- replace all accordions (staff / ui) with the one created above
