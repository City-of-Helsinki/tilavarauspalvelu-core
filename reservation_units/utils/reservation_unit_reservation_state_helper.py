import datetime
from dataclasses import dataclass, field

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

        return (
            # Reservations begin in the future
            reservation_unit.reservation_begins is not None and reservation_unit.reservation_begins > now
        ) and (
            # Reservations don't end, or have ended somewhere in the past
            reservation_unit.reservation_ends is None or reservation_unit.reservation_ends <= now
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

        # Reservation begins and ends in the future, and begins before it ends
        return (
            reservation_unit.reservation_begins is not None
            and reservation_unit.reservation_ends is not None
            and now < reservation_unit.reservation_begins < reservation_unit.reservation_ends
        )

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

        return (
            # There is an active pricing
            active_price is not None
            and (
                # Pricing is paid and there is a payment product, or pricing is free
                (active_price.pricing_type == PricingType.PAID and reservation_unit.payment_product is not None)
                or active_price.pricing_type == PricingType.FREE
            )
        )

    @classmethod
    def __has_valid_pricing_query(cls) -> Q:
        return Q(active_pricing_type=PricingType.PAID, payment_product__isnull=False) | Q(
            active_pricing_type=PricingType.FREE
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
        return (
            # Reservations don't begin or end
            (reservation_unit.reservation_ends is None and reservation_unit.reservation_begins is None)
            # Reservations don't end, but begin somewhere in the past (or right now)
            or (
                reservation_unit.reservation_ends is None
                and reservation_unit.reservation_begins is not None
                and reservation_unit.reservation_begins <= now
            )
            # Reservations begin somewhere in the past (or right now),
            # and end in the past, but begin after they end
            or (
                reservation_unit.reservation_ends is not None
                and reservation_unit.reservation_begins is not None
                and reservation_unit.reservation_ends < reservation_unit.reservation_begins <= now
            )
        )

    @classmethod
    def __is_reservable_period_query(cls) -> Q:
        now = local_datetime()

        return (
            Q(reservation_begins__isnull=True, reservation_ends__isnull=True)
            | Q(reservation_ends__isnull=True, reservation_begins__lte=now)
            | Q(reservation_begins__lte=now, reservation_begins__gt=F("reservation_ends"))
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
        return (
            # Reservations end in the future
            reservation_unit.reservation_ends is not None
            and reservation_unit.reservation_ends > now
            and (
                # Reservations don't begin
                reservation_unit.reservation_begins is None
                # Reservations begin in the past
                or (reservation_unit.reservation_begins is not None and reservation_unit.reservation_begins <= now)
                # Reservations being in the future after they end
                or (
                    reservation_unit.reservation_begins is not None
                    and now < reservation_unit.reservation_ends < reservation_unit.reservation_begins
                )
            )
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

        active_price = ReservationUnitPricingHelper.get_active_price(reservation_unit)

        return (
            (
                # Reservations don't begin, but end in the past (or right now)
                reservation_unit.reservation_begins is None
                and reservation_unit.reservation_ends is not None
                and reservation_unit.reservation_ends <= now
            )
            or (
                # Reservations begin in the past, and end in the past (or right now),
                # but begin before they end (or at the same time)
                reservation_unit.reservation_begins is not None
                and reservation_unit.reservation_ends is not None
                and reservation_unit.reservation_begins <= reservation_unit.reservation_ends <= now
            )
            # Reservation period would be zero-length
            or reservation_unit.reservation_begins == reservation_unit.reservation_ends
            or (
                # Reservation period would be for reservable or scheduled closing based on reservable period,
                # but there is no active pricing or pricing is paid and there is no payment product
                (
                    cls.__is_reservable_period(now, reservation_unit)
                    or cls.__is_scheduled_closing_period(now, reservation_unit)
                )
                and (
                    active_price is None
                    or (active_price.pricing_type == PricingType.PAID and reservation_unit.payment_product is None)
                )
            )
        )

    @classmethod
    def __get_is_reservation_closed_query(cls) -> QueryState:
        now = local_datetime()

        return QueryState(
            aliases=cls.__active_pricing_type_alias(),
            filters=(
                Q(reservation_ends__lte=now, reservation_ends__gte=F("reservation_begins"))
                | Q(reservation_begins__isnull=True, reservation_ends__lte=now)
                | Q(reservation_ends=F("reservation_begins"))
                | (
                    (cls.__is_reservable_period_query() | cls.__is_scheduled_closing_period_query())
                    & (
                        Q(active_pricing_type=None)
                        | (Q(active_pricing_type=PricingType.PAID) & Q(payment_product__isnull=True))
                    )
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
