# ruff: noqa: S311

import random
from datetime import UTC, datetime, time, timedelta
from itertools import cycle

from applications.enums import ApplicantTypeChoice, OrganizationTypeChoice, Priority, Weekday, WeekdayChoice
from applications.models import (
    Address,
    AllocatedTimeSlot,
    Application,
    ApplicationRound,
    ApplicationRoundTimeSlot,
    ApplicationSection,
    City,
    Organisation,
    Person,
    ReservationUnitOption,
    SuitableTimeRange,
)
from applications.typing import TimeSlotDB
from reservation_units.models import ReservationUnit
from reservations.models import AgeGroup, ReservationPurpose
from tilavarauspalvelu.models import ServiceSector, Unit, User

from .utils import batched, faker_en, faker_fi, faker_sv, get_paragraphs, random_subset, weighted_choice, with_logs


@with_logs()
def _create_application_rounds(
    reservation_units: list[ReservationUnit],
    reservation_purposes: list[ReservationPurpose],
    *,
    number: int = 15,
) -> list[ApplicationRound]:
    # Create at least 9 application rounds so that there are past
    # application rounds with different sent and handled dates
    number = max(number, 9)
    period_options = cycle(
        [
            # past
            (
                datetime(2021, 1, 1, tzinfo=UTC),
                datetime(2023, 1, 1, tzinfo=UTC),
            ),
            # current
            (
                datetime(2022, 1, 1, tzinfo=UTC),
                datetime(2027, 1, 1, tzinfo=UTC),
            ),
            # future
            (
                datetime.now(tz=UTC) + timedelta(days=365),
                datetime(2027, 1, 1, tzinfo=UTC),
            ),
        ]
    )

    application_rounds: list[ApplicationRound] = []

    skip_first: bool = True
    sent_created: bool = False
    handled_created: bool = False

    for i in range(number):
        criteria = get_paragraphs()

        period = next(period_options)

        # First past application round has not been sent or handled
        # Second past application round has been sent
        # Third past application round has been sent and handled
        sent_date: datetime | None = None
        handled_date: datetime | None = None
        if period[1] < datetime.now(tz=UTC):
            if skip_first:
                skip_first = False
            elif not sent_created:
                sent_date = period[0] - timedelta(days=1)
                sent_created = True
            elif not handled_created:
                sent_date = period[0] - timedelta(days=1)
                handled_date = period[0] + timedelta(days=1)
                handled_created = True

        application_round = ApplicationRound(
            name=f"Application Round {i}",
            name_fi=f"Application Round {i}",
            name_en=f"Application Round {i}",
            name_sv=f"Application Round {i}",
            application_period_begin=period[0],
            application_period_end=period[1],
            reservation_period_begin=period[0],
            reservation_period_end=period[1],
            public_display_begin=datetime(2021, 1, 1, tzinfo=UTC),
            public_display_end=datetime(2027, 1, 1, tzinfo=UTC),
            criteria=criteria.fi,
            criteria_fi=criteria.fi,
            criteria_en=criteria.en,
            criteria_sv=criteria.sv,
            sent_date=sent_date,
            handled_date=handled_date,
        )
        status = application_round.status.value
        application_round.name += f" - {status}"
        application_round.name_en += f" - {status}"
        application_round.name_sv += f" - {status}"
        application_rounds.append(application_round)

    application_rounds = ApplicationRound.objects.bulk_create(application_rounds)

    for application_round in application_rounds:
        application_round.reservation_units.add(*random_subset(reservation_units, min_size=1, max_size=10))
        application_round.purposes.add(*random_subset(reservation_purposes, max_size=5))

    return application_rounds


