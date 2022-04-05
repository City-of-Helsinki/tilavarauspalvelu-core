import datetime

from django.utils.timezone import get_default_timezone
from factory import LazyAttribute, SubFactory, post_generation
from factory.django import DjangoModelFactory
from factory.faker import Faker
from factory.fuzzy import FuzzyChoice, FuzzyDate, FuzzyDateTime, FuzzyInteger, FuzzyText
from pytz import UTC

from applications.models import (
    PRIORITIES,
    Application,
    ApplicationEventStatus,
    ApplicationRound,
    ApplicationStatus,
    Organisation,
)
from reservation_units.tests.factories import ReservationUnitFactory
from reservations.tests.factories import AgeGroupFactory, ReservationPurposeFactory
from spaces.tests.factories import ServiceSectorFactory


class AddressFactory(DjangoModelFactory):
    class Meta:
        model = "applications.Address"

    street_address = FuzzyText()
    post_code = FuzzyText(length=5)
    city = "Helsinki"


class OrganisationFactory(DjangoModelFactory):
    class Meta:
        model = "applications.Organisation"

    name = FuzzyText()
    identifier = FuzzyText()
    year_established = FuzzyInteger(low=1, high=datetime.date.today().year)
    address = SubFactory(AddressFactory)
    active_members = FuzzyInteger(low=1, high=500)
    organisation_type = FuzzyChoice(
        choices=(
            Organisation.COMPANY,
            Organisation.REGISTERED_ASSOCIATION,
            Organisation.PUBLIC_ASSOCIATION,
            Organisation.UNREGISTERED_ASSOCIATION,
            Organisation.MUNICIPALITY_CONSORTIUM,
            Organisation.RELIGIOUS_COMMUNITY,
        )
    )
    email = FuzzyText(suffix="@testingisbesthing.com")


class PersonFactory(DjangoModelFactory):
    first_name = Faker("first_name")
    last_name = Faker("last_name")
    email = LazyAttribute(
        lambda o: f"{o.first_name.lower()}.{o.last_name.lower()}@example.com"
    )

    class Meta:
        model = "applications.Person"


class ApplicationRoundFactory(DjangoModelFactory):
    class Meta:
        model = "applications.ApplicationRound"

    name = FuzzyText()
    target_group = FuzzyChoice(
        choices=(
            ApplicationRound.TARGET_GROUP_INTERNAL,
            ApplicationRound.TARGET_GROUP_PUBLIC,
            ApplicationRound.TARGET_GROUP_ALL,
        )
    )
    service_sector = SubFactory(ServiceSectorFactory)
    application_period_begin = FuzzyDateTime(
        start_dt=datetime.datetime.now(tz=UTC),
        end_dt=datetime.datetime.now(tz=UTC),
    )
    application_period_end = FuzzyDateTime(
        start_dt=(datetime.datetime.now(tz=UTC) + datetime.timedelta(weeks=4)),
        end_dt=(datetime.datetime.now(tz=UTC) + datetime.timedelta(weeks=4)),
    )
    reservation_period_begin = FuzzyDate(
        start_date=datetime.date.today(), end_date=datetime.date.today()
    )
    reservation_period_end = FuzzyDate(
        start_date=datetime.date.today(),
        end_date=(datetime.date.today() + datetime.timedelta(weeks=4)),
    )
    public_display_begin = FuzzyDateTime(
        start_dt=datetime.datetime.now(tz=UTC),
        end_dt=datetime.datetime.now(tz=UTC),
    )
    public_display_end = FuzzyDateTime(
        start_dt=(datetime.datetime.now(tz=UTC) + datetime.timedelta(weeks=4)),
        end_dt=(datetime.datetime.now(tz=UTC) + datetime.timedelta(weeks=4)),
    )

    @post_generation
    def purposes(self, create, purposes, **kwargs):
        if not create or not purposes:
            return

        for purpose in purposes:
            self.purposes.add(purpose)

    @post_generation
    def reservation_units(self, create, reservation_units, **kwargs):
        if not create or not reservation_units:
            return

        for reservation_unit in reservation_units:
            self.reservation_units.add(reservation_unit)


class CityFactory(DjangoModelFactory):
    name = FuzzyText(length=20)

    class Meta:
        model = "applications.City"


