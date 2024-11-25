import datetime
import random
from collections.abc import Generator
from typing import Any

from tests.factories import (
    AddressFactory,
    AllocatedTimeSlotFactory,
    ApplicationRoundTimeSlotFactory,
    OrganisationFactory,
    PersonFactory,
)
from tests.factories.application import ApplicationBuilder
from tests.factories.application_round import ApplicationRoundBuilder
from tests.factories.application_section import ApplicationSectionBuilder
from tests.factories.reservation_unit_option import ReservationUnitOptionBuilder
from tests.factories.suitable_time_range import SuitableTimeRangeBuilder
from tilavarauspalvelu.enums import (
    ApplicantTypeChoice,
    Priority,
    ReservationKind,
    TermsOfUseTypeChoices,
    Weekday,
    WeekdayChoice,
)
from tilavarauspalvelu.models import (
    Address,
    AgeGroup,
    AllocatedTimeSlot,
    Application,
    ApplicationRound,
    ApplicationRoundTimeSlot,
    ApplicationSection,
    City,
    Organisation,
    Person,
    ReservationPurpose,
    ReservationUnit,
    ReservationUnitOption,
    SuitableTimeRange,
    TermsOfUse,
    User,
)
from tilavarauspalvelu.typing import TimeSlotDB
from utils.date_utils import DEFAULT_TIMEZONE, get_time_range, local_datetime

from .utils import (
    AllocationInfo,
    AllocationTime,
    ApplicantTypeInfo,
    ApplicationRoundData,
    CreatedApplicationInfo,
    CreatedSectionInfo,
    OptionInfo,
    SectionInfo,
    SuitableTimeInfo,
    get_combinations,
    random_subset,
    weighted_choice,
    with_logs,
)


@with_logs
def _create_application_rounds(
    reservation_purposes: list[ReservationPurpose],
    age_groups: list[AgeGroup],
    cities: list[City],
) -> None:
    # --- Setup ----------------------------------------------------------------------------------------------------

    terms_of_use = TermsOfUse.objects.filter(terms_type=TermsOfUseTypeChoices.RECURRING).first()
    users = list(User.objects.all())

    reservation_units: list[ReservationUnit] = list(
        ReservationUnit.objects.filter(
            is_archived=False,
            spaces__isnull=False,
            origin_hauki_resource__isnull=False,
            reservation_kind__in={ReservationKind.SEASON, ReservationKind.DIRECT_AND_SEASON},
            reservations__isnull=True,
        )
    )
    assert len(reservation_units) > 0, "No reservation units available for creating application rounds."

    # --- Create application rounds --------------------------------------------------------------------------------

    _create_handled_application_rounds(
        terms_of_use,
        reservation_units,
        reservation_purposes,
        age_groups,
        cities,
        users,
    )

    _create_application_round_in_allocations(
        terms_of_use,
        reservation_units,
        reservation_purposes,
        age_groups,
        cities,
        users,
    )

    _create_open_application_rounds(
        terms_of_use,
        reservation_units,
        reservation_purposes,
        age_groups,
        cities,
        users,
    )

    _create_upcoming_application_rounds(
        terms_of_use,
        reservation_units,
        reservation_purposes,
    )