@with_logs()
def _create_applications(
    application_rounds: list[ApplicationRound],
    users: list[User],
    age_groups: list[AgeGroup],
    reservation_purposes: list[ReservationPurpose],
    cities: list[City],
    *,
    number: int = 20,
) -> list[Application]:
    now = datetime.now(tz=UTC)

    contact_persons = _create_persons(number=number)
    billing_addresses = _create_addresses(number=number)
    organisations = _create_organisations(billing_addresses)

    applications: list[Application] = []

    # The first past and present application rounds have "a lot" of applications
    application_counts = iter([200, 200] + ([number] * (len(application_rounds) - 2)))

    for application_round in application_rounds:
        # Create N application per application round
        for _ in range(next(application_counts)):
            # No application for future application rounds
            if application_round.application_period_begin > now:
                break

            # User is the overall admin mode often, but other users are also possible
            weights = [len(users)] + ([1] * (len(users) - 1))
            user = weighted_choice(users, weights=weights)

            applicant_type, organisation = random.choice(organisations)

            # 2/3 of applications have been sent by the user
            # For open application rounds, this means application has been received for handling (and is not a draft)
            # For past application rounds, this means application is sent and handled (and not expired)
            sent_date: datetime | None = None
            cancelled_date: datetime | None = None
            if weighted_choice([True, False], weights=[2, 1]):
                sent_date = application_round.application_period_end - timedelta(days=1)

            # 1/3 of unsent application have been cancelled
            elif weighted_choice([True, False], weights=[1, 2]):
                cancelled_date = application_round.application_period_end - timedelta(days=1)

            application = Application(
                applicant_type=applicant_type,
                contact_person=random.choice(contact_persons),
                user=user,
                organisation=organisation,
                application_round=application_round,
                billing_address=random.choice(billing_addresses),
                home_city=random.choice(cities),
                additional_information=faker_fi.sentence(),
                sent_date=sent_date,
                cancelled_date=cancelled_date,
            )
            applications.append(application)

    applications = Application.objects.bulk_create(applications)
    _create_application_sections(applications, age_groups, reservation_purposes)
    return applications


@with_logs()
def _create_persons(
    *,
    number: int = 20,
) -> list[Person]:
    contact_persons: list[Person] = []

    for _ in range(number):
        contact_person = Person(
            first_name=faker_fi.first_name(),
            last_name=faker_fi.last_name(),
            phone_number=faker_fi.phone_number(),
            email=faker_fi.email(),
        )
        contact_persons.append(contact_person)

    return Person.objects.bulk_create(contact_persons)


@with_logs()
def _create_addresses(
    *,
    number: int = 20,
) -> list[Address]:
    billing_addresses: list[Address] = []

    for _ in range(number):
        street_address = faker_fi.street_address()
        city = faker_fi.city()
        billing_address = Address(
            street_address=street_address,
            street_address_fi=street_address,
            street_address_en=faker_en.street_address(),
            street_address_sv=faker_sv.street_address(),
            post_code=faker_fi.postcode(),
            city=city,
            city_fi=city,
            city_en=faker_en.city(),
            city_sv=faker_sv.city(),
        )
        billing_addresses.append(billing_address)

    return Address.objects.bulk_create(billing_addresses)


@with_logs()
def _create_organisations(
    billing_addresses: list[Address],
) -> list[tuple[str, Organisation | None]]:
    organisations: list[Organisation] = []
    applicant_types: list[str] = []

    for billing_address in billing_addresses:
        applicant_type = random.choice(ApplicantTypeChoice.values)

        organisation: Organisation | None = None
        if applicant_type == ApplicantTypeChoice.COMMUNITY:
            organisation = Organisation(
                name=faker_fi.company(),
                identifier=faker_fi.company_business_id(),
                organisation_type=OrganizationTypeChoice.RELIGIOUS_COMMUNITY,
                year_established=random.randint(1900, 2022),
                address=billing_address,
                active_members=random.randint(1, 1000),
                core_business=faker_fi.sentence(),
                email=faker_fi.email(),
            )
        elif applicant_type == ApplicantTypeChoice.COMPANY:
            organisation = Organisation(
                name=faker_fi.company(),
                identifier=faker_fi.company_business_id(),
                organisation_type=OrganizationTypeChoice.COMPANY,
                year_established=random.randint(1900, 2022),
                address=billing_address,
                active_members=random.randint(1, 1000),
                core_business=faker_fi.sentence(),
                email=faker_fi.email(),
            )
        elif applicant_type == ApplicantTypeChoice.ASSOCIATION:
            organisation = Organisation(
                name=faker_fi.company(),
                identifier=faker_fi.company_business_id(),
                organisation_type=random.choice(
                    [
                        OrganizationTypeChoice.REGISTERED_ASSOCIATION,
                        OrganizationTypeChoice.PUBLIC_ASSOCIATION,
                        OrganizationTypeChoice.UNREGISTERED_ASSOCIATION,
                        OrganizationTypeChoice.MUNICIPALITY_CONSORTIUM,
                    ],
                ),
                year_established=random.randint(1900, 2022),
                address=billing_address,
                active_members=random.randint(1, 1000),
                core_business=faker_fi.sentence(),
                email=faker_fi.email(),
            )

        if organisation is not None:
            organisations.append(organisation)
            applicant_types.append(applicant_type)
        else:
            applicant_types.append(applicant_type)

    organisations = Organisation.objects.bulk_create(organisations)
    organisations_iter = iter(organisations)

    # Add Nones where organization was not created
    return [
        (applicant_type, None)
        if applicant_type == ApplicantTypeChoice.INDIVIDUAL
        else (applicant_type, next(organisations_iter))
        for applicant_type in applicant_types
    ]