class ApplicationFactory(DjangoModelFactory):
    class Meta:
        model = "applications.Application"

    applicant_type = FuzzyChoice(
        choices=(
            Application.APPLICANT_TYPE_COMPANY,
            Application.APPLICANT_TYPE_ASSOCIATION,
            Application.APPLICANT_TYPE_COMMUNITY,
            Application.APPLICANT_TYPE_COMPANY,
        )
    )

    organisation = SubFactory(OrganisationFactory)
    contact_person = SubFactory(PersonFactory)
    application_round = SubFactory(ApplicationRoundFactory)
    home_city = SubFactory(CityFactory)


class ApplicationEventFactory(DjangoModelFactory):
    class Meta:
        model = "applications.ApplicationEvent"

    name = FuzzyText()
    application = SubFactory(ApplicationFactory)
    min_duration = "01:00"
    max_duration = "02:00"
    events_per_week = FuzzyInteger(low=1, high=4)
    purpose = SubFactory(ReservationPurposeFactory)
    age_group = SubFactory(AgeGroupFactory)
    begin = FuzzyDate(
        start_date=datetime.date.today(),
        end_date=datetime.date.today(),
    )
    end = FuzzyDate(
        start_date=datetime.date.today(),
        end_date=(datetime.date.today() + datetime.timedelta(weeks=4)),
    )

    @post_generation
    def declined_reservation_units(self, create, declined_reservation_units, **kwargs):
        if not create or not declined_reservation_units:
            return

        for reservation_unit in declined_reservation_units:
            self.declined_reservation_units.add(reservation_unit)

    @post_generation
    def set_dates(self, *args, **kwargs):
        if not self.begin:
            self.begin = self.application.application_round.reservation_period_begin
        if not self.end:
            self.end = self.application.application_round.reservation_period_end


class EventReservationUnitFactory(DjangoModelFactory):
    class Meta:
        model = "applications.EventReservationUnit"

    application_event = SubFactory(ApplicationEventFactory)
    priority = FuzzyInteger(low=0, high=1000, step=100)
    reservation_unit = SubFactory(ReservationUnitFactory)


class ApplicationEventScheduleFactory(DjangoModelFactory):
    class Meta:
        model = "applications.ApplicationEventSchedule"

    day = FuzzyInteger(low=0, high=6)
    begin = datetime.time(12, 0, tzinfo=get_default_timezone())
    end = datetime.time(14, 0, tzinfo=get_default_timezone())
    application_event = SubFactory(ApplicationEventFactory)
    priority = FuzzyChoice(
        choices=[choice[0] for choice in PRIORITIES.PRIORITY_CHOICES]
    )


class ApplicationEventScheduleResultFactory(DjangoModelFactory):
    class Meta:
        model = "applications.ApplicationEventScheduleResult"

    application_event_schedule = SubFactory(ApplicationEventScheduleFactory)
    allocated_reservation_unit = SubFactory(ReservationUnitFactory)
    allocated_duration = "01:00"
    allocated_day = FuzzyInteger(low=0, high=6)
    allocated_begin = datetime.time(12, 0, tzinfo=get_default_timezone())
    allocated_end = datetime.time(14, 0, tzinfo=get_default_timezone())


class ApplicationStatusFactory(DjangoModelFactory):
    class Meta:
        model = "applications.ApplicationStatus"

    status = FuzzyChoice(
        choices=[
            ApplicationStatus.DRAFT,
            ApplicationStatus.IN_REVIEW,
            ApplicationStatus.REVIEW_DONE,
            ApplicationStatus.DECLINED,
            ApplicationStatus.CANCELLED,
        ]
    )
    application = SubFactory(ApplicationFactory)


class ApplicationRoundStatusFactory(DjangoModelFactory):
    class Meta:
        model = "applications.ApplicationRoundStatus"

    status = FuzzyChoice(
        choices=[
            ApplicationStatus.DRAFT,
            ApplicationStatus.IN_REVIEW,
            ApplicationStatus.REVIEW_DONE,
            ApplicationStatus.DECLINED,
            ApplicationStatus.CANCELLED,
        ]
    )
    application_round = SubFactory(ApplicationRoundFactory)


class ApplicationEventStatusFactory(DjangoModelFactory):
    class Meta:
        model = "applications.ApplicationEventStatus"

    status = FuzzyChoice(
        choices=[
            ApplicationEventStatus.CREATED,
            ApplicationEventStatus.ALLOCATED,
            ApplicationEventStatus.VALIDATED,
            ApplicationEventStatus.APPROVED,
            ApplicationEventStatus.DECLINED,
        ]
    )
    application_event = SubFactory(ApplicationEventFactory)
