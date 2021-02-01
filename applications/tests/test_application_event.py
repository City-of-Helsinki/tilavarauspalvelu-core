import datetime

import pytest


@pytest.mark.django_db
def test_getting_occurences(recurring_application_event, scheduled_for_tuesday):
    occurences = recurring_application_event.get_occurrences()
    dates = []
    start = datetime.datetime(2020, 1, 7, 10, 0)
    delta = datetime.timedelta(days=7)
    while start <= datetime.datetime(2020, 2, 25, 10, 0):
        dates.append(start)
        start += delta
    assert occurences == dates