@with_logs()
def _create_application_sections(
    applications: list[Application],
    age_groups: list[AgeGroup],
    reservation_purposes: list[ReservationPurpose],
) -> list[ApplicationSection]:
    application_sections: list[ApplicationSection] = []

    now = datetime.now(tz=UTC)
    huge_application_created: bool = False

    for application in applications:
        #
        # Add one application in the first past application round with "a lot" of application events
        # Note this in application working memo.
        application_section_count: int = random.randint(1, 3)
        if not huge_application_created and application.application_round.application_period_end < now:
            application_section_count = 30
            application.working_memo = "Massive application"
            application.save(update_fields=["working_memo"])
            huge_application_created = True

        for _ in range(application_section_count):
            name = faker_fi.word()
            min_duration = random.randint(1, 2)
            max_duration = random.randint(min_duration, 5)

            event = ApplicationSection(
                name=name,
                num_persons=random.randint(1, 100),
                reservation_min_duration=timedelta(hours=min_duration),
                reservation_max_duration=timedelta(hours=max_duration),
                applied_reservations_per_week=weighted_choice(range(1, 8), weights=[10, 7, 4, 2, 1, 1, 1]),
                reservations_begin_date=application.application_round.reservation_period_begin,
                reservations_end_date=application.application_round.reservation_period_end,
                application=application,
                purpose=random.choice(reservation_purposes),
                age_group=random.choice(age_groups),
            )
            application_sections.append(event)

    application_sections = ApplicationSection.objects.bulk_create(application_sections)
    _create_reservation_unit_options(application_sections)
    _create_suitable_time_ranges(application_sections)
    return application_sections


@with_logs()
def _create_reservation_unit_options(
    application_sections: list[ApplicationSection],
) -> list[ReservationUnitOption]:
    reservation_unit_options: list[ReservationUnitOption] = []
    for application_section in application_sections:
        reservation_units = list(application_section.application.application_round.reservation_units.all())
        amount = random.randint(1, min(len(reservation_units), 4))
        selected_units: list[ReservationUnit] = random.sample(reservation_units, k=amount)

        for i, reservation_unit in enumerate(selected_units):
            option = ReservationUnitOption(
                preferred_order=i,
                application_section=application_section,
                reservation_unit=reservation_unit,
            )
            reservation_unit_options.append(option)

    reservation_unit_options = ReservationUnitOption.objects.bulk_create(reservation_unit_options)
    _create_allocated_time_slots(reservation_unit_options)
    return reservation_unit_options


@with_logs()
def _create_allocated_time_slots(
    reservation_unit_options: list[ReservationUnitOption],
) -> list[AllocatedTimeSlot]:
    allocations: list[AllocatedTimeSlot] = []
    for option in reservation_unit_options:
        weekdays: list[str] = Weekday.values.copy()
        amount = random.randint(1, option.application_section.applied_reservations_per_week)

        for _ in range(amount):
            weekday = weekdays.pop(random.randint(0, len(weekdays) - 1))
            begin = random.randint(8, 20)
            end = random.randint(begin + 1, min(begin + random.randint(1, 6), 22))

            allocation = AllocatedTimeSlot(
                day_of_the_week=weekday,
                begin_time=time(hour=begin, tzinfo=UTC),
                end_time=time(hour=end, tzinfo=UTC),
                reservation_unit_option=option,
            )
            allocations.append(allocation)

    return AllocatedTimeSlot.objects.bulk_create(allocations)


