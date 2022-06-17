import datetime

from django.db.models import Q
from django.utils.timezone import get_default_timezone

from reservation_units.enums import ReservationUnitState
from reservation_units.models import ReservationUnit


class ReservationUnitStateHelper:

    # ARCHIVED
    def __is_archived(reservation_unit: ReservationUnit) -> bool:
        return reservation_unit.is_archived

    def __get_is_archived_query() -> Q:
        return Q(is_archived=True)

    # DRAFT
    def __is_draft(reservation_unit: ReservationUnit) -> bool:
        return reservation_unit.is_draft and not reservation_unit.is_archived

    def __get_is_draft_query() -> Q:
        return Q(
            is_draft=True,
            is_archived=False,
        )

    # SCHEDULED_PUBLISHING
    def __is_scheduled_publishing(reservation_unit: ReservationUnit) -> bool:
        now = datetime.datetime.now(tz=get_default_timezone())
        if ReservationUnitStateHelper.__is_draft(
            reservation_unit
        ) or ReservationUnitStateHelper.__is_archived(reservation_unit):
            return False

        return (
            reservation_unit.publish_begins and now < reservation_unit.publish_begins
        ) or (reservation_unit.publish_ends and now >= reservation_unit.publish_ends)

    def __get_is_scheduled_publishing_query() -> Q:
        now = datetime.datetime.now(tz=get_default_timezone())
        return Q(is_archived=False, is_draft=False) & (
            Q(publish_begins__isnull=False, publish_begins__gt=now)
            | Q(publish_ends__isnull=False, publish_ends__lte=now)
        )

    # SCHEDULED_RESERVATION
    def __is_scheduled_reservation(reservation_unit: ReservationUnit) -> bool:
        now = datetime.datetime.now(tz=get_default_timezone())
        if ReservationUnitStateHelper.__is_draft(
            reservation_unit
        ) or ReservationUnitStateHelper.__is_archived(reservation_unit):
            return False
        return (
            reservation_unit.reservation_begins
            and now < reservation_unit.reservation_begins
        ) or (
            reservation_unit.reservation_ends
            and now >= reservation_unit.reservation_ends
        )

    def __get_is_scheduled_reservation_query() -> Q:
        now = datetime.datetime.now(tz=get_default_timezone())
        return Q(reservation_begins__isnull=False, reservation_begins__gt=now) | Q(
            reservation_ends__isnull=False, reservation_ends__lte=now
        )

    # PUBLISHED
    def __get_is_published_query() -> Q:
        now = datetime.datetime.now(tz=get_default_timezone())
        return (
            Q(is_archived=False)
            & Q(is_draft=False)
            & (Q(publish_begins__isnull=True) | Q(publish_begins__lte=now))
            & (Q(publish_ends__isnull=True) | Q(publish_ends__gt=now))
            & (Q(reservation_begins__isnull=True) | Q(reservation_begins__lte=now))
            & (Q(reservation_ends__isnull=True) | Q(reservation_ends__gt=now))
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
        elif ReservationUnitStateHelper.__is_scheduled_reservation(reservation_unit):
            return ReservationUnitState.SCHEDULED_RESERVATION
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
        elif state == ReservationUnitState.SCHEDULED_RESERVATION:
            return ReservationUnitStateHelper.__get_is_scheduled_reservation_query()
        else:
            return ReservationUnitStateHelper.__get_is_published_query()