@with_logs
def _create_handled_application_rounds(
    terms_of_use: TermsOfUse,
    reservation_units: list[ReservationUnit],
    reservation_purposes: list[ReservationPurpose],
    age_groups: list[AgeGroup],
    cities: list[City],
    users: list[User],
):
    now = local_datetime()
    today = now.date()

    handled_round = ApplicationRoundBuilder().create(
        name="Käsitelty kausivarauskierros",
        name_fi="Käsitelty kausivarauskierros",
        name_en="Handled application round",
        name_sv="Hanterade ansökningsrunda",
        #
        application_period_begin=now - datetime.timedelta(days=30),
        application_period_end=now - datetime.timedelta(days=1),
        #
        reservation_period_begin=today,
        reservation_period_end=today + datetime.timedelta(days=100),
        #
        handled_date=None,  # Don't set this to allow ending handling and generating reservations
        sent_date=None,
        #
        public_display_begin=now - datetime.timedelta(days=1),
        public_display_end=now + datetime.timedelta(days=720),
        #
        terms_of_use=terms_of_use,
    )

    handled_round.reservation_units.add(*reservation_units)

    selected_purposes = random_subset(reservation_purposes, min_size=1, max_size=min(4, len(reservation_purposes)))
    handled_round.purposes.add(*selected_purposes)

    organisations: list[Organisation] = []
    addresses: list[Address] = []
    contact_persons: list[Person] = []
    applications: list[Application] = []
    application_sections: list[ApplicationSection] = []
    suitable_time_ranges: list[SuitableTimeRange] = []
    reservation_unit_options: list[ReservationUnitOption] = []
    allocated_time_slots: list[AllocatedTimeSlot] = []

    allocation_info = AllocationInfo()

    applicant_type_choices: list[ApplicantTypeInfo] = [
        ApplicantTypeInfo(
            name="Individual",
            applicant_type=ApplicantTypeChoice.INDIVIDUAL,
        ),
        ApplicantTypeInfo(
            name="Community",
            applicant_type=ApplicantTypeChoice.COMMUNITY,
            different_billing_address=True,
        ),
    ]
    applied_days_of_the_week_choices: list[SuitableTimeInfo] = [
        SuitableTimeInfo(
            name="Single weekday",
            primary_applied_weekdays=[Weekday.MONDAY],
        ),
        SuitableTimeInfo(
            name="Multiple weekdays",
            primary_applied_weekdays=[Weekday.MONDAY, Weekday.WEDNESDAY, Weekday.SUNDAY],
        ),
        SuitableTimeInfo(
            name="Multiple weekdays, secondary priority also",
            primary_applied_weekdays=[Weekday.MONDAY, Weekday.WEDNESDAY],
            secondary_applied_weekdays=[Weekday.MONDAY, Weekday.FRIDAY],
        ),
        SuitableTimeInfo(
            name="Multiple weekdays, less applied reservations per week",
            primary_applied_weekdays=[Weekday.TUESDAY, Weekday.WEDNESDAY, Weekday.FRIDAY],
            applied_reservations_per_week=2,
        ),
    ]
    section_number_choices: list[SectionInfo] = [
        SectionInfo(name="Single", number=1, allocations=True),
        SectionInfo(name="Multiple", number=3, allocations=True),
    ]
    option_number_choices: list[OptionInfo] = [
        OptionInfo(name="Single", number=1),
        OptionInfo(name="Multiple", number=3),
    ]

    for data in get_combinations(
        iterables=[
            applicant_type_choices,
            applied_days_of_the_week_choices,
            section_number_choices,
            option_number_choices,
        ],
        output_type=ApplicationRoundData,
    ):
        results = _create_application_for_round(
            application_round=handled_round,
            sent_date=handled_round.application_period_end - datetime.timedelta(days=1),
            age_groups=age_groups,
            cities=cities,
            purposes=selected_purposes,
            reservation_units=reservation_units,
            users=users,
            applicant_type_info=data.applicant_type_info,
            suitable_time_info=data.suitable_time_info,
            section_info=data.section_info,
            option_info=data.option_info,
            allocation_info=allocation_info,
        )
        applications.append(results.application)
        addresses.extend(results.addresses)
        contact_persons.extend(results.contact_persons)
        organisations.extend(results.organisations)
        application_sections.extend(results.application_sections)
        suitable_time_ranges.extend(results.suitable_time_ranges)
        reservation_unit_options.extend(results.reservation_unit_options)
        allocated_time_slots.extend(results.allocated_time_slots)

    Address.objects.bulk_create(addresses)
    Organisation.objects.bulk_create(organisations)
    Person.objects.bulk_create(contact_persons)
    Application.objects.bulk_create(applications)
    ApplicationSection.objects.bulk_create(application_sections)
    SuitableTimeRange.objects.bulk_create(suitable_time_ranges)
    ReservationUnitOption.objects.bulk_create(reservation_unit_options)
    AllocatedTimeSlot.objects.bulk_create(allocated_time_slots)


