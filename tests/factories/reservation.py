import datetime
from decimal import Decimal
from typing import Any

from factory import fuzzy

from common.date_utils import local_start_of_day, next_hour
from merchants.enums import OrderStatus, PaymentType
from reservation_units.enums import PricingType
from reservation_units.models import ReservationUnit
from reservations.enums import ReservationStateChoice, ReservationTypeChoice
from reservations.models import Reservation

from ._base import GenericDjangoModelFactory, ManyToManyFactory, NullableSubFactory, OneToManyFactory

__all__ = [
    "ReservationFactory",
]


class ReservationFactory(GenericDjangoModelFactory[Reservation]):
    class Meta:
        model = Reservation

    # Basic information
    sku = fuzzy.FuzzyText()
    name = fuzzy.FuzzyText()
    description = fuzzy.FuzzyText()
    num_persons = None
    state = ReservationStateChoice.CREATED
    type = ReservationTypeChoice.NORMAL
    cancel_details = ""
    handling_details = ""
    working_memo = ""

    # Time information
    begin = fuzzy.FuzzyDateTime(
        start_dt=datetime.datetime(2021, 1, 1, tzinfo=datetime.UTC),
        end_dt=datetime.datetime(2022, 5, 31, tzinfo=datetime.UTC),
    )
    end = fuzzy.FuzzyDateTime(
        start_dt=datetime.datetime(2021, 1, 1, tzinfo=datetime.UTC),
        end_dt=datetime.datetime(2022, 5, 31, tzinfo=datetime.UTC),
    )
    buffer_time_before = datetime.timedelta()
    buffer_time_after = datetime.timedelta()
    handled_at = None
    confirmed_at = None
    created_at = None

    # Pricing details
    price = 0
    price_net = 0
    non_subsidised_price = 0
    non_subsidised_price_net = 0
    unit_price = 0
    tax_percentage_value = 0

    # Free of charge information
    applying_for_free_of_charge = False
    free_of_charge_reason = None

    # Reservee information
    reservee_id = ""
    reservee_first_name = fuzzy.FuzzyText()
    reservee_last_name = fuzzy.FuzzyText()
    reservee_email = None
    reservee_phone = ""
    reservee_organisation_name = ""
    reservee_address_street = ""
    reservee_address_city = ""
    reservee_address_zip = ""
    reservee_is_unregistered_association = False
    reservee_language = ""
    reservee_type = None

    # Billing information
    billing_first_name = ""
    billing_last_name = ""
    billing_email = ""
    billing_phone = ""
    billing_address_street = ""
    billing_address_city = ""
    billing_address_zip = ""

    # Forward Many-to-one relations
    user = NullableSubFactory("tests.factories.UserFactory")
    recurring_reservation = NullableSubFactory("tests.factories.RecurringReservationFactory", null=True)
    deny_reason = NullableSubFactory("tests.factories.ReservationDenyReasonFactory", null=True)
    cancel_reason = NullableSubFactory("tests.factories.ReservationCancelReasonFactory", null=True)
    purpose = NullableSubFactory("tests.factories.ReservationPurposeFactory", null=True)
    home_city = NullableSubFactory("tests.factories.HomeCityFactory", null=True)
    age_group = NullableSubFactory("tests.factories.AgeGroupFactory", null=True)

    # Forward Many-to-many relations
    reservation_unit = ManyToManyFactory("tests.factories.ReservationUnitFactory")

    # Reverse one-to-many relations
    payment_order = OneToManyFactory("tests.factories.PaymentOrderFactory")

    @classmethod
    def create_for_reservation_unit(cls, reservation_unit: ReservationUnit, **kwargs: Any) -> Reservation:
        """Create a Reservation for a single ReservationUnit with its buffer times."""
        kwargs.setdefault("state", ReservationStateChoice.CREATED)

        return cls.create(
            buffer_time_before=reservation_unit.buffer_time_before,
            buffer_time_after=reservation_unit.buffer_time_after,
            reservation_unit=[reservation_unit],
            **kwargs,
        )

    @classmethod
    def create_for_time_adjustment(cls, **kwargs: Any) -> Reservation:
        """Create a Reservation for a single ReservationUnit in the necessary state for time adjustment."""
        from .opening_hours import ReservableTimeSpanFactory
        from .reservation_unit import ReservationUnitFactory
        from .space import SpaceFactory

        space = SpaceFactory.create()

        sub_kwargs = cls.pop_sub_kwargs("reservation_unit", kwargs)
        sub_kwargs.setdefault("origin_hauki_resource__id", "987")
        sub_kwargs.setdefault("cancellation_rule__can_be_cancelled_time_before", datetime.timedelta(0))
        sub_kwargs.setdefault("spaces", [space])
        sub_kwargs.setdefault("unit", space.unit)
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
        kwargs.setdefault("reservation_unit", [reservation_unit])
        return cls.create(**kwargs)

    @classmethod
    def create_for_cancellation(cls, **kwargs: Any) -> Reservation:
        """Create a Reservation for a single ReservationUnit in the necessary state for cancellation."""
        from .reservation_unit import ReservationUnitFactory

        sub_kwargs = cls.pop_sub_kwargs("reservation_unit", kwargs)
        sub_kwargs.setdefault("cancellation_rule__can_be_cancelled_time_before", datetime.timedelta(hours=1))
        reservation_unit = ReservationUnitFactory.create(**sub_kwargs)

        begin = next_hour(plus_hours=1)
        kwargs.setdefault("state", ReservationStateChoice.CONFIRMED)
        kwargs.setdefault("begin", begin)
        kwargs.setdefault("end", begin + datetime.timedelta(hours=1))
        kwargs.setdefault("reservation_unit", [reservation_unit])
        return cls.create(**kwargs)

    @classmethod
    def create_for_confirmation(cls, **kwargs: Any) -> Reservation:
        """Create a Reservation for a single ReservationUnit in the necessary state for confirmation."""
        from .opening_hours import ReservableTimeSpanFactory
        from .payment import PaymentProductFactory
        from .reservation_unit import ReservationUnitFactory

        sub_kwargs = cls.pop_sub_kwargs("reservation_unit", kwargs)
        sub_kwargs.setdefault("origin_hauki_resource__id", "987")
        sub_kwargs.setdefault("payment_types", [PaymentType.ON_SITE])
        sub_kwargs.setdefault("payment_product", PaymentProductFactory.create())
        sub_kwargs.setdefault("pricings__pricing_type", PricingType.PAID)
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
        kwargs.setdefault("price_net", Decimal("10.0"))
        kwargs.setdefault("tax_percentage_value", Decimal("24.0"))
        kwargs.setdefault("reservation_unit", [reservation_unit])
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

        sub_kwargs = cls.pop_sub_kwargs("reservation_unit", kwargs)
        reservation_unit = ReservationUnitFactory.create(**sub_kwargs)

        begin = next_hour(plus_hours=1)
        kwargs.setdefault("state", ReservationStateChoice.CONFIRMED)
        kwargs.setdefault("begin", begin)
        kwargs.setdefault("end", begin + datetime.timedelta(hours=1))
        kwargs.setdefault("reservation_unit", [reservation_unit])
        return cls.create(**kwargs)

    @classmethod
    def create_for_delete(cls, **kwargs: Any) -> Reservation:
        """Create a Reservation for a single ReservationUnit in the necessary state for deletion."""
        from .reservation_unit import ReservationUnitFactory

        sub_kwargs = cls.pop_sub_kwargs("reservation_unit", kwargs)
        reservation_unit = ReservationUnitFactory.create(**sub_kwargs)

        begin = next_hour(plus_hours=1)
        kwargs.setdefault("state", ReservationStateChoice.CREATED)
        kwargs.setdefault("begin", begin)
        kwargs.setdefault("end", begin + datetime.timedelta(hours=1))
        kwargs.setdefault("reservation_unit", [reservation_unit])
        return cls.create(**kwargs)

    @classmethod
    def create_for_deny(cls, **kwargs: Any) -> Reservation:
        """Create a Reservation for a single ReservationUnit in the necessary state for denying it."""
        from .reservation_unit import ReservationUnitFactory

        sub_kwargs = cls.pop_sub_kwargs("reservation_unit", kwargs)
        reservation_unit = ReservationUnitFactory.create(**sub_kwargs)

        begin = next_hour(plus_hours=1)
        kwargs.setdefault("state", ReservationStateChoice.REQUIRES_HANDLING)
        kwargs.setdefault("type", ReservationTypeChoice.NORMAL)
        kwargs.setdefault("begin", begin)
        kwargs.setdefault("end", begin + datetime.timedelta(hours=1))
        kwargs.setdefault("reservation_unit", [reservation_unit])
        return cls.create(**kwargs)

    @classmethod
    def create_for_refund(cls, **kwargs: Any) -> Reservation:
        """Create a Reservation for a single ReservationUnit in the necessary state for refunding it."""
        from .reservation_unit import ReservationUnitFactory

        sub_kwargs = cls.pop_sub_kwargs("reservation_unit", kwargs)
        reservation_unit = ReservationUnitFactory.create(**sub_kwargs)

        begin = next_hour(plus_hours=-1)
        kwargs.setdefault("state", ReservationStateChoice.CANCELLED)
        kwargs.setdefault("begin", begin - datetime.timedelta(hours=2))
        kwargs.setdefault("end", begin - datetime.timedelta(hours=1))
        kwargs.setdefault("price", Decimal("12.4"))
        kwargs.setdefault("price_net", Decimal("10.0"))
        kwargs.setdefault("tax_percentage_value", Decimal("24.0"))
        kwargs.setdefault("payment_order__status", OrderStatus.PAID)
        kwargs.setdefault("payment_order__price_net", Decimal("10.0"))
        kwargs.setdefault("payment_order__price_vat", Decimal("2.4"))
        kwargs.setdefault("payment_order__price_total", Decimal("12.4"))
        kwargs.setdefault("reservation_unit", [reservation_unit])
        return cls.create(**kwargs)

    @classmethod
    def create_for_handling_required(cls, **kwargs: Any) -> Reservation:
        """Create a Reservation for a single ReservationUnit in the necessary state for setting handling required."""
        from .reservation_unit import ReservationUnitFactory

        sub_kwargs = cls.pop_sub_kwargs("reservation_unit", kwargs)
        reservation_unit = ReservationUnitFactory.create(**sub_kwargs)

        begin = next_hour(plus_hours=1)
        kwargs.setdefault("state", ReservationStateChoice.CONFIRMED)
        kwargs.setdefault("type", ReservationTypeChoice.NORMAL)
        kwargs.setdefault("begin", begin)
        kwargs.setdefault("end", begin + datetime.timedelta(hours=1))
        kwargs.setdefault("reservation_unit", [reservation_unit])
        return cls.create(**kwargs)
