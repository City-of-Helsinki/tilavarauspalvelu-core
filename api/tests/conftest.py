import datetime

import pytest
import recurrence
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient

from allocation.models import AllocationRequest
from applications.models import (
    Address,
    Application,
    ApplicationEvent,
    ApplicationEventSchedule,
    ApplicationEventScheduleResult,
    ApplicationEventWeeklyAmountReduction,
    ApplicationRound,
    ApplicationRoundBasket,
    City,
    Organisation,
    Person,
    Recurrence,
)
from permissions.models import (
    GeneralRole,
    GeneralRoleChoice,
    ServiceSectorRole,
    ServiceSectorRoleChoice,
    UnitRole,
    UnitRoleChoice,
)
from reservation_units.models import (
    Equipment,
    EquipmentCategory,
    Purpose,
    ReservationUnit,
)
from reservations.models import AbilityGroup, AgeGroup, Reservation, ReservationPurpose
from resources.models import Resource
from spaces.models import District, Location, ServiceSector, Space, Unit, UnitGroup


@pytest.fixture(autouse=True)
def enable_permissions(settings):
    settings.TMP_PERMISSIONS_DISABLED = False


@pytest.fixture(autouse=True)
def setup_audit_log(settings):
    settings.AUDIT_LOGGING_ENABLED = False


@pytest.mark.django_db
@pytest.fixture
def user():
    return get_user_model().objects.create(
        username="test_user",
        first_name="James",
        last_name="Doe",
        email="james.doe@foo.com",
    )