@with_logs
def _create_application_round_in_allocations(
    terms_of_use: TermsOfUse,
    reservation_units: list[ReservationUnit],
    reservation_purposes: list[ReservationPurpose],
    age_groups: list[AgeGroup],
    cities: list[City],
    users: list[User],
):
    """
    Create an application in allocation round where there are:

    - Applications from all different applicant types
    - Expired and received applications
    - Applications with different reservation periods
    - Applications for different days of the week
    - Applications for different number of reservations per week
    - Applications for different number of suitable time ranges (PRIMARY and SECONDARY)
    - Applications with different number of reservation unit options
    - Applications with different billing addresses and organisation addresses
    """
    now = local_datetime()
    today = now.date()

    in_allocation_round = ApplicationRoundBuilder().create(
        name="Jaettava kausivarauskierros",
        name_fi="Jaettava kausivarauskierros",
        name_en="Application round in allocation",
        name_sv="Ansökningsomgång i tilldelning",
        #
        application_period_begin=now - datetime.timedelta(days=30),
        application_period_end=now - datetime.timedelta(days=1),
        #
        reservation_period_begin=today + datetime.timedelta(days=50),
        reservation_period_end=today + datetime.timedelta(days=100),
        #
        handled_date=None,
        sent_date=None,
        #
        public_display_begin=now - datetime.timedelta(days=1),
        public_display_end=now + datetime.timedelta(days=720),
        #
        terms_of_use=terms_of_use,
    )

    in_allocation_round.reservation_units.add(*reservation_units)

    selected_purposes = random_subset(reservation_purposes, min_size=1, max_size=min(4, len(reservation_purposes)))
    in_allocation_round.purposes.add(*selected_purposes)

    organisations: list[Organisation] = []
    addresses: list[Address] = []
    contact_persons: list[Person] = []
    applications: list[Application] = []
    application_sections: list[ApplicationSection] = []
    suitable_time_ranges: list[SuitableTimeRange] = []
    reservation_unit_options: list[ReservationUnitOption] = []

    applicant_type_choices: list[ApplicantTypeInfo] = [
        ApplicantTypeInfo(
            name="Individual",
            applicant_type=ApplicantTypeChoice.INDIVIDUAL,
        ),
        ApplicantTypeInfo(
            name="Association (unregistered)",
            applicant_type=ApplicantTypeChoice.ASSOCIATION,
            unregistered=True,
        ),
        ApplicantTypeInfo(
            name="Association (registered)",
            applicant_type=ApplicantTypeChoice.ASSOCIATION,
        ),
        ApplicantTypeInfo(
            name="Community",
            applicant_type=ApplicantTypeChoice.COMMUNITY,
            different_billing_address=True,
        ),
        ApplicantTypeInfo(
            name="Company",
            applicant_type=ApplicantTypeChoice.COMPANY,
        ),
    ]
    applied_days_of_the_week_choices: list[SuitableTimeInfo] = [
        SuitableTimeInfo(
            name="Single weekday",
            primary_applied_weekdays=[Weekday.MONDAY],
        ),
        SuitableTimeInfo(
            name="Multiple weekdays",
            primary_applied_weekdays=[Weekday.MONDAY, Weekday.WEDNESDAY, Weekday.SUNDAY],
        ),
        SuitableTimeInfo(
            name="Multiple weekdays, secondary priority also",
            primary_applied_weekdays=[Weekday.MONDAY, Weekday.WEDNESDAY],
            secondary_applied_weekdays=[Weekday.MONDAY, Weekday.FRIDAY],
        ),
        SuitableTimeInfo(
            name="Multiple weekdays, less applied reservations per week",
            primary_applied_weekdays=[Weekday.TUESDAY, Weekday.WEDNESDAY, Weekday.FRIDAY],
            applied_reservations_per_week=2,
        ),
    ]
    section_number_choices: list[SectionInfo] = [
        SectionInfo(name="Single", number=1),
        SectionInfo(name="Multiple", number=3),
    ]
    option_number_choices: list[OptionInfo] = [
        OptionInfo(name="Single", number=1),
        OptionInfo(name="Multiple", number=3),
    ]

    for data in get_combinations(
        iterables=[
            applicant_type_choices,
            applied_days_of_the_week_choices,
            section_number_choices,
            option_number_choices,
        ],
        output_type=ApplicationRoundData,
    ):
        sent_date: datetime.datetime | None = in_allocation_round.application_period_end - datetime.timedelta(days=1)
        if weighted_choice([True, False], weights=[1, 9]):
            # 1/10 of applications have not been sent (=expired)
            sent_date = None

        results = _create_application_for_round(
            application_round=in_allocation_round,
            sent_date=sent_date,
            age_groups=age_groups,
            cities=cities,
            purposes=selected_purposes,
            reservation_units=reservation_units,
            users=users,
            applicant_type_info=data.applicant_type_info,
            suitable_time_info=data.suitable_time_info,
            section_info=data.section_info,
            option_info=data.option_info,
        )
        applications.append(results.application)
        addresses.extend(results.addresses)
        contact_persons.extend(results.contact_persons)
        organisations.extend(results.organisations)
        application_sections.extend(results.application_sections)
        suitable_time_ranges.extend(results.suitable_time_ranges)
        reservation_unit_options.extend(results.reservation_unit_options)

    # Cancel 3 random applications
    for application in random.sample(applications, k=3):
        application.cancelled_date = in_allocation_round.application_period_end - datetime.timedelta(days=1)

    # Create an extra application with a lot of sections
    results = _create_application_for_round(
        application_round=in_allocation_round,
        sent_date=in_allocation_round.application_period_end - datetime.timedelta(days=1),
        age_groups=age_groups,
        cities=cities,
        purposes=selected_purposes,
        reservation_units=reservation_units,
        users=users,
        applicant_type_info=ApplicantTypeInfo(
            name="Association (registered)",
            applicant_type=ApplicantTypeChoice.ASSOCIATION,
        ),
        suitable_time_info=SuitableTimeInfo(
            name="Multiple weekdays",
            primary_applied_weekdays=[Weekday.TUESDAY, Weekday.WEDNESDAY, Weekday.THURSDAY],
        ),
        section_info=SectionInfo(name="Huge", number=30),
        option_info=OptionInfo(name="Multiple", number=3),
    )
    applications.append(results.application)
    addresses.extend(results.addresses)
    contact_persons.extend(results.contact_persons)
    organisations.extend(results.organisations)
    application_sections.extend(results.application_sections)
    suitable_time_ranges.extend(results.suitable_time_ranges)
    reservation_unit_options.extend(results.reservation_unit_options)

    Address.objects.bulk_create(addresses)
    Organisation.objects.bulk_create(organisations)
    Person.objects.bulk_create(contact_persons)
    Application.objects.bulk_create(applications)
    ApplicationSection.objects.bulk_create(application_sections)
    SuitableTimeRange.objects.bulk_create(suitable_time_ranges)
    ReservationUnitOption.objects.bulk_create(reservation_unit_options)


