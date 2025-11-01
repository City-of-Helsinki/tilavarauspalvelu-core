from __future__ import annotations

import pytest
from auditlog.models import LogEntry
from django.contrib.contenttypes.models import ContentType

from tilavarauspalvelu.enums import ReservationStateChoice
from tilavarauspalvelu.models import ReservationUnit
from utils.auditlog_util import AuditLogger
from utils.date_utils import next_hour

from tests.factories import ReservationFactory, ReservationUnitFactory, SpaceFactory

from .helpers import ARCHIVE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit__archive__also_sets_as_draft(graphql):
    graphql.login_with_superuser()

    space = SpaceFactory.create()
    reservation_unit = ReservationUnitFactory.create(is_draft=False, spaces=[space])
    data = {"pk": reservation_unit.pk}

    response = graphql(ARCHIVE_MUTATION, variables={"input": data})
    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.is_archived is True
    assert reservation_unit.is_draft is True


def test_reservation_unit__archive__is_blocked_if_reservation_unit_has_future_reservations(graphql):
    graphql.login_with_superuser()

    space = SpaceFactory.create()
    reservation_unit = ReservationUnitFactory.create(is_draft=False, spaces=[space])
    ReservationFactory.create_for_reservation_unit(
        reservation_unit,
        begins_at=next_hour(plus_days=1),
        ends_at=next_hour(plus_days=1, plus_hours=1),
    )

    data = {"pk": reservation_unit.pk}

    response = graphql(ARCHIVE_MUTATION, variables={"input": data})
    assert response.has_errors is True, response
    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "Reservation unit can't be archived if it has any reservations in the future"
    ]

    reservation_unit.refresh_from_db()
    assert reservation_unit.is_archived is False
    assert reservation_unit.is_draft is False


def test_reservation_unit__archive__not_blocked_if_reservation_unit_has_future_inactive_reservations(graphql):
    graphql.login_with_superuser()

    space = SpaceFactory.create()
    reservation_unit = ReservationUnitFactory.create(is_draft=False, spaces=[space])
    ReservationFactory.create_for_reservation_unit(
        reservation_unit,
        state=ReservationStateChoice.CANCELLED,
        begins_at=next_hour(plus_days=1),
        ends_at=next_hour(plus_days=1, plus_hours=1),
    )

    data = {"pk": reservation_unit.pk}

    response = graphql(ARCHIVE_MUTATION, variables={"input": data})
    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.is_archived is True
    assert reservation_unit.is_draft is True


def test_reservation_unit__archive__removes_contact_information_and_audit_logs(graphql, settings):
    settings.AUDIT_LOGGING_ENABLED = True
    AuditLogger.register(
        ReservationUnit,
        # Exclude lookup properties, since they are calculated values.
        exclude_fields=[
            "_publishing_state",
            "_reservation_state",
            "_active_pricing_price",
            "_current_access_type",
        ],
    )

    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=True, contact_information="foo")
    reservation_unit.contact_information = "bar"
    reservation_unit.save()

    # Two log entries are exist for the reservation unit,
    # one for the creation and one for the contact information update
    content_type = ContentType.objects.get_for_model(ReservationUnit)
    log_entries = LogEntry.objects.filter(content_type_id=content_type.pk, object_id=reservation_unit.pk).order_by("pk")

    assert log_entries[0].action == LogEntry.Action.CREATE
    assert log_entries[1].changes == {"contact_information": ["foo", "bar"]}
    assert log_entries.count() == 2

    # Update the reservation unit to be archived
    data = {"pk": reservation_unit.pk}

    response = graphql(ARCHIVE_MUTATION, variables={"input": data})
    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()

    # ReservationUnit is marked as both archived and draft
    assert reservation_unit.is_archived is True
    assert reservation_unit.is_draft is True

    # Contact information is removed
    assert reservation_unit.contact_information == ""

    # Old log entries are removed
    log_entries = LogEntry.objects.filter(content_type_id=content_type.pk, object_id=reservation_unit.pk)
    assert log_entries.count() == 0
