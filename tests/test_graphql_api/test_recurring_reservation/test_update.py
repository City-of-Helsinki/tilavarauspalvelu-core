import datetime
from typing import Any, NamedTuple

import pytest

from applications.choices import WeekdayChoice
from tests.factories import AbilityGroupFactory, AgeGroupFactory, RecurringReservationFactory
from tests.helpers import UserType, parametrize_helper

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


class Params(NamedTuple):
    field: str
    value: Any
    has_errors: bool = False


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Update name": Params(field="name", value="A fancy testing name"),
            "Update description": Params(field="description", value="A fancy testing description"),
            "Update beginDate": Params(field="beginDate", value="2021-01-01"),
            "Update beginTime": Params(field="beginTime", value="08:00:00"),
            "Update endDate": Params(field="endDate", value="2021-12-31"),
            "Update endTime": Params(field="endTime", value="10:00:00"),
            "Update recurrenceInDays": Params(field="recurrenceInDays", value=14),
            "Update weekdays": Params(field="weekdays", value=[WeekdayChoice.FRIDAY.value]),
            "Update ageGroup": Params(field="ageGroup", value=...),
            "Update abilityGroup": Params(field="abilityGroup", value=...),
            "Update user": Params(field="user", value=1, has_errors=True),
            "Update reservation_unit": Params(field="reservationUnit", value=1, has_errors=True),
        },
    ),
)
def test_recurring_reservation__update(graphql, field, value, has_errors):
    # given:
    # - There is a recurring reservation in the system
    # - There are an extra age group and ability group in the system
    # - A superuser is using the system
    recurring = RecurringReservationFactory.create(
        timestamp=datetime.datetime(2021, 1, 1, tzinfo=datetime.UTC),
    )
    age_group = AgeGroupFactory.create()
    ability_group = AbilityGroupFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    if value is ...:
        if field == "ageGroup":
            value = age_group.pk
        elif field == "abilityGroup":
            value = ability_group.pk

    # when:
    # - The user update a recurring reservation field
    input_data = {"pk": recurring.pk, field: value}
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains errors about if the update is invalid
    assert response.has_errors is has_errors, response
    if has_errors:
        assert f"Field '{field}' is not defined" in response.error_message()


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Set begin date to none": Params(
                field="beginDate",
                value=None,
                has_errors=True,
            ),
            "Set begin time to none": Params(
                field="beginTime",
                value=None,
                has_errors=True,
            ),
            "Set end date to none": Params(
                field="endDate",
                value=None,
                has_errors=True,
            ),
            "Set end time to none": Params(
                field="endTime",
                value=None,
                has_errors=True,
            ),
            "Set valid end date": Params(
                field="endDate",
                value="2021-01-02",
                has_errors=False,
            ),
            "Set invalid end date": Params(
                field="endDate",
                value="2020-12-31",
                has_errors=True,
            ),
        },
    )
)
def test_recurring_reservation__update__validate_begin_and_end_times(graphql, field, value, has_errors):
    # given:
    # - There is a recurring reservation in the system
    # - A superuser is using the system
    recurring = RecurringReservationFactory.create(
        timestamp=datetime.datetime(2021, 1, 1, tzinfo=datetime.UTC),
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user update a recurring reservation field
    input_data = {"pk": recurring.pk, field: value}
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains errors about if the update is invalid
    assert response.has_errors is has_errors, response
    if has_errors:
        msg = "Reoccurring reservation must begin before it ends, or all fields must be null."
        assert response.field_error_messages() == [msg]