@with_logs
def _create_open_application_rounds(
    terms_of_use: TermsOfUse,
    reservation_units: list[ReservationUnit],
    reservation_purposes: list[ReservationPurpose],
    age_groups: list[AgeGroup],
    cities: list[City],
    users: list[User],
) -> None:
    """
    Create an open application round where there are:

    - Applications from all different applicant types
    - Draft and received applications
    - Applications with different reservation periods
    - Applications for different days of the week
    - Applications for different number of reservations per week
    - Applications for different number of suitable time ranges (PRIMARY and SECONDARY)
    - Applications with different number of reservation unit options
    - Applications with different billing addresses and organisation addresses
    """
    now = local_datetime()
    today = now.date()

    open_round = ApplicationRoundBuilder().create(
        name="Avoin kausivarauskierros",
        name_fi="Avoin kausivarauskierros",
        name_en="Open application round",
        name_sv="Öppen ansökningsomgång",
        #
        application_period_begin=now - datetime.timedelta(days=1),
        application_period_end=now + datetime.timedelta(days=30),
        #
        reservation_period_begin=today + datetime.timedelta(days=100),
        reservation_period_end=today + datetime.timedelta(days=150),
        #
        sent_date=None,
        handled_date=None,
        #
        public_display_begin=now - datetime.timedelta(days=1),
        public_display_end=now + datetime.timedelta(days=720),
        #
        terms_of_use=terms_of_use,
    )

    open_round.reservation_units.add(*reservation_units)

    selected_purposes = random_subset(reservation_purposes, min_size=1, max_size=min(4, len(reservation_purposes)))
    open_round.purposes.add(*selected_purposes)

    organisations: list[Organisation] = []
    addresses: list[Address] = []
    contact_persons: list[Person] = []
    applications: list[Application] = []
    application_sections: list[ApplicationSection] = []
    suitable_time_ranges: list[SuitableTimeRange] = []
    reservation_unit_options: list[ReservationUnitOption] = []

    applicant_type_choices: list[ApplicantTypeInfo] = [
        ApplicantTypeInfo(
            name="Individual",
            applicant_type=ApplicantTypeChoice.INDIVIDUAL,
        ),
        ApplicantTypeInfo(
            name="Association (unregistered)",
            applicant_type=ApplicantTypeChoice.ASSOCIATION,
            unregistered=True,
        ),
        ApplicantTypeInfo(
            name="Association (registered)",
            applicant_type=ApplicantTypeChoice.ASSOCIATION,
        ),
        ApplicantTypeInfo(
            name="Community",
            applicant_type=ApplicantTypeChoice.COMMUNITY,
            different_billing_address=True,
        ),
        ApplicantTypeInfo(
            name="Company",
            applicant_type=ApplicantTypeChoice.COMPANY,
        ),
    ]
    applied_days_of_the_week_choices: list[SuitableTimeInfo] = [
        SuitableTimeInfo(
            name="Single weekday",
            primary_applied_weekdays=[Weekday.MONDAY],
        ),
        SuitableTimeInfo(
            name="Multiple weekdays",
            primary_applied_weekdays=[Weekday.MONDAY, Weekday.WEDNESDAY, Weekday.SUNDAY],
        ),
        SuitableTimeInfo(
            name="Multiple weekdays, secondarily priority also",
            primary_applied_weekdays=[Weekday.MONDAY, Weekday.WEDNESDAY],
            secondary_applied_weekdays=[Weekday.MONDAY, Weekday.FRIDAY],
        ),
        SuitableTimeInfo(
            name="Multiple weekdays, less applied reservations per week",
            primary_applied_weekdays=[Weekday.TUESDAY, Weekday.WEDNESDAY, Weekday.FRIDAY],
            applied_reservations_per_week=2,
        ),
    ]
    section_number_choices: list[SectionInfo] = [
        SectionInfo(name="Single section", number=1),
        SectionInfo(name="Multiple sections", number=3),
    ]
    option_number_choices: list[OptionInfo] = [
        OptionInfo(name="Single option", number=1),
        OptionInfo(name="Multiple options", number=3),
    ]

    for data in get_combinations(
        iterables=[
            applicant_type_choices,
            applied_days_of_the_week_choices,
            section_number_choices,
            option_number_choices,
        ],
        output_type=ApplicationRoundData,
    ):
        sent_date: datetime.datetime | None = None
        if random.choice([True, False]):
            period = open_round.application_period_end - open_round.application_period_begin
            offset_days = random.randint(0, period.days + 1)
            sent_date = open_round.application_period_begin + datetime.timedelta(days=offset_days)

        results = _create_application_for_round(
            application_round=open_round,
            sent_date=sent_date,
            age_groups=age_groups,
            cities=cities,
            purposes=selected_purposes,
            reservation_units=reservation_units,
            users=users,
            applicant_type_info=data.applicant_type_info,
            suitable_time_info=data.suitable_time_info,
            section_info=data.section_info,
            option_info=data.option_info,
        )
        applications.append(results.application)
        addresses.extend(results.addresses)
        contact_persons.extend(results.contact_persons)
        organisations.extend(results.organisations)
        application_sections.extend(results.application_sections)
        suitable_time_ranges.extend(results.suitable_time_ranges)
        reservation_unit_options.extend(results.reservation_unit_options)

    # Cancel 3 random applications
    for application in random.sample(applications, k=3):
        application.cancelled_date = open_round.application_period_end - datetime.timedelta(days=1)

    Address.objects.bulk_create(addresses)
    Organisation.objects.bulk_create(organisations)
    Person.objects.bulk_create(contact_persons)
    Application.objects.bulk_create(applications)
    ApplicationSection.objects.bulk_create(application_sections)
    SuitableTimeRange.objects.bulk_create(suitable_time_ranges)
    ReservationUnitOption.objects.bulk_create(reservation_unit_options)