@pytest.mark.django_db
@pytest.fixture
def user_2():
    return get_user_model().objects.create(
        username="test_user_2",
        first_name="Jon",
        last_name="Doe",
        email="jon.doe@foo.com",
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
def user_2_api_client(user_2):
    api_client = APIClient()
    api_client.force_authenticate(user_2)
    return api_client


@pytest.fixture
def resource():
    return Resource.objects.create(name="Test resource")


@pytest.fixture
def unit(service_sector):
    test_unit = Unit.objects.create(name="Test unit")
    test_unit.service_sectors.set([service_sector])
    return test_unit


@pytest.fixture
def unit_group(unit):
    unit_group = UnitGroup.objects.create(name="Test group")
    unit_group.units.add(unit)
    return unit_group


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
def reservation_unit(resource, space, unit):
    reservation_unit = ReservationUnit.objects.create(
        name_en="Test reservation unit", require_introduction=False, unit=unit
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
def service_sector():
    return ServiceSector.objects.create(name="Test service sector")


@pytest.fixture
def service_sector_2():
    return ServiceSector.objects.create(name="Test service sector 2")


@pytest.fixture
def reservation_unit2(resource):
    reservation_unit = ReservationUnit.objects.create(
        name="Test reservation unit no. 2", require_introduction=False
    )
    reservation_unit.resources.set([resource])
    return reservation_unit


@pytest.fixture
def application_round(reservation_unit, purpose, service_sector) -> ApplicationRound:
    application_round = ApplicationRound.objects.create(
        name="Nuorten liikuntavuorot kevät 2021",
        application_period_begin=timezone.datetime(2021, 1, 1, 0, 0, 0).astimezone(),
        application_period_end=timezone.datetime(2021, 1, 31, 0, 0, 0).astimezone(),
        reservation_period_begin=timezone.datetime(2021, 1, 1, 0, 0, 0).astimezone(),
        reservation_period_end=timezone.datetime(2021, 6, 1, 0, 0, 0).astimezone(),
        public_display_begin=timezone.datetime(2021, 6, 1, 0, 0, 0).astimezone(),
        public_display_end=timezone.datetime(2021, 6, 1, 0, 0, 0).astimezone(),
        service_sector=service_sector,
    )

    application_round.reservation_units.set([reservation_unit])
    application_round.purposes.set([purpose])

    return application_round


@pytest.fixture
def allocation_request_in_progress(application_round) -> AllocationRequest:
    return AllocationRequest.objects.create(
        application_round=application_round,
        start_date=datetime.datetime.now(),
        end_date=None,
        completed=False,
    )


@pytest.fixture
def application_round_2(
    reservation_unit, purpose, service_sector_2
) -> ApplicationRound:
    application_round = ApplicationRound.objects.create(
        name="Nuorten liikuntavuorot kevät 2021",
        application_period_begin=timezone.datetime(2021, 1, 1, 0, 0, 0).astimezone(),
        application_period_end=timezone.datetime(2021, 1, 31, 0, 0, 0).astimezone(),
        reservation_period_begin=timezone.datetime(2021, 1, 1, 0, 0, 0).astimezone(),
        reservation_period_end=timezone.datetime(2021, 6, 1, 0, 0, 0).astimezone(),
        public_display_begin=timezone.datetime(2021, 6, 1, 0, 0, 0).astimezone(),
        public_display_end=timezone.datetime(2021, 6, 1, 0, 0, 0).astimezone(),
        service_sector=service_sector_2,
    )

    application_round.reservation_units.set([reservation_unit])
    application_round.purposes.set([purpose])

    return application_round


@pytest.fixture
def reservation(reservation_unit, user) -> Reservation:
    begin_time = timezone.datetime(2021, 12, 1, 0, 0, 0).astimezone()
    end_time = begin_time + datetime.timedelta(hours=1)
    reservation = Reservation.objects.create(
        begin=begin_time, end=end_time, state="created", user=user
    )
    reservation.reservation_unit.set([reservation_unit])
    return reservation


@pytest.fixture
def confirmed_reservation(reservation_unit, user) -> Reservation:
    begin_time = timezone.datetime(2020, 12, 1, 0, 0, 0).astimezone()
    end_time = begin_time + datetime.timedelta(hours=1)
    reservation = Reservation.objects.create(
        begin=begin_time, end=end_time, state="confirmed", user=user
    )
    reservation.reservation_unit.set([reservation_unit])
    return reservation


@pytest.fixture
def reservation_in_second_unit(reservation_unit2, user) -> Reservation:
    begin_time = timezone.datetime(2020, 12, 2, 0, 0, 0).astimezone()
    end_time = begin_time + datetime.timedelta(hours=1)
    reservation = Reservation.objects.create(
        begin=begin_time, end=end_time, state="created", user=user
    )
    reservation.reservation_unit.set([reservation_unit2])
    return reservation


@pytest.fixture
def valid_allocation_request_data(application_round):
    """ Valid JSON data for creating a new Reservation """
    return {
        "application_round_id": application_round.id,
        "application_round_basket_ids": [],
    }


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
def valid_application_round_basket_data(purpose, ten_to_15_age_group, helsinki):
    return {
        "name": "Yleishyödylliset yhdistykset",
        "purpose_ids": [purpose.id],
        "must_be_main_purpose_of_applicant": False,
        "customer_type": [ApplicationRoundBasket.CUSTOMER_TYPE_NONPROFIT],
        "age_group_ids": [ten_to_15_age_group.id],
        "home_city_id": helsinki.id,
        "allocation_percentage": 100,
        "order_number": 1,
    }


@pytest.fixture
def valid_application_round_data(
    reservation_unit,
    reservation_unit2,
    service_sector,
    purpose,
    purpose2,
    valid_application_round_basket_data,
):
    """ Valid JSON data for creating a new application round """
    return {
        "name": "Kevään nuorten säännöllisten vuorojen haku 2021",
        "reservation_unit_ids": [reservation_unit.id, reservation_unit2.id],
        "application_period_begin": "2020-01-01T08:00",
        "application_period_end": "2020-01-31T09:00",
        "reservation_period_begin": "2021-02-01",
        "reservation_period_end": "2021-06-01",
        "public_display_begin": "2020-11-10T08:00",
        "public_display_end": "2021-11-10T08:00",
        "purpose_ids": [purpose.id, purpose2.id],
        "service_sector_id": service_sector.id,
        "status": "draft",
        "application_round_baskets": [valid_application_round_basket_data],
    }


@pytest.fixture
def valid_resource_data(space):
    """ Valid JSON data for creating a new Resource """
    return {
        "location_type": "fixed",
        "name": {
            "fi": "Testiresurssi",
            "en": "Test resource",
            "sv": "Test resursen",
        },
        "space_id": space.pk,
        "buffer_time_before": "00:05:00",
        "buffer_time_after": "00:05:00",
    }


@pytest.fixture
def valid_reservation_unit_data(unit, equipment_hammer):
    """ Valid JSON data for creating a new ReservationUnit """
    return {
        "name": {
            "fi": "Uusi varausyksikkö",
            "en": "New reservation unit",
            "sv": "Nya reservation sak",
        },
        "description": {
            "fi": "Description",
            "en": "",
            "sv": "",
        },
        "require_introduction": False,
        "terms_of_use": "Do not mess it up",
        "equipment_ids": [equipment_hammer.id],
        "unit_id": unit.pk,
        "contact_information": "",
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
def billing_address() -> Address:
    return Address.objects.create(
        street_address="Billing street 666b", post_code="00100", city="Helsinki"
    )


@pytest.fixture
def application(
    purpose, organisation, person, application_round, user, billing_address
) -> Application:
    application = Application.objects.create(
        organisation=organisation,
        contact_person=person,
        application_round=application_round,
        user=user,
        billing_address=billing_address,
    )
    return application


@pytest.fixture
def application2(
    purpose, organisation, person, application_round, user, billing_address
) -> Application:
    application = Application.objects.create(
        organisation=organisation,
        contact_person=person,
        application_round=application_round,
        user=user,
        billing_address=billing_address,
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
def event_reduction(application_event):
    return ApplicationEventWeeklyAmountReduction.objects.create(
        application_event=application_event,
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
def scheduled_for_monday(application_event) -> ApplicationEventSchedule:
    return ApplicationEventSchedule.objects.create(
        day=0, begin="10:00", end="12:00", application_event=application_event
    )


@pytest.fixture
def result_scheduled_for_monday(scheduled_for_monday, reservation_unit):
    return ApplicationEventScheduleResult.objects.create(
        application_event_schedule=scheduled_for_monday,
        allocated_reservation_unit=reservation_unit,
        allocated_duration="01:00",
        allocated_begin="10:00",
        allocated_end="11:00",
        allocated_day=0,
    )


@pytest.fixture
def ten_to_15_age_group() -> AgeGroup:
    return AgeGroup.objects.create(minimum=10, maximum=15)


@pytest.fixture
def hobbyist_ability_group() -> AbilityGroup:
    return AbilityGroup.objects.create(name="Hobbyist level")


@pytest.fixture
def helsinki() -> City:
    return City.objects.create(name="Helsinki")


@pytest.fixture
def valid_application_event_schedule_data():
    return {"day": 1, "begin": "10:40", "end": "16:30"}


@pytest.fixture
def valid_event_reservation_unit_data(reservation_unit):
    return {"priority": 22, "reservation_unit_id": reservation_unit.id}


@pytest.fixture
def valid_application_data(application_round, helsinki):
    return {
        "applicant_type": "company",
        "organisation": {
            "id": None,
            "identifier": "123-identifier",
            "name": "Super organisation",
            "address": {
                "street_address": "Testikatu 28",
                "post_code": 33540,
                "city": "Tampere",
            },
        },
        "contact_person": {
            "id": None,
            "first_name": "John",
            "last_name": "Wayne",
            "email": "john@test.com",
            "phone_number": "123-123",
        },
        "application_round_id": application_round.id,
        "application_events": [],
        "status": "draft",
        "billing_address": {
            "street_address": "Laskukatu 1c",
            "post_code": 33540,
            "city": "Tampere",
        },
        "home_city_id": helsinki.id,
    }


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
        "status": "created",
    }


@pytest.fixture
def tools_equipment_category() -> EquipmentCategory:
    return EquipmentCategory.objects.create(name="Household tools")


@pytest.fixture
def equipment_hammer(tools_equipment_category) -> Equipment:
    return Equipment.objects.create(name="Hammer", category=tools_equipment_category)


@pytest.mark.django_db
@pytest.fixture
def service_sector_admin(service_sector):
    user = get_user_model().objects.create(
        username="ss_admin",
        first_name="Amin",
        last_name="Dee",
        email="amin.dee@foo.com",
    )

    ServiceSectorRole.objects.create(
        user=user,
        role=ServiceSectorRoleChoice.objects.get(code="admin"),
        service_sector=service_sector,
    )

    return user


@pytest.fixture
def service_sector_admin_api_client(service_sector_admin):
    api_client = APIClient()
    api_client.force_authenticate(service_sector_admin)
    return api_client


@pytest.mark.django_db
@pytest.fixture
def service_sector_2_admin(service_sector_2):
    user = get_user_model().objects.create(
        username="ss_admin_2",
        first_name="Amin The Second",
        last_name="Dee",
        email="amin.dee.2@foo.com",
    )

    ServiceSectorRole.objects.create(
        user=user,
        role=ServiceSectorRoleChoice.objects.get(code="admin"),
        service_sector=service_sector_2,
    )

    return user


@pytest.fixture
def service_sector_2_admin_api_client(service_sector_2_admin):
    api_client = APIClient()
    api_client.force_authenticate(service_sector_2_admin)
    return api_client


@pytest.mark.django_db
@pytest.fixture
def service_sector_application_manager(service_sector):
    user = get_user_model().objects.create(
        username="ss_app_man",
        first_name="Man",
        last_name="Ager",
        email="ss.man.ager@foo.com",
    )

    ServiceSectorRole.objects.create(
        user=user,
        role=ServiceSectorRoleChoice.objects.get(code="application_manager"),
        service_sector=service_sector,
    )

    return user


@pytest.fixture
def service_sector_application_manager_api_client(service_sector_application_manager):
    api_client = APIClient()
    api_client.force_authenticate(service_sector_application_manager)
    return api_client


@pytest.mark.django_db
@pytest.fixture
def unit_admin(unit):
    user = get_user_model().objects.create(
        username="u_admin",
        first_name="Amin",
        last_name="Uuu",
        email="amin.u@foo.com",
    )

    UnitRole.objects.create(
        user=user,
        role=UnitRoleChoice.objects.get(code="admin"),
        unit=unit,
    )

    return user


@pytest.fixture
def unit_admin_api_client(unit_admin):
    api_client = APIClient()
    api_client.force_authenticate(unit_admin)
    return api_client


@pytest.mark.django_db
@pytest.fixture
def unit_manager(unit):
    user = get_user_model().objects.create(
        username="u_manager",
        first_name="Mangus",
        last_name="Uuu",
        email="mangus.u@foo.com",
    )

    UnitRole.objects.create(
        user=user,
        role=UnitRoleChoice.objects.get(code="manager"),
        unit=unit,
    )

    return user


@pytest.fixture
def unit_manager_api_client(unit_manager):
    api_client = APIClient()
    api_client.force_authenticate(unit_manager)
    return api_client


@pytest.mark.django_db
@pytest.fixture
def unit_viewer(unit):
    user = get_user_model().objects.create(
        username="u_viewer",
        first_name="Ville",
        last_name="Uuu",
        email="ville.u@foo.com",
    )

    UnitRole.objects.create(
        user=user,
        role=UnitRoleChoice.objects.get(code="viewer"),
        unit=unit,
    )

    return user


@pytest.fixture
def unit_viewer_api_client(unit_viewer):
    api_client = APIClient()
    api_client.force_authenticate(unit_viewer)
    return api_client


@pytest.mark.django_db
@pytest.fixture
def unit_group_admin(unit_group):
    user = get_user_model().objects.create(
        username="ug_admin",
        first_name="Amin",
        last_name="Uuugee",
        email="amin.ug@foo.com",
    )

    UnitRole.objects.create(
        user=user,
        role=UnitRoleChoice.objects.get(code="admin"),
        unit_group=unit_group,
    )

    return user


@pytest.fixture
def unit_group_admin_api_client(unit_group_admin):
    api_client = APIClient()
    api_client.force_authenticate(unit_group_admin)
    return api_client


@pytest.mark.django_db
@pytest.fixture
def general_admin(service_sector):
    user = get_user_model().objects.create(
        username="gen_admin",
        first_name="Amin",
        last_name="General",
        email="amin.general@foo.com",
    )

    GeneralRole.objects.create(
        user=user,
        role=GeneralRoleChoice.objects.get(code="admin"),
    )

    return user


@pytest.fixture
def general_admin_api_client(general_admin):
    api_client = APIClient()
    api_client.force_authenticate(general_admin)
    return api_client


@pytest.fixture
def unauthenticated_api_client():
    api_client = APIClient()
    return api_client


@pytest.fixture
def valid_general_admin_data(user):
    return {
        "user_id": user.id,
        "role": "admin",
    }


@pytest.fixture
def valid_service_sector_admin_data(user, service_sector):
    return {"user_id": user.id, "role": "admin", "service_sector_id": service_sector.id}


@pytest.fixture
def valid_service_sector_application_manager_data(user, service_sector):
    return {
        "user_id": user.id,
        "role": "application_manager",
        "service_sector_id": service_sector.id,
    }


@pytest.fixture
def valid_unit_admin_data(user, unit):
    return {"user_id": user.id, "role": "admin", "unit_id": unit.id}


@pytest.fixture
def valid_unit_group_admin_data(user, unit_group):
    return {"user_id": user.id, "role": "admin", "unit_group_id": unit_group.id}


@pytest.fixture
def valid_unit_manager_data(user, unit):
    return {"user_id": user.id, "role": "manager", "unit_id": unit.id}


@pytest.fixture
def valid_unit_viewer_data(user, unit):
    return {"user_id": user.id, "role": "viewer", "unit_id": unit.id}


@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    pass


@pytest.fixture()
def set_ical_secret(db):
    settings.ICAL_HASH_SECRET = "qhoew923uqqwee"


@pytest.mark.django_db
@pytest.fixture
def staff_user():
    user = get_user_model().objects.create(
        username="gen_admin",
        first_name="Amin",
        last_name="General",
        email="amin.general@foo.com",
        is_staff=True,
    )

    return user


@pytest.fixture
def staff_user_api_client(staff_user):
    api_client = APIClient()
    api_client.force_authenticate(staff_user)
    return api_client