@with_logs()
def _create_suitable_time_ranges(
    application_sections: list[ApplicationSection],
) -> list[SuitableTimeRange]:
    suitable_time_ranges: list[SuitableTimeRange] = []
    for application_section in application_sections:
        weekdays: list[str] = Weekday.values.copy()
        amount = random.randint(1, application_section.applied_reservations_per_week)

        for _ in range(amount):
            weekday = weekdays.pop(random.randint(0, len(weekdays) - 1))
            begin = random.randint(8, 20)
            end = random.randint(begin + 1, min(begin + random.randint(1, 6), 22))

            suitable = SuitableTimeRange(
                priority=random.choice(Priority.values),
                day_of_the_week=weekday,
                begin_time=time(hour=begin, tzinfo=UTC),
                end_time=time(hour=end, tzinfo=UTC),
                application_section=application_section,
            )
            suitable_time_ranges.append(suitable)

    return SuitableTimeRange.objects.bulk_create(suitable_time_ranges)


@with_logs()
def _create_cities(*, number: int = 10) -> list[City]:
    cities: list[City] = []
    for _ in range(number):
        name = faker_fi.city()
        city = City(
            name=name,
            name_fi=name,
            name_en=faker_en.city(),
            name_sv=faker_sv.city(),
            municipality_code=faker_fi.administrative_unit(),
        )
        cities.append(city)

    return City.objects.bulk_create(cities)


@with_logs()
def _create_age_groups() -> list[AgeGroup]:
    combinations = [
        (1, 8),
        (9, 12),
        (13, 17),
        (18, 24),
        (25, 28),
        (29, 64),
        (65, None),
    ]

    age_groups: list[AgeGroup] = []
    for minimum, maximum in combinations:
        age_group = AgeGroup(
            minimum=minimum,
            maximum=maximum,
        )
        age_groups.append(age_group)

    return AgeGroup.objects.bulk_create(age_groups)


@with_logs()
def _create_application_round_time_slots(reservation_units: list[ReservationUnit]) -> list[ApplicationRoundTimeSlot]:
    time_slots: list[ApplicationRoundTimeSlot] = []
    for reservation_unit in reservation_units:
        weekdays: list[int] = random_subset(WeekdayChoice.values)
        for weekday in weekdays:
            reservable_times: list[TimeSlotDB] = []
            closed: bool = weighted_choice([True, False], weights=[1, 4])
            if not closed:
                reservable_times.append(
                    TimeSlotDB(
                        begin=time(hour=random.randint(7, 12)).isoformat(timespec="seconds"),
                        end=time(hour=random.randint(12, 19)).isoformat(timespec="seconds"),
                    )
                )
                # 1/3 chance of having a second reservable time
                if weighted_choice([True, False], weights=[1, 2]):
                    reservable_times.append(
                        TimeSlotDB(
                            begin=time(hour=random.randint(19, 20)).isoformat(timespec="seconds"),
                            # 1/2 chance of ending at 22:00, 1/2 chance of ending at 00:00
                            end=time(hour=random.choice([22, 0])).isoformat(timespec="seconds"),
                        )
                    )

            time_slots.append(
                ApplicationRoundTimeSlot(
                    reservation_unit=reservation_unit,
                    weekday=weekday,
                    closed=closed,
                    reservable_times=reservable_times,
                )
            )

    return ApplicationRoundTimeSlot.objects.bulk_create(time_slots)


@with_logs()
def _create_service_sectors(units: list[Unit], *, number: int = 3) -> list[ServiceSector]:
    service_sectors: list[ServiceSector] = []
    for i in range(number):
        service_sector = ServiceSector(
            name=f"Service Sector {i}",
            name_fi=f"Service Sector {i}",
            name_sv=f"Service Sector {i}",
            name_en=f"Service Sector {i}",
        )
        service_sectors.append(service_sector)

    service_sectors = ServiceSector.objects.bulk_create(service_sectors)

    units_batched = batched(units, batch_size=len(service_sectors))
    for service_sector in service_sectors:
        units_batch = next(units_batched)
        service_sector.units.add(*units_batch)

    return service_sectors