@with_logs
def _create_upcoming_application_rounds(
    terms_of_use: TermsOfUse,
    reservation_units: list[ReservationUnit],
    reservation_purposes: list[ReservationPurpose],
):
    now = local_datetime()
    today = now.date()

    upcoming_round = ApplicationRoundBuilder().create(
        name="Tulossa oleva kausivarauskierros",
        name_fi="Tulossa oleva kausivarauskierros",
        name_en="Upcoming application round",
        name_sv="Kommande ansökningsomgång",
        #
        application_period_begin=now + datetime.timedelta(days=30),
        application_period_end=now + datetime.timedelta(days=60),
        #
        reservation_period_begin=today + datetime.timedelta(days=150),
        reservation_period_end=today + datetime.timedelta(days=200),
        #
        sent_date=None,
        handled_date=None,
        #
        public_display_begin=now - datetime.timedelta(days=1),
        public_display_end=now + datetime.timedelta(days=720),
        #
        terms_of_use=terms_of_use,
    )

    upcoming_round.reservation_units.add(*reservation_units)

    selected_purposes = random_subset(reservation_purposes, min_size=1, max_size=min(4, len(reservation_purposes)))
    upcoming_round.purposes.add(*selected_purposes)


@with_logs
def _create_application_round_time_slots(reservation_units: list[ReservationUnit]) -> list[ApplicationRoundTimeSlot]:
    time_slots: list[ApplicationRoundTimeSlot] = []
    weekdays: list[int] = random_subset(WeekdayChoice.values)

    for reservation_unit in reservation_units:
        for weekday in weekdays:
            reservable_times: list[TimeSlotDB] = []
            closed: bool = weighted_choice([True, False], weights=[1, 4])

            if not closed:
                reservable_times.append(
                    TimeSlotDB(
                        begin=datetime.time(hour=random.randint(7, 12)).isoformat(timespec="seconds"),
                        end=datetime.time(hour=random.randint(12, 19)).isoformat(timespec="seconds"),
                    )
                )
                # 1/3 chance of having a second reservable time
                if weighted_choice([True, False], weights=[1, 2]):
                    reservable_times.append(
                        TimeSlotDB(
                            begin=datetime.time(hour=random.randint(19, 20)).isoformat(timespec="seconds"),
                            # 1/2 chance of ending at 22:00, 1/2 chance of ending at 00:00
                            end=datetime.time(hour=random.choice([22, 0])).isoformat(timespec="seconds"),
                        )
                    )

            time_slots.append(
                ApplicationRoundTimeSlotFactory.build(
                    reservation_unit=reservation_unit,
                    weekday=weekday,
                    closed=closed,
                    reservable_times=reservable_times,
                )
            )

    return ApplicationRoundTimeSlot.objects.bulk_create(time_slots)


