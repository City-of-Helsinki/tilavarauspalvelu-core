from __future__ import annotations

import datetime
import math
import random
from decimal import Decimal
from typing import TYPE_CHECKING, Any, Self

from factory import LazyAttribute, fuzzy

from tilavarauspalvelu.enums import (
    CustomerTypeChoice,
    OrderStatus,
    PaymentType,
    ReservationStateChoice,
    ReservationTypeChoice,
)
from tilavarauspalvelu.models import Reservation
from utils.date_utils import local_start_of_day, next_hour, utc_datetime

from ._base import (
    FakerFI,
    ForeignKeyFactory,
    GenericDjangoModelFactory,
    ManyToManyFactory,
    ModelFactoryBuilder,
    ReverseForeignKeyFactory,
)

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnit, ReservationUnitPricing, User

__all__ = [
    "ReservationBuilder",
    "ReservationFactory",
]


class ReservationFactory(GenericDjangoModelFactory[Reservation]):
    class Meta:
        model = Reservation

    # Basic information
    sku = FakerFI("word")
    name = FakerFI("word")
    description = FakerFI("sentence")
    num_persons = None
    state = ReservationStateChoice.CREATED
    type = ReservationTypeChoice.NORMAL
    cancel_details = ""
    handling_details = ""
    working_memo = ""

    # Time information
    begin = fuzzy.FuzzyDateTime(start_dt=utc_datetime(2021, 1, 1))
    end = LazyAttribute(lambda i: i.begin + datetime.timedelta(hours=2))

    buffer_time_before = datetime.timedelta()
    buffer_time_after = datetime.timedelta()
    handled_at = None
    confirmed_at = None
    created_at = None

    # Pricing details
    price = 0
    non_subsidised_price = 0
    unit_price = 0
    tax_percentage_value = 0

    # Free of charge information
    applying_for_free_of_charge = False
    free_of_charge_reason = None

    # Reservee information
    reservee_id = FakerFI("company_business_id")
    reservee_first_name = FakerFI("first_name")
    reservee_last_name = FakerFI("last_name")
    reservee_email = FakerFI("email")
    reservee_phone = FakerFI("phone_number")
    reservee_organisation_name = FakerFI("company")
    reservee_address_street = FakerFI("street_address")
    reservee_address_city = FakerFI("city")
    reservee_address_zip = FakerFI("postcode")
    reservee_is_unregistered_association = False
    reservee_used_ad_login = False
    reservee_language = LazyAttribute(lambda i: i.user.get_preferred_language())
    reservee_type = CustomerTypeChoice.INDIVIDUAL

    # Billing information
    billing_first_name = FakerFI("first_name")
    billing_last_name = FakerFI("last_name")
    billing_email = FakerFI("email")
    billing_phone = FakerFI("phone_number")
    billing_address_street = FakerFI("street_address")
    billing_address_city = FakerFI("city")
    billing_address_zip = FakerFI("postcode")

    # Relations
    reservation_units = ManyToManyFactory("tests.factories.ReservationUnitFactory")

    user = ForeignKeyFactory("tests.factories.UserFactory", required=True)
    recurring_reservation = ForeignKeyFactory("tests.factories.RecurringReservationFactory")
    deny_reason = ForeignKeyFactory("tests.factories.ReservationDenyReasonFactory")
    cancel_reason = ForeignKeyFactory("tests.factories.ReservationCancelReasonFactory")
    purpose = ForeignKeyFactory("tests.factories.ReservationPurposeFactory")
    home_city = ForeignKeyFactory("tests.factories.HomeCityFactory")
    age_group = ForeignKeyFactory("tests.factories.AgeGroupFactory")

    payment_order = ReverseForeignKeyFactory("tests.factories.PaymentOrderFactory")

    @classmethod
    def create_for_reservation_unit(cls, reservation_unit: ReservationUnit, **kwargs: Any) -> Reservation:
        """Create a Reservation for a single ReservationUnit with its buffer times."""
        kwargs.setdefault("state", ReservationStateChoice.CREATED)

        return cls.create(
            buffer_time_before=reservation_unit.buffer_time_before,
            buffer_time_after=reservation_unit.buffer_time_after,
            reservation_units=[reservation_unit],
            **kwargs,
        )

    @classmethod
    def create_for_time_adjustment(cls, **kwargs: Any) -> Reservation:
        """Create a Reservation for a single ReservationUnit in the necessary state for time adjustment."""
        from .reservable_time_span import ReservableTimeSpanFactory
        from .reservation_unit import ReservationUnitFactory
        from .space import SpaceFactory
        from .unit import UnitFactory

        unit = UnitFactory.create()
        space = SpaceFactory.create(unit=unit)

        sub_kwargs = cls.pop_sub_kwargs("reservation_units", kwargs)
        sub_kwargs.setdefault("origin_hauki_resource__id", "987")
        sub_kwargs.setdefault("cancellation_rule__can_be_cancelled_time_before", datetime.timedelta(0))
        sub_kwargs.setdefault("spaces", [space])
        sub_kwargs.setdefault("unit", unit)
        reservation_unit = ReservationUnitFactory.create(**sub_kwargs)

        day_start = local_start_of_day()
        ReservableTimeSpanFactory.create(
            resource=reservation_unit.origin_hauki_resource,
            start_datetime=day_start - datetime.timedelta(days=1),
            end_datetime=day_start + datetime.timedelta(days=3),
        )

        begin = next_hour(plus_hours=1)
        kwargs.setdefault("state", ReservationStateChoice.CONFIRMED)
        kwargs.setdefault("type", ReservationTypeChoice.NORMAL)
        kwargs.setdefault("begin", begin)
        kwargs.setdefault("end", begin + datetime.timedelta(hours=1))
        kwargs.setdefault("reservation_units", [reservation_unit])
        return cls.create(**kwargs)

    @classmethod
    def create_for_cancellation(cls, **kwargs: Any) -> Reservation:
        """Create a Reservation for a single ReservationUnit in the necessary state for cancellation."""
        from .reservation_unit import ReservationUnitFactory

        sub_kwargs = cls.pop_sub_kwargs("reservation_units", kwargs)
        sub_kwargs.setdefault("cancellation_rule__can_be_cancelled_time_before", datetime.timedelta(hours=1))
        reservation_unit = ReservationUnitFactory.create(**sub_kwargs)

        begin = next_hour(plus_hours=1)
        kwargs.setdefault("state", ReservationStateChoice.CONFIRMED)
        kwargs.setdefault("begin", begin)
        kwargs.setdefault("end", begin + datetime.timedelta(hours=1))
        kwargs.setdefault("reservation_units", [reservation_unit])
        return cls.create(**kwargs)

    @classmethod
    def create_for_confirmation(cls, **kwargs: Any) -> Reservation:
        """Create a Reservation for a single ReservationUnit in the necessary state for confirmation."""
        from .payment_product import PaymentProductFactory
        from .reservable_time_span import ReservableTimeSpanFactory
        from .reservation_unit import ReservationUnitFactory

        sub_kwargs = cls.pop_sub_kwargs("reservation_units", kwargs)
        sub_kwargs.setdefault("origin_hauki_resource__id", "987")
        sub_kwargs.setdefault("payment_types__code", PaymentType.ON_SITE)
        sub_kwargs.setdefault("payment_product", PaymentProductFactory.create())
        sub_kwargs.setdefault("pricings__highest_price", 20)
        reservation_unit = ReservationUnitFactory.create(**sub_kwargs)

        day_start = local_start_of_day()
        ReservableTimeSpanFactory.create(
            resource=reservation_unit.origin_hauki_resource,
            start_datetime=day_start - datetime.timedelta(days=1),
            end_datetime=day_start + datetime.timedelta(days=2),
        )

        begin = next_hour(plus_hours=1)
        kwargs.setdefault("state", ReservationStateChoice.CREATED)
        kwargs.setdefault("begin", begin)
        kwargs.setdefault("end", begin + datetime.timedelta(hours=1))
        kwargs.setdefault("price", Decimal("12.4"))
        kwargs.setdefault("tax_percentage_value", Decimal("25.5"))
        kwargs.setdefault("reservation_units", [reservation_unit])
        return cls.create(**kwargs)

    @classmethod
    def create_for_update(cls, **kwargs: Any) -> Reservation:
        """Create a Reservation for a single ReservationUnit in the necessary state for general updates."""
        kwargs.setdefault("state", ReservationStateChoice.CREATED)
        return cls.create_for_time_adjustment(**kwargs)

    @classmethod
    def create_for_staff_update(cls, **kwargs: Any) -> Reservation:
        """Create a Reservation for a single ReservationUnit in the necessary state for staff updates."""
        from .reservation_unit import ReservationUnitFactory

        sub_kwargs = cls.pop_sub_kwargs("reservation_units", kwargs)
        reservation_unit = ReservationUnitFactory.create(**sub_kwargs)

        begin = next_hour(plus_hours=1)
        kwargs.setdefault("state", ReservationStateChoice.CONFIRMED)
        kwargs.setdefault("begin", begin)
        kwargs.setdefault("end", begin + datetime.timedelta(hours=1))
        kwargs.setdefault("reservation_units", [reservation_unit])
        return cls.create(**kwargs)

    @classmethod
    def create_for_delete(cls, **kwargs: Any) -> Reservation:
        """Create a Reservation for a single ReservationUnit in the necessary state for deletion."""
        from .reservation_unit import ReservationUnitFactory

        sub_kwargs = cls.pop_sub_kwargs("reservation_units", kwargs)
        reservation_unit = ReservationUnitFactory.create(**sub_kwargs)

        begin = next_hour(plus_hours=1)
        kwargs.setdefault("state", ReservationStateChoice.CREATED)
        kwargs.setdefault("begin", begin)
        kwargs.setdefault("end", begin + datetime.timedelta(hours=1))
        kwargs.setdefault("reservation_units", [reservation_unit])
        return cls.create(**kwargs)

    @classmethod
    def create_for_deny(cls, **kwargs: Any) -> Reservation:
        """Create a Reservation for a single ReservationUnit in the necessary state for denying it."""
        from .reservation_unit import ReservationUnitFactory

        sub_kwargs = cls.pop_sub_kwargs("reservation_units", kwargs)
        reservation_unit = ReservationUnitFactory.create(**sub_kwargs)

        begin = next_hour(plus_hours=1)
        kwargs.setdefault("state", ReservationStateChoice.REQUIRES_HANDLING)
        kwargs.setdefault("type", ReservationTypeChoice.NORMAL)
        kwargs.setdefault("begin", begin)
        kwargs.setdefault("end", begin + datetime.timedelta(hours=1))
        kwargs.setdefault("reservation_units", [reservation_unit])
        return cls.create(**kwargs)

    @classmethod
    def create_for_refund(cls, **kwargs: Any) -> Reservation:
        """Create a Reservation for a single ReservationUnit in the necessary state for refunding it."""
        from .reservation_unit import ReservationUnitFactory

        sub_kwargs = cls.pop_sub_kwargs("reservation_units", kwargs)
        reservation_unit = ReservationUnitFactory.create(**sub_kwargs)

        begin = next_hour(plus_hours=-1)
        kwargs.setdefault("state", ReservationStateChoice.CANCELLED)
        kwargs.setdefault("begin", begin - datetime.timedelta(hours=2))
        kwargs.setdefault("end", begin - datetime.timedelta(hours=1))
        kwargs.setdefault("price", Decimal("12.4"))
        kwargs.setdefault("tax_percentage_value", Decimal("24.0"))
        kwargs.setdefault("payment_order__status", OrderStatus.PAID)
        kwargs.setdefault("payment_order__price_net", Decimal("10.0"))
        kwargs.setdefault("payment_order__price_vat", Decimal("2.4"))
        kwargs.setdefault("payment_order__price_total", Decimal("12.4"))
        kwargs.setdefault("reservation_units", [reservation_unit])
        return cls.create(**kwargs)

    @classmethod
    def create_for_requires_handling(cls, **kwargs: Any) -> Reservation:
        """Create a Reservation for a single ReservationUnit in the necessary state for setting handling required."""
        from .reservation_unit import ReservationUnitFactory
        from .reservation_unit_pricing import ReservationUnitPricingFactory

        sub_kwargs = cls.pop_sub_kwargs("reservation_units", kwargs)
        reservation_unit = ReservationUnitFactory.create(**sub_kwargs)

        ReservationUnitPricingFactory.create(
            reservation_unit=reservation_unit,
            lowest_price=Decimal("0.00"),
            highest_price=Decimal("0.00"),
        )

        begin = next_hour(plus_hours=1)
        kwargs.setdefault("state", ReservationStateChoice.CONFIRMED)
        kwargs.setdefault("type", ReservationTypeChoice.NORMAL)
        kwargs.setdefault("begin", begin)
        kwargs.setdefault("end", begin + datetime.timedelta(hours=1))
        kwargs.setdefault("reservation_units", [reservation_unit])
        return cls.create(**kwargs)


