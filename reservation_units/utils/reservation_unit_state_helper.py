import datetime

from django.db.models import F, Q
from django.utils.timezone import get_default_timezone

from reservation_units.enums import ReservationUnitState
from reservation_units.models import ReservationUnit


class ReservationUnitStateHelper:
    @staticmethod
    def __draft_or_archived(reservation_unit: ReservationUnit) -> bool:
        if reservation_unit.is_draft or reservation_unit.is_archived:
            return True

        return False

    # ARCHIVED
    @staticmethod
    def __is_archived(reservation_unit: ReservationUnit) -> bool:
        return reservation_unit.is_archived

    @staticmethod
    def __get_is_archived_query() -> Q:
        return Q(is_archived=True)

    # DRAFT
    @staticmethod
    def __is_draft(reservation_unit: ReservationUnit) -> bool:
        return reservation_unit.is_draft and not reservation_unit.is_archived

    @staticmethod
    def __get_is_draft_query() -> Q:
        return Q(
            is_draft=True,
            is_archived=False,
        )

    @staticmethod
    # SCHEDULED_PUBLISHING
    def __is_scheduled_publishing(reservation_unit: ReservationUnit) -> bool:
        """Return True if reservation unit has publish_begins set in the future and end isn't specified."""

        now = datetime.datetime.now(tz=get_default_timezone())

        if ReservationUnitStateHelper.__draft_or_archived(reservation_unit):
            return False

        return (reservation_unit.publish_begins and now < reservation_unit.publish_begins) and (
            reservation_unit.publish_ends is None
            or reservation_unit.publish_ends <= now
            or (reservation_unit.publish_ends > now and reservation_unit.publish_begins > reservation_unit.publish_ends)
        )

    @staticmethod
    def __get_is_scheduled_publishing_query() -> Q:
        now = datetime.datetime.now(tz=get_default_timezone())

        # Had to split this into two Q objects because of black formatting failed with one Q object
        first_q = Q(
            is_archived=False,
            is_draft=False,
            publish_begins__isnull=False,
            publish_begins__gt=now,
        )
        second_q = (
            Q(publish_ends__isnull=True)
            | Q(publish_ends__lte=now)
            | Q(Q(publish_ends__gt=now, publish_begins__gt=F("publish_ends")))
        )

        return Q(first_q) & Q(second_q)

    @staticmethod
    def __is_scheduled_period(reservation_unit: ReservationUnit) -> bool:
        """Returns True if reservation unit has not been published and has publish_ends set in the future."""
        now = datetime.datetime.now(tz=get_default_timezone())

        if ReservationUnitStateHelper.__draft_or_archived(reservation_unit):
            return False

        return (
            reservation_unit.publish_begins
            and reservation_unit.publish_begins > now
            and reservation_unit.publish_ends
            and reservation_unit.publish_ends > now
            and reservation_unit.publish_begins < reservation_unit.publish_ends
        )

    @staticmethod
    def __get_is_scheduled_period_query() -> Q:
        now = datetime.datetime.now(tz=get_default_timezone())

        return Q(
            is_archived=False,
            is_draft=False,
            publish_begins__isnull=False,
            publish_begins__gt=now,
            publish_ends__isnull=False,
            publish_ends__gt=now,
            publish_begins__lt=F("publish_ends"),
        )

    @staticmethod
    def __is_scheduled_hiding(reservation_unit: ReservationUnit) -> bool:
        """Return True if reservation unit is published and is going to be hidden in the future."""
        now = datetime.datetime.now(tz=get_default_timezone())

        if ReservationUnitStateHelper.__draft_or_archived(reservation_unit):
            return False

        return (
            reservation_unit.publish_ends
            and reservation_unit.publish_ends > now
            and (
                reservation_unit.publish_begins is None
                or (reservation_unit.publish_begins and reservation_unit.publish_begins <= now)
            )
        )

    @staticmethod
    def __get_is_scheduled_hiding_query() -> Q:
        now = datetime.datetime.now(tz=get_default_timezone())

        return Q(is_archived=False, is_draft=False, publish_ends__gt=now) & (
            Q(publish_begins__lte=now) | Q(publish_begins__isnull=True)
        )

    @staticmethod
    def __is_hidden(reservation_unit: ReservationUnit) -> bool:
        """Returns True if reservation unit publish_ends has passed and is not going to be published in the future."""

        now = datetime.datetime.now(tz=get_default_timezone())

        if ReservationUnitStateHelper.__draft_or_archived(reservation_unit):
            return False

        return (
            reservation_unit.publish_ends
            and reservation_unit.publish_ends <= now
            and (
                reservation_unit.publish_begins is None
                or (
                    reservation_unit.publish_begins <= now
                    and reservation_unit.publish_begins <= reservation_unit.publish_ends
                )
            )
            or (
                reservation_unit.publish_begins
                and reservation_unit.publish_ends
                and reservation_unit.publish_ends > now
                and reservation_unit.publish_begins > now
                and reservation_unit.publish_begins == reservation_unit.publish_ends
            )
        )

    @staticmethod
    def __get_is_hidden_query() -> Q:
        now = datetime.datetime.now(tz=get_default_timezone())
        return Q(is_archived=False, is_draft=False) & (
            Q(
                Q(publish_ends__lte=now)
                & (
                    Q(Q(publish_begins__lte=now) & Q(publish_begins__lte=F("publish_ends")))
                    | Q(publish_begins__isnull=True)
                )
            )
            | Q(
                publish_ends__gt=now,
                publish_begins__gt=now,
                publish_begins=F("publish_ends"),
            )
        )

    # PUBLISHED
    @staticmethod
    def __get_is_published_query() -> Q:
        now = datetime.datetime.now(tz=get_default_timezone())
        return Q(is_archived=False, is_draft=False) & (
            (Q(publish_ends__isnull=True) & (Q(publish_begins__lte=now) | Q(publish_begins__isnull=True)))
            | Q(
                publish_ends__lte=now,
                publish_begins__lte=now,
                publish_begins__gt=F("publish_ends"),
            )
        )

    @staticmethod
    def get_state(reservation_unit: ReservationUnit) -> ReservationUnitState:
        """Figure out the state of the Reservation Unit"""
        if ReservationUnitStateHelper.__is_archived(reservation_unit):
            return ReservationUnitState.ARCHIVED
        elif ReservationUnitStateHelper.__is_draft(reservation_unit):
            return ReservationUnitState.DRAFT
        elif ReservationUnitStateHelper.__is_scheduled_publishing(reservation_unit):
            return ReservationUnitState.SCHEDULED_PUBLISHING
        elif ReservationUnitStateHelper.__is_hidden(reservation_unit):
            return ReservationUnitState.HIDDEN
        elif ReservationUnitStateHelper.__is_scheduled_hiding(reservation_unit):
            return ReservationUnitState.SCHEDULED_HIDING
        elif ReservationUnitStateHelper.__is_scheduled_period(reservation_unit):
            return ReservationUnitState.SCHEDULED_PERIOD
        else:
            return ReservationUnitState.PUBLISHED

    @staticmethod
    def get_state_query(state: str) -> Q:
        """Get matching filter query based on the Reservation Unit state (as string)"""
        state = ReservationUnitState(state)
        if state == ReservationUnitState.ARCHIVED:
            return ReservationUnitStateHelper.__get_is_archived_query()
        elif state == ReservationUnitState.DRAFT:
            return ReservationUnitStateHelper.__get_is_draft_query()
        elif state == ReservationUnitState.SCHEDULED_PUBLISHING:
            return ReservationUnitStateHelper.__get_is_scheduled_publishing_query()
        elif state == ReservationUnitState.SCHEDULED_HIDING:
            return ReservationUnitStateHelper.__get_is_scheduled_hiding_query()
        elif state == ReservationUnitState.HIDDEN:
            return ReservationUnitStateHelper.__get_is_hidden_query()
        elif state == ReservationUnitState.SCHEDULED_PERIOD:
            return ReservationUnitStateHelper.__get_is_scheduled_period_query()
        else:
            return ReservationUnitStateHelper.__get_is_published_query()