def _create_application_for_round(
    application_round: ApplicationRound,
    sent_date: datetime.datetime | None,
    age_groups: list[AgeGroup],
    cities: list[City],
    purposes: list[ReservationPurpose],
    reservation_units: list[ReservationUnit],
    users: list[User],
    applicant_type_info: ApplicantTypeInfo,
    suitable_time_info: SuitableTimeInfo,
    section_info: SectionInfo,
    option_info: OptionInfo,
    allocation_info: AllocationInfo | None = None,
) -> CreatedApplicationInfo:
    addresses: list[Address] = []
    contact_persons: list[Person] = []
    organisations: list[Organisation] = []

    contact_person = PersonFactory.build()
    contact_persons.append(contact_person)

    billing_address = AddressFactory.build()
    addresses.append(billing_address)

    organisation: Organisation | None = None
    if applicant_type_info.applicant_type.should_have_organisation:
        address = billing_address
        if applicant_type_info.different_billing_address:
            address = AddressFactory.build()
            addresses.append(address)

        kwargs: dict[str, Any] = {"address": address}
        if applicant_type_info.unregistered:
            kwargs["identifier"] = None

        organisation = OrganisationFactory.build(**kwargs)
        organisations.append(organisation)

    home_city: City | None = None
    if applicant_type_info.applicant_type.should_have_home_city:
        home_city = random.choice(cities)

    application = (
        ApplicationBuilder()
        .in_application_round(application_round)
        .set_description_info(
            applicant_type=applicant_type_info.name,
            suitable_time=suitable_time_info.name,
            section=section_info.name,
            option=option_info.name,
        )
        .build(
            cancelled_date=None,
            sent_date=sent_date,
            user=random.choice(users),
            organisation=organisation,
            contact_person=contact_person,
            billing_address=billing_address,
            home_city=home_city,
            applicant_type=applicant_type_info.applicant_type,
        )
    )

    results = _create_application_sections_for_application(
        application=application,
        purposes=purposes,
        reservation_units=reservation_units,
        age_groups=age_groups,
        section_info=section_info,
        suitable_time_info=suitable_time_info,
        option_info=option_info,
        allocation_info=allocation_info,
    )

    return CreatedApplicationInfo(
        application=application,
        addresses=addresses,
        contact_persons=contact_persons,
        organisations=organisations,
        application_sections=results.application_sections,
        suitable_time_ranges=results.suitable_time_ranges,
        reservation_unit_options=results.reservation_unit_options,
        allocated_time_slots=results.allocated_time_slots,
    )


