import datetime
from dataclasses import dataclass, field

from django.conf import settings
from django.db.models import Expression, F, OuterRef, Q, Subquery

from common.date_utils import local_datetime
from reservation_units.enums import PricingStatus, PricingType, ReservationState
from reservation_units.models import ReservationUnit, ReservationUnitPricing
from reservation_units.utils.reservation_unit_pricing_helper import ReservationUnitPricingHelper


@dataclass
class QueryState:
    filters: Q = field(default_factory=Q)
    aliases: dict[str, Expression | F] = field(default_factory=dict)


class ReservationUnitReservationStateHelper:
    @classmethod
    def __is_scheduled_reservation(cls, reservation_unit: ReservationUnit) -> bool:
        """
        Is ReservationUnit currently not reservable, but scheduled for reservations in the future WITHOUT an end date?
        - reservation_begins is in the future
        - reservation_ends is in the past or not set.

        ┌────────┬────────┬────────┐
        │ Begins │  Ends  │ Result │
        ├────────┼────────┼────────┤
        │ Never  │ *      │ False  │
        │ Past   │ *      │ False  │
        │ Now    │ *      │ False  │
        │ Future │ Never  │ True   │
        │ Future │ Past   │ True   │
        │ Future │ Now    │ True   │
        │ Future │ Future │ False  │
        └────────┴────────┴────────┘
        """
        now = local_datetime()

        if (
            # Reservations don't ever begin
            reservation_unit.reservation_begins is None
            # Reservations have already begun
            or reservation_unit.reservation_begins <= now
        ):
            return False

        return (
            # Reservations don't end
            reservation_unit.reservation_ends is None
            # Or they have ended in the past
            or reservation_unit.reservation_ends <= now
        )

    @classmethod
    def __get_is_scheduled_reservation_query(cls) -> QueryState:
        now = local_datetime()

        return QueryState(
            filters=Q(reservation_begins__gt=now) & (Q(reservation_ends__isnull=True) | Q(reservation_ends__lte=now)),
        )

    @classmethod
    def __is_scheduled_period(cls, reservation_unit: ReservationUnit) -> bool:
        """
        Is ReservationUnit currently not reservable, but scheduled for reservations in the future WITH an end date?
        - reservation_begins is in the future
        - reservation_ends is in the future
        - reservation_begins is before reservation_ends

        ┌────────┬────────┬────────┐
        │ Begins │  Ends  │ Result │
        ├────────┼────────┼────────┤
        │ *      │ Never  │ False  │
        │ Never  │ *      │ False  │
        │ Past   │ *      │ False  │
        │ Now    │ Past   │ False  │
        │ Now    │ Now    │ False  │
        │ Now    │ Future │ True   │
        │ Future │ Past   │ False  │
        │ Future │ Now    │ False  │
        │ Future │ Future │ False  │ Begins >= Ends
        │ Future │ Future │ True   │ Begins <  Ends
        └────────┴────────┴────────┘
        """
        now = local_datetime()

        if reservation_unit.reservation_begins is None or reservation_unit.reservation_ends is None:
            return False

        # Reservation begins and ends in the future, and begins before it ends
        return now < reservation_unit.reservation_begins < reservation_unit.reservation_ends

    @classmethod
    def __get_is_scheduled_period_query(cls) -> QueryState:
        now = local_datetime()

        return QueryState(
            filters=Q(
                reservation_begins__gt=now,
                reservation_ends__gt=now,
                reservation_begins__lt=F("reservation_ends"),
            ),
        )

    @classmethod
    def __active_pricing_type_alias(cls) -> dict[str, Subquery]:
        return {
            "active_pricing_type": Subquery(
                queryset=(
                    ReservationUnitPricing.objects.filter(
                        reservation_unit=OuterRef("pk"),
                        status=PricingStatus.PRICING_STATUS_ACTIVE,
                    ).values("pricing_type")[:1]
                ),
            ),
        }

    @classmethod
    def __has_valid_pricing(cls, reservation_unit: ReservationUnit) -> bool:
        active_price = ReservationUnitPricingHelper.get_active_price(reservation_unit)

        if active_price is None:
            return False

        # If MOCK_VERKKOKAUPPA_API_ENABLED is True there is no need to check for payment products,
        if settings.MOCK_VERKKOKAUPPA_API_ENABLED:
            return True

        # Pricing is FREE
        if active_price.pricing_type == PricingType.FREE:
            return True
        # Pricing is PAID and there is a payment product
        else:
            return reservation_unit.payment_product is not None

    @classmethod
    def __has_valid_pricing_query(cls) -> Q:
        # If MOCK_VERKKOKAUPPA_API_ENABLED is True there is no need to check for payment products,
        # as the products are created when a reservation is made.
        if settings.MOCK_VERKKOKAUPPA_API_ENABLED:
            return Q(active_pricing_type__isnull=False)

        return (
            # Pricing is paid and there is a payment product
            Q(active_pricing_type=PricingType.PAID, payment_product__isnull=False)
            # or pricing is free
            | Q(active_pricing_type=PricingType.FREE)
        )

    @classmethod
    def __is_reservable(cls, reservation_unit: ReservationUnit) -> bool:
        now = local_datetime()

        return cls.__is_reservable_period(now, reservation_unit) and cls.__has_valid_pricing(reservation_unit)

    @classmethod
    def __get_is_reservable_query(cls) -> QueryState:
        return QueryState(
            aliases=cls.__active_pricing_type_alias(),
            filters=(cls.__is_reservable_period_query() & cls.__has_valid_pricing_query()),
        )

    @classmethod
    def __is_reservable_period(cls, now: datetime.datetime, reservation_unit: ReservationUnit) -> bool:
        """
        ┌────────┬────────┬────────┐
        │ Begins │  Ends  │ Result │
        ├────────┼────────┼────────┤
        │ Never  │ Never  │ True   │
        │ Never  │ Past   │ False  │
        │ Never  │ Now    │ False  │
        │ Never  │ Future │ False  │
        │ Past   │ Never  │ True   │
        │ Past   │ Past   │ False  │
        │ Past   │ Now    │ False  │
        │ Past   │ Future │ False  │
        │ Now    │ Never  │ True   │
        │ Now    │ Past   │ True   │
        │ Now    │ Now    │ False  │
        │ Now    │ Future │ False  │
        │ Future │ *      │ False  │
        └────────┴────────┴────────┘
        """
        # Reservations don't have a set beginning or end
        if reservation_unit.reservation_ends is None and reservation_unit.reservation_begins is None:
            return True

        # Reservations never begin (but have an end).
        if reservation_unit.reservation_begins is None:
            return False

        if reservation_unit.reservation_ends is None:
            # Or reservations begin in the future
            return reservation_unit.reservation_begins <= now
        else:
            # Reservations have already begun and end in the past, but begin after they end
            return reservation_unit.reservation_ends < reservation_unit.reservation_begins <= now

    @classmethod
    def __is_reservable_period_query(cls) -> Q:
        now = local_datetime()

        return (
            Q(reservation_begins__isnull=True, reservation_ends__isnull=True)
            | Q(reservation_begins__lte=now, reservation_ends__isnull=True)
            | Q(reservation_begins__lte=now, reservation_ends__lt=F("reservation_begins"))
        )

    @classmethod
    def __is_scheduled_closing(cls, reservation_unit: ReservationUnit) -> bool:
        now = local_datetime()

        return cls.__is_scheduled_closing_period(now, reservation_unit) and cls.__has_valid_pricing(reservation_unit)

    @classmethod
    def __get_is_scheduled_closing_query(cls) -> QueryState:
        return QueryState(
            aliases=cls.__active_pricing_type_alias(),
            filters=(cls.__is_scheduled_closing_period_query() & cls.__has_valid_pricing_query()),
        )

    @classmethod
    def __is_scheduled_closing_period(cls, now: datetime.datetime, reservation_unit: ReservationUnit) -> bool:
        """
        ┌────────┬────────┬────────┐
        │ Begins │  Ends  │ Result │
        ├────────┼────────┼────────┤
        │ *      │ Never  │ False  │
        │ *      │ Past   │ False  │
        │ Never  │ Now    │ True   │
        │ Never  │ Future │ True   │
        │ Past   │ Now    │ True   │
        │ Past   │ Future │ True   │
        │ Now    │ Now    │ True   │
        │ Now    │ Future │ True   │
        │ Future │ Now    │ False  │
        │ Future │ Future │ False  │ Begins < Ends
        │ Future │ Future │ True   │ Begins > Ends
        └────────┴────────┴────────┘
        """
        # Reservations don't end or end in the past
        if reservation_unit.reservation_ends is None or reservation_unit.reservation_ends < now:
            return False

        return (
            # Reservations don't have a beginning
            reservation_unit.reservation_begins is None
            # Reservations have begun in the past
            or reservation_unit.reservation_begins <= now
            # Reservations begin in the future after they have ended end
            or now < reservation_unit.reservation_ends < reservation_unit.reservation_begins
        )

    @classmethod
    def __is_scheduled_closing_period_query(cls) -> Q:
        now = local_datetime()
        return Q(reservation_ends__gt=now) & (
            Q(reservation_begins__isnull=True)
            | Q(reservation_begins__lte=now)
            | Q(reservation_ends__gt=now, reservation_ends__lt=F("reservation_begins"))
        )

    @classmethod
    def __is_reservation_closed(cls, reservation_unit: ReservationUnit) -> bool:
        """
        ┌────────┬────────┬────────┐
        │ Begins │  Ends  │ Result │
        ├────────┼────────┼────────┤
        │ Never  │ Never  │ True   │
        │ Never  │ Past   │ True   │
        │ Never  │ Now    │ True   │
        │ Never  │ Future │ True ? │ from __is_scheduled_closing_period
        │ Past   │ Never  │ True ? │ from __is_reservable_period
        │ Past   │ Past   │ True   │
        │ Past   │ Now    │ True   │
        │ Past   │ Future │ True ? │ from __is_scheduled_closing_period
        │ Now    │ Never  │ True ? │ from __is_reservable_period
        │ Now    │ Past   │ True ? │ from __is_reservable_period
        │ Now    │ Now    │ True   │
        │ Now    │ Future │ True ? │ from __is_scheduled_closing_period
        │ Future │ Never  │ False  │
        │ Future │ Past   │ False  │
        │ Future │ Now    │ False  │
        │ Future │ Future │ False  │ Begins < Ends
        │ Future │ Future │ True ? │ Begins > Ends, from __is_scheduled_closing_period
        └────────┴────────┴────────┘
        """
        now = local_datetime()

        # Reservation period would be zero-length
        if reservation_unit.reservation_begins == reservation_unit.reservation_ends:
            return True

        if reservation_unit.reservation_ends is not None:
            # Reservations don't begin, but have already ended
            if reservation_unit.reservation_begins is None:
                if reservation_unit.reservation_ends <= now:
                    return True
            # Reservations begin in the past, and end in the past (or right now) and begin before they end
            elif reservation_unit.reservation_begins <= reservation_unit.reservation_ends <= now:
                return True

        active_price = ReservationUnitPricingHelper.get_active_price(reservation_unit)

        # Reservation period would be for reservable or scheduled closing based on reservable period,
        # but there is no active pricing or pricing is paid and there is no payment product
        return (
            cls.__is_reservable_period(now, reservation_unit)
            or cls.__is_scheduled_closing_period(now, reservation_unit)
        ) and (
            active_price is None
            or (
                active_price.pricing_type == PricingType.PAID
                and reservation_unit.payment_product is None
                and not settings.MOCK_VERKKOKAUPPA_API_ENABLED  # Don't show as closed if using Mock Verkkokauppa API
            )
        )

    @classmethod
    def __get_is_reservation_closed_query(cls) -> QueryState:
        now = local_datetime()

        payment_product_query = Q(active_pricing_type=PricingType.PAID) & Q(payment_product__isnull=True)
        if settings.MOCK_VERKKOKAUPPA_API_ENABLED:
            payment_product_query = Q()

        return QueryState(
            aliases=cls.__active_pricing_type_alias(),
            filters=(
                Q(reservation_ends__lte=now, reservation_ends__gte=F("reservation_begins"))
                | Q(reservation_begins__isnull=True, reservation_ends__lte=now)
                | Q(reservation_ends=F("reservation_begins"))
                | (
                    (cls.__is_reservable_period_query() | cls.__is_scheduled_closing_period_query())
                    & (Q(active_pricing_type=None) | payment_product_query)
                )
            ),
        )

    @classmethod
    def get_state(cls, reservation_unit: ReservationUnit) -> ReservationState:
        if cls.__is_scheduled_reservation(reservation_unit):
            return ReservationState.SCHEDULED_RESERVATION
        if cls.__is_scheduled_period(reservation_unit):
            return ReservationState.SCHEDULED_PERIOD
        if cls.__is_reservable(reservation_unit):
            return ReservationState.RESERVABLE
        if cls.__is_scheduled_closing(reservation_unit):
            return ReservationState.SCHEDULED_CLOSING
        if cls.__is_reservation_closed(reservation_unit):
            return ReservationState.RESERVATION_CLOSED

        raise ValueError(f"Unknown reservation state for reservation unit: {reservation_unit.pk}")

    @classmethod
    def get_state_query(cls, state: str) -> QueryState:
        state = ReservationState(state)
        if state == ReservationState.SCHEDULED_RESERVATION:
            return cls.__get_is_scheduled_reservation_query()
        elif state == ReservationState.SCHEDULED_PERIOD:
            return cls.__get_is_scheduled_period_query()
        elif state == ReservationState.RESERVABLE:
            return cls.__get_is_reservable_query()
        elif state == ReservationState.SCHEDULED_CLOSING:
            return cls.__get_is_scheduled_closing_query()
        elif state == ReservationState.RESERVATION_CLOSED:
            return cls.__get_is_reservation_closed_query()

        raise ValueError(f"Unknown reservation state: {state}")
