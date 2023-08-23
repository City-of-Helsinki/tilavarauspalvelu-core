import datetime

from django.db.models import F, Q
from django.utils.timezone import get_default_timezone

from reservation_units.enums import ReservationState
from reservation_units.models import ReservationUnit


class ReservationUnitReservationStateHelper:
    @classmethod
    def __is_scheduled_reservation(cls, reservation_unit: ReservationUnit) -> bool:
        """Returns True if reservation unit has reservation_begins set in to the future with no ending date."""
        now = datetime.datetime.now(tz=get_default_timezone())

        return (reservation_unit.reservation_begins and now < reservation_unit.reservation_begins) and (
            reservation_unit.reservation_ends is None
            or reservation_unit.reservation_ends <= now
            or (
                reservation_unit.reservation_ends > now
                and reservation_unit.reservation_begins > reservation_unit.reservation_ends
            )
        )

    @classmethod
    def __get_is_scheduled_reservation_query(cls) -> Q:
        now = datetime.datetime.now(tz=get_default_timezone())

        return Q(
            Q(
                reservation_begins__isnull=False,
                reservation_begins__gt=now,
            )
            & Q(Q(reservation_ends__isnull=True) | Q(reservation_ends__lt=now))
        )

    @classmethod
    def __is_scheduled_period(cls, reservation_unit: ReservationUnit) -> bool:
        """Returns True if reservation unit has both reservation_begins
        and reservations_ends dates set to the future.
        """

        now = datetime.datetime.now(tz=get_default_timezone())

        return (
            reservation_unit.reservation_begins
            and reservation_unit.reservation_begins > now
            and reservation_unit.reservation_ends
            and reservation_unit.reservation_ends > now
            and reservation_unit.reservation_begins < reservation_unit.reservation_ends
        )

    @classmethod
    def __get_is_scheduled_period_query(cls) -> Q:
        now = datetime.datetime.now(tz=get_default_timezone())

        return Q(
            reservation_begins__isnull=False,
            reservation_begins__gt=now,
            reservation_ends__isnull=False,
            reservation_ends__gt=now,
            reservation_begins__lt=F("reservation_ends"),
        )

    @classmethod
    def __is_reservable(cls, reservation_unit: ReservationUnit) -> bool:
        """Returns True if reservation unit has reservation_begins set in the past and no reservation_ends."""
        now = datetime.datetime.now(tz=get_default_timezone())

        return (
            (
                reservation_unit.reservation_ends is None
                and (
                    reservation_unit.reservation_begins
                    and reservation_unit.reservation_begins <= now
                    or reservation_unit.reservation_begins is None
                )
            )
            or reservation_unit.reservation_ends <= now
            and reservation_unit.reservation_begins
            and reservation_unit.reservation_begins <= now
            and reservation_unit.reservation_begins > reservation_unit.reservation_ends
        )

    @classmethod
    def __get_is_reservable_query(cls) -> Q:
        now = datetime.datetime.now(tz=get_default_timezone())

        return Q(
            Q(reservation_ends__isnull=True) & (Q(reservation_begins__lte=now) | Q(reservation_begins__isnull=True))
            | Q(
                reservation_ends__lte=now,
                reservation_begins__lte=now,
                reservation_begins__gt=F("reservation_ends"),
            )
        )

    @classmethod
    def __is_scheduled_closing(cls, reservation_unit: ReservationUnit) -> bool:
        """Returns True if reservation unit has reservation_begins set in the past
        and reservation_ends in the future.
        """

        now = datetime.datetime.now(tz=get_default_timezone())

        return (
            reservation_unit.reservation_ends
            and reservation_unit.reservation_ends > now
            and (
                reservation_unit.reservation_begins is None
                or (reservation_unit.reservation_begins and reservation_unit.reservation_begins <= now)
            )
        )

    @classmethod
    def __get_is_scheduled_closing_query(cls) -> Q:
        now = datetime.datetime.now(tz=get_default_timezone())

        return Q(reservation_ends__gt=now) & (Q(reservation_begins__lte=now) | Q(reservation_begins__isnull=True))

    @classmethod
    def __is_reservation_closed(cls, reservation_unit: ReservationUnit) -> bool:
        """Returns True if reservation begins is in the past or none and if the reservation ends is in the past.
        Meaning the reservation is not scheduled to open anymore.
        """
        now = datetime.datetime.now(tz=get_default_timezone())

        return (
            reservation_unit.reservation_ends
            and reservation_unit.reservation_ends <= now
            and (
                reservation_unit.reservation_begins is None
                or (
                    reservation_unit.reservation_begins <= now
                    and reservation_unit.reservation_begins <= reservation_unit.reservation_ends
                )
            )
            or (
                reservation_unit.reservation_begins
                and reservation_unit.reservation_ends
                and reservation_unit.reservation_ends > now
                and reservation_unit.reservation_begins > now
                and reservation_unit.reservation_begins == reservation_unit.reservation_ends
            )
        )

    @classmethod
    def __get_is_reservation_closed_query(cls) -> Q:
        now = datetime.datetime.now(tz=get_default_timezone())

        return Q(
            Q(
                Q(reservation_ends__lte=now)
                & (
                    Q(Q(reservation_begins__lte=now) & Q(reservation_begins__lte=F("reservation_ends")))
                    | Q(reservation_begins__isnull=True)
                )
            )
            | Q(
                reservation_ends__gt=now,
                reservation_begins__gt=now,
                reservation_begins=F("reservation_ends"),
            )
        )

    @classmethod
    def __get_undefined_query(cls) -> Q:
        return ~Q(
            Q(cls.__get_is_scheduled_reservation_query())
            | Q(cls.__get_is_reservable_query())
            | Q(cls.__get_is_reservation_closed_query())
            | Q(cls.__get_is_scheduled_closing_query())
            | Q(cls.__get_is_scheduled_period_query())
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

    @classmethod
    def get_state_query(cls, state: str) -> Q:
        """Get matching filter query based on the Reservation Unit state (as string)"""
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

        return cls.__get_undefined_query()