def _create_application_sections_for_application(
    application: Application,
    purposes: list[ReservationPurpose],
    reservation_units: list[ReservationUnit],
    age_groups: list[AgeGroup],
    section_info: SectionInfo,
    suitable_time_info: SuitableTimeInfo,
    option_info: OptionInfo,
    allocation_info: AllocationInfo | None = None,
) -> CreatedSectionInfo:
    application_sections: list[ApplicationSection] = []
    suitable_time_ranges: list[SuitableTimeRange] = []
    reservation_unit_options: list[ReservationUnitOption] = []
    allocated_time_slots: list[AllocatedTimeSlot] = []

    for _ in range(section_info.number):
        reservations_begin_date = application.application_round.reservation_period_begin
        reservations_end_date = application.application_round.reservation_period_end

        if random.choice([True, False]):
            reservations_begin_date += datetime.timedelta(days=random.randint(0, 10))
            reservations_end_date -= datetime.timedelta(days=random.randint(0, 10))

        section = (
            ApplicationSectionBuilder()
            .in_application(application)
            .build(
                reservations_begin_date=reservations_begin_date,
                reservations_end_date=reservations_end_date,
                reservation_min_duration=section_info.reservation_min_duration,
                reservation_max_duration=section_info.reservation_max_duration,
                applied_reservations_per_week=suitable_time_info.applied_reservations_per_week,
                purpose=random.choice(purposes),
                age_group=random.choice(age_groups),
            )
        )
        application_sections.append(section)

        suitable_times = list(_create_suitable_time_ranges_for_section(section, suitable_time_info))
        suitable_time_ranges.extend(suitable_times)

        options = list(_create_reservation_unit_options_for_section(section, option_info, reservation_units))
        reservation_unit_options.extend(options)

        if section_info.allocations:
            assert allocation_info is not None, "Allocation info must be given when allocations are enabled."

            allocations = list(
                _create_allocated_time_slots_for_section(
                    reservation_unit_options=options,
                    suitable_time_ranges=suitable_times,
                    duration=section.reservation_min_duration,
                    suitable_time_info=suitable_time_info,
                    allocation_info=allocation_info,
                )
            )
            allocated_time_slots.extend(allocations)

    return CreatedSectionInfo(
        application_sections=application_sections,
        suitable_time_ranges=suitable_time_ranges,
        reservation_unit_options=reservation_unit_options,
        allocated_time_slots=allocated_time_slots,
    )


