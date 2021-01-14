import datetime

import pytest
import recurrence
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient

from applications.models import (
    Application,
    ApplicationEvent,
    ApplicationPeriod,
    Organisation,
    Person,
    Recurrence,
)
from reservation_units.models import (
    Equipment,
    EquipmentCategory,
    Purpose,
    ReservationUnit,
)
from reservations.models import AbilityGroup, AgeGroup, Reservation, ReservationPurpose
from resources.models import Resource
from spaces.models import District, Location, Space


@pytest.mark.django_db
@pytest.fixture
def user():
    return get_user_model().objects.create(
        username="test_user",
        first_name="James",
        last_name="Doe",
        email="james.doe@foo.com",
    )


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user_api_client(user):
    api_client = APIClient()
    api_client.force_authenticate(user)
    return api_client


@pytest.fixture
def resource():
    return Resource.objects.create(name="Test resource")


@pytest.fixture
def parent_space(location):
    return Space.objects.create(name="Parent space", location=location)


@pytest.fixture
def space(location, parent_space):
    return Space.objects.create(name="Space", location=location, parent=parent_space)


@pytest.fixture
def child_space(location, space):
    return Space.objects.create(name="Child space", location=location, parent=space)


@pytest.fixture
def reservation_unit_with_parent_space(resource, parent_space):
    reservation_unit = ReservationUnit.objects.create(
        name="Parent space test reservation unit", require_introduction=False
    )
    reservation_unit.resources.set([resource])
    reservation_unit.spaces.set([parent_space])
    return reservation_unit


@pytest.fixture
def reservation_unit(resource, space):
    reservation_unit = ReservationUnit.objects.create(
        name="Test reservation unit", require_introduction=False
    )
    reservation_unit.resources.set([resource])
    reservation_unit.spaces.set([space])
    return reservation_unit


@pytest.fixture
def reservation_unit_with_child_space(resource, child_space):
    reservation_unit = ReservationUnit.objects.create(
        name="Child space test reservation unit", require_introduction=False
    )
    reservation_unit.spaces.set([child_space])
    return reservation_unit


@pytest.fixture
def reservation_unit_with_resource(resource, space):
    reservation_unit = ReservationUnit.objects.create(
        name="Test reservation unit with resource", require_introduction=False
    )
    reservation_unit.resources.set([resource])
    return reservation_unit


@pytest.fixture
def location():
    return Location.objects.create(
        address_street="Osoitetienkatu 13b", address_zip="33540", address_city="Tampere"
    )


@pytest.fixture
def reservation_unit2(resource):
    reservation_unit = ReservationUnit.objects.create(
        name="Test reservation unit no. 2", require_introduction=False
    )
    reservation_unit.resources.set([resource])
    return reservation_unit


@pytest.fixture
def application_period(reservation_unit) -> ApplicationPeriod:
    application_period = ApplicationPeriod.objects.create(
        name="Nuorten liikuntavuorot kevät 2021",
        application_period_begin=timezone.datetime(2021, 1, 1, 0, 0, 0).astimezone(),
        application_period_end=timezone.datetime(2021, 1, 31, 0, 0, 0).astimezone(),
        reservation_period_begin=timezone.datetime(2021, 1, 1, 0, 0, 0).astimezone(),
        reservation_period_end=timezone.datetime(2021, 6, 1, 0, 0, 0).astimezone(),
    )

    application_period.reservation_units.set([reservation_unit])

    return application_period


@pytest.fixture
def reservation(reservation_unit) -> Reservation:
    begin_time = timezone.datetime(2021, 12, 1, 0, 0, 0).astimezone()
    end_time = begin_time + datetime.timedelta(hours=1)
    reservation = Reservation.objects.create(
        begin=begin_time, end=end_time, state="created"
    )
    reservation.reservation_unit.set([reservation_unit])
    return reservation


@pytest.fixture
def confirmed_reservation(reservation_unit) -> Reservation:
    begin_time = timezone.datetime(2020, 12, 1, 0, 0, 0).astimezone()
    end_time = begin_time + datetime.timedelta(hours=1)
    reservation = Reservation.objects.create(
        begin=begin_time, end=end_time, state="confirmed"
    )
    reservation.reservation_unit.set([reservation_unit])
    return reservation


@pytest.fixture
def reservation_in_second_unit(reservation_unit2) -> Reservation:
    begin_time = timezone.datetime(2020, 12, 1, 0, 0, 0).astimezone()
    end_time = begin_time + datetime.timedelta(hours=1)
    reservation = Reservation.objects.create(
        begin=begin_time, end=end_time, state="created"
    )
    reservation.reservation_unit.set([reservation_unit2])
    return reservation