class NextDateError(Exception): ...


class ReservationBuilder(ModelFactoryBuilder[Reservation]):
    factory = ReservationFactory

    def for_user(self, user: User) -> Self:
        self.kwargs["user"] = user
        self.kwargs["reservee_first_name"] = user.first_name
        self.kwargs["reservee_last_name"] = user.last_name
        self.kwargs["reservee_email"] = user.email
        self.kwargs["reservee_language"] = user.get_preferred_language()
        return self

    def for_reservation_unit(self, reservation_unit: ReservationUnit) -> Self:
        min_persons = reservation_unit.min_persons or 0
        max_persons = reservation_unit.max_persons or (min_persons + 10)
        self.kwargs["num_persons"] = random.randint(min_persons, max_persons)
        self.kwargs["buffer_time_before"] = reservation_unit.buffer_time_before
        self.kwargs["buffer_time_after"] = reservation_unit.buffer_time_after
        return self

    def for_customer_type(self, customer_type: CustomerTypeChoice) -> Self:
        match customer_type:
            case CustomerTypeChoice.BUSINESS:
                return self.for_business()
            case CustomerTypeChoice.NONPROFIT:
                return self.for_nonprofit()
            case CustomerTypeChoice.INDIVIDUAL:
                return self.for_individual()

    def for_business(self) -> Self:
        self.kwargs["reservee_type"] = CustomerTypeChoice.BUSINESS
        self.kwargs["reservee_organisation_name"] = self.factory.reservee_organisation_name.generate()
        self.kwargs["reservee_id"] = self.factory.reservee_id.generate()
        self.kwargs["reservee_is_unregistered_association"] = False
        return self

    def for_nonprofit(self, *, unregistered: bool = False) -> Self:
        self.kwargs["reservee_type"] = CustomerTypeChoice.NONPROFIT
        self.kwargs["reservee_organisation_name"] = ""
        self.kwargs["reservee_id"] = "" if unregistered else self.factory.reservee_id.generate()
        self.kwargs["reservee_is_unregistered_association"] = False
        return self

    def for_individual(self) -> Self:
        self.kwargs["reservee_type"] = CustomerTypeChoice.INDIVIDUAL
        self.kwargs["reservee_organisation_name"] = ""
        self.kwargs["reservee_id"] = ""
        self.kwargs["reservee_is_unregistered_association"] = False
        return self

    def starting_at(
        self,
        begin: datetime.datetime,
        reservation_unit: ReservationUnit,
        *,
        allow_overnight: bool = False,
        subsidised: bool = False,
        pricing: ReservationUnitPricing | None = None,
    ) -> Self:
        """Add begin datetime and end datetime based on given reservation unit's allowed durations."""
        min_hours = math.ceil(reservation_unit.min_reservation_duration.total_seconds() / 3600)
        max_hours = math.ceil(reservation_unit.max_reservation_duration.total_seconds() / 3600)

        if not allow_overnight:
            # Reservation must end before midnight (=hour is 23)
            max_hours = min(max_hours, 23 - begin.hour)

            # If reservations cannot be this short on this day, go to the next day.
            if max_hours < min_hours:
                raise NextDateError

        duration = random.choice(range(min_hours, max_hours + 1))  # '+ 1' is for inclusive range maximum
        end = begin + datetime.timedelta(hours=duration)

        self.kwargs["begin"] = begin
        self.kwargs["end"] = end
        self.kwargs["buffer_time_before"] = reservation_unit.actions.get_actual_before_buffer(self.kwargs["begin"])
        self.kwargs["buffer_time_after"] = reservation_unit.actions.get_actual_after_buffer(self.kwargs["end"])

        if pricing is not None:
            self.kwargs["price"] = pricing.actions.calculate_reservation_price(duration=end - begin)
            self.kwargs["non_subsidised_price"] = pricing.highest_price
            self.kwargs["unit_price"] = pricing.lowest_price if subsidised else pricing.highest_price
            self.kwargs["tax_percentage_value"] = pricing.tax_percentage.value

        return self
