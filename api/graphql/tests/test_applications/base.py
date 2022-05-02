from datetime import date, time

import freezegun
import snapshottest
from dateutil.relativedelta import relativedelta
from rest_framework.test import APIClient

from applications.models import (
    Application,
    ApplicationEventStatus,
    ApplicationStatus,
    Organisation,
)
from applications.tests.factories import (
    AddressFactory,
    ApplicationEventFactory,
    ApplicationEventScheduleFactory,
    ApplicationEventStatusFactory,
    ApplicationFactory,
    ApplicationStatusFactory,
    CityFactory,
    EventReservationUnitFactory,
    OrganisationFactory,
    PersonFactory,
)
from reservation_units.tests.factories import ReservationUnitFactory
from reservations.tests.factories import (
    AbilityGroupFactory,
    AgeGroupFactory,
    ReservationPurposeFactory,
)
from spaces.tests.factories import UnitGroupFactory

from ..base import GrapheneTestCaseBase


@freezegun.freeze_time("2022-05-02T12:00:00Z")
class ApplicationTestCaseBase(GrapheneTestCaseBase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        super().setUpTestData()

        cls.application = ApplicationFactory(
            applicant_type=Application.APPLICANT_TYPE_COMMUNITY,
            additional_information="Something to fill the field with text",
            user=cls.regular_joe,
            home_city=CityFactory(name="Test city"),
            billing_address=AddressFactory(
                street_address="Test street", post_code="00100"
            ),
            contact_person=PersonFactory(
                first_name="Test",
                last_name="Person",
                email="test.person@test.com",
                phone_number="+358400123456",
            ),
            organisation=OrganisationFactory(
                name="Test organisation",
                identifier="Some identifier",
                year_established=2022,
                address=AddressFactory(
                    street_address="Organisation street", post_code="00100"
                ),
                active_members=200,
                organisation_type=Organisation.REGISTERED_ASSOCIATION,
                core_business="Testing testing",
                email="organisation@test.com",
            ),
        )

        ApplicationStatusFactory(
            application=cls.application, status=ApplicationStatus.IN_REVIEW
        )

        test_date = date(2022, 5, 2)
        application_event = ApplicationEventFactory(
            application=cls.application,
            name="Test application",
            events_per_week=2,
            num_persons=10,
            begin=test_date,
            end=test_date + relativedelta(days=3),
            age_group=AgeGroupFactory(minimum=10, maximum=15),
            ability_group=AbilityGroupFactory(name="Ability test group"),
            purpose=ReservationPurposeFactory(
                name="Test purpose",
                name_fi="Test purpose FI",
                name_sv="Test purpose SV",
                name_en="Test purpose EN",
            ),
        )

        ApplicationEventStatusFactory(
            application_event=application_event, status=ApplicationEventStatus.CREATED
        )

        test_unit_1 = ReservationUnitFactory(
            name="Declined unit 1",
            name_fi="Declined unit FI 1",
            name_en="Declined unit EN 1",
            name_sv="Declined unit SV 1",
        )
        test_unit_2 = ReservationUnitFactory(
            name="Declined unit 2",
            name_fi="Declined unit FI 2",
            name_en="Declined unit EN 2",
            name_sv="Declined unit SV 2",
        )

        application_event.declined_reservation_units.add(test_unit_1, test_unit_2)

        ApplicationEventScheduleFactory(
            day=1,
            begin=time(12, 00),
            end=time(13, 00),
            priority=300,
            application_event=application_event,
        )
        ApplicationEventScheduleFactory(
            day=2,
            begin=time(13, 00),
            end=time(14, 00),
            priority=200,
            application_event=application_event,
        )
        ApplicationEventScheduleFactory(
            day=3,
            begin=time(14, 00),
            end=time(15, 00),
            priority=100,
            application_event=application_event,
        )

        cls.event_reservation_unit = EventReservationUnitFactory(
            priority=1,
            reservation_unit=test_unit_1,
            application_event=application_event,
        )
        cls.unit_group = UnitGroupFactory(
            units=(cls.event_reservation_unit.reservation_unit.unit,)
        )

        cls.api_client = APIClient()