def _create_suitable_time_ranges_for_section(
    section: ApplicationSection,
    suitable_time_info: SuitableTimeInfo,
) -> Generator[SuitableTimeRange]:
    weekday: Weekday
    for weekday in Weekday:
        begin_time = datetime.time(hour=random.randint(8, 12), tzinfo=DEFAULT_TIMEZONE)

        if weekday in suitable_time_info.primary_applied_weekdays:
            end_time = begin_time.replace(hour=min(23, begin_time.hour + random.randint(1, 4)))

            suitable = SuitableTimeRangeBuilder().build(
                priority=Priority.PRIMARY,
                day_of_the_week=weekday,
                begin_time=begin_time,
                end_time=end_time,
                application_section=section,
            )
            yield suitable

            begin_time = end_time  # Set so that secondary time begins after primary time.

        if weekday in suitable_time_info.secondary_applied_weekdays:
            end_time = begin_time.replace(hour=min(23, begin_time.hour + random.randint(1, 4)))

            suitable = SuitableTimeRangeBuilder().build(
                priority=Priority.SECONDARY,
                day_of_the_week=weekday,
                begin_time=begin_time,
                end_time=end_time,
                application_section=section,
            )
            yield suitable


def _create_reservation_unit_options_for_section(
    section: ApplicationSection,
    option_info: OptionInfo,
    reservation_units: list[ReservationUnit],
) -> Generator[ReservationUnitOption]:
    for i in range(option_info.number):
        option = (
            ReservationUnitOptionBuilder()
            .in_application_section(section)
            .build(
                preferred_order=i,
                reservation_unit=random.choice(reservation_units),
            )
        )
        yield option


def _create_allocated_time_slots_for_section(
    reservation_unit_options: list[ReservationUnitOption],
    suitable_time_ranges: list[SuitableTimeRange],
    duration: datetime.timedelta,
    suitable_time_info: SuitableTimeInfo,
    allocation_info: AllocationInfo,
) -> Generator[AllocatedTimeSlot]:
    """
    For an application section with the given reservation unit options and suitable time ranges,
    create allocations according to the applied reservations per week, adhering to the
    allocation rules as best as possible. Only allocate the minimum possible duration to make
    more slots available for other applications.

    Rules:
    - Allocate for primary suitable time ranges first, then secondary ones
    - Allocate for reservation unit options in the user's preferred order
    - Check previous allocations for the same reservation unit, and don't allow overlapping ones
    - Don't allocate for the same weekday twice
    - If enough allocations cannot be made, mark all reservation unit options as locked

    Note that in actual allocation process there are more rules regarding the order
    in which allocations are made, which is not implemented here.
    """
    allocated_days: list[Weekday] = []
    duration_hours = int(duration.total_seconds() // 3600)

    # Sort suitable time ranges by priority so that primary ones are used first
    suitable_time_ranges = sorted(suitable_time_ranges, key=lambda s: 0 if s.priority == Priority.PRIMARY else 1)

    # Sort reservation unit options by the users set preferred order
    reservation_unit_options = sorted(reservation_unit_options, key=lambda o: o.preferred_order)

    for option in reservation_unit_options:
        allocations = allocation_info.allocations.setdefault(option.reservation_unit.pk, [])

        for suitable in suitable_time_ranges:
            # Cannot make allocation for the same weekday in the same application section twice
            if Weekday(suitable.day_of_the_week) in allocated_days:
                continue

            # For simplicity, allocate on even hours only.
            for begin_time in get_time_range(suitable.begin_time, suitable.end_time):
                end_time = begin_time.replace(hour=begin_time.hour + duration_hours)

                first_overlapping_allocation = next(
                    (
                        allocation
                        for allocation in allocations
                        if begin_time < allocation.end_time and end_time > allocation.begin_time
                    ),
                    None,
                )

                # If there are any existing allocations for this reservation unt that overlap with
                # a new allocation beginning at the given time, skip to the next hour.
                if first_overlapping_allocation is not None:
                    continue

                allocations.append(AllocationTime(begin_time=begin_time, end_time=end_time))
                allocated_days.append(Weekday(suitable.day_of_the_week))

                yield AllocatedTimeSlotFactory.build(
                    day_of_the_week=suitable.day_of_the_week,
                    begin_time=begin_time,
                    end_time=end_time,
                    reservation_unit_option=option,
                )

                if len(allocated_days) >= suitable_time_info.applied_reservations_per_week:
                    return

                # Stop allocating on this day.
                break

    # If we get here, we haven't found enough slots to make allocations at.
    # Mark all reservation unit options as locked to indicate that we are done allocating them.
    # This will make the application section status change to "HANDLED".
    for option in reservation_unit_options:
        option.locked = True