@pytest.fixture
def valid_reservation_data(reservation_unit):
    """ Valid JSON data for creating a new Reservation """
    return {
        "begin": "2020-11-10T08:00",
        "end": "2020-11-10T09:30",
        "buffer_time_before": "10",
        "buffer_time_after": "10",
        "reservation_unit": [reservation_unit.id],
    }


@pytest.fixture
def district():
    return District.objects.create(name="Tapaninkylä")


@pytest.fixture
def sub_district(district):
    return District.objects.create(name="Tapanila", parent=district)


@pytest.fixture
def purpose() -> Purpose:
    return Purpose.objects.create(name="Exercise")


@pytest.fixture
def purpose2() -> Purpose:
    return Purpose.objects.create(name="Playing sports")


@pytest.fixture
def reservation_purpose(purpose, reservation) -> ReservationPurpose:
    return ReservationPurpose.objects.create(purpose=purpose, reservation=reservation)


@pytest.fixture
def organisation() -> Organisation:
    return Organisation.objects.create(
        name="Exercise organisation", identifier="ex-org-id"
    )


@pytest.fixture
def person() -> Person:
    return Person.objects.create(first_name="John", last_name="Legend")


@pytest.fixture
def application(purpose, organisation, person, application_period, user) -> Application:
    application = Application.objects.create(
        organisation=organisation,
        contact_person=person,
        application_period=application_period,
        user=user,
    )
    return application


@pytest.fixture
def application_event(
    application, purpose, ten_to_15_age_group, hobbyist_ability_group
) -> ApplicationEvent:
    return ApplicationEvent.objects.create(
        application=application,
        num_persons=10,
        min_duration=datetime.timedelta(hours=1),
        max_duration=datetime.timedelta(hours=2),
        purpose=purpose,
        name="Football",
        age_group=ten_to_15_age_group,
        ability_group=hobbyist_ability_group,
        events_per_week=2,
        begin=datetime.date(year=2020, month=1, day=1),
        end=datetime.date(year=2020, month=6, day=1),
        biweekly=False,
    )


@pytest.fixture
def weekly_recurring_mondays_and_tuesdays_2021(application_event) -> ApplicationEvent:

    return Recurrence.objects.create(
        application_event=application_event,
        recurrence=recurrence.Recurrence(
            include_dtstart=False,
            dtstart=timezone.datetime(2021, 1, 4, 0, 0, 0),
            dtend=timezone.datetime(2021, 12, 28, 0, 0, 0),
            rrules=[
                recurrence.Rule(
                    recurrence.WEEKLY, byday=[recurrence.MONDAY, recurrence.TUESDAY]
                )
            ],
        ),
        priority=200,
    )


@pytest.fixture
def ten_to_15_age_group() -> AgeGroup:
    return AgeGroup.objects.create(minimum=10, maximum=15)


@pytest.fixture
def hobbyist_ability_group() -> AbilityGroup:
    return AbilityGroup.objects.create(name="Hobbyist level")


@pytest.fixture
def valid_application_event_schedule_data():
    return {"day": 1, "begin": "10:40", "end": "16:30"}


@pytest.fixture
def valid_event_reservation_unit_data(reservation_unit):
    return {"priority": 22, "reservation_unit": reservation_unit.id}


@pytest.fixture
def valid_application_event_data(
    reservation_unit,
    ten_to_15_age_group,
    hobbyist_ability_group,
    application,
    purpose,
    valid_application_event_schedule_data,
    valid_event_reservation_unit_data,
):
    """ Valid JSON data for creating a new ApplicationEvent """
    return {
        "name": "Football event",
        "num_persons": 12,
        "age_group_id": ten_to_15_age_group.id,
        "ability_group_id": hobbyist_ability_group.id,
        "min_duration": "01:15:00",
        "max_duration": "02:00:00",
        "application_id": application.id,
        "events_per_week": 1,
        "biweekly": False,
        "begin": "2020-01-01",
        "end": "2021-01-01",
        "purpose_id": purpose.id,
        "application_event_schedules": [valid_application_event_schedule_data],
        "event_reservation_units": [valid_event_reservation_unit_data],
    }


@pytest.fixture
def tools_equipment_category() -> EquipmentCategory:
    return EquipmentCategory.objects.create(name="Household tools")


@pytest.fixture
def equipment_hammer(tools_equipment_category) -> Equipment:
    return Equipment.objects.create(name="Hammer", category=tools_equipment_category)
