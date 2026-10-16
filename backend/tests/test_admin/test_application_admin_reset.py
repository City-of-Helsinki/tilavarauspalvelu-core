from __future__ import annotations

import pytest
from django.contrib.admin import helpers
from django.contrib.messages import get_messages
from django.urls import reverse

from tilavarauspalvelu.enums import ApplicationStatusChoice
from tilavarauspalvelu.models import AllocatedTimeSlot, Application, ReservationSeries

from tests.factories import AllocatedTimeSlotFactory, ApplicationFactory, ReservationSeriesFactory, UserFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Reset application allocations ──


def test_application_admin__reset_applications__in_allocation(api_client):
    admin = UserFactory.create_superuser()
    api_client.force_login(admin)

    application = ApplicationFactory.create_application_ready_for_allocation(pre_allocated=True)

    url = reverse("admin:tilavarauspalvelu_application_changelist")
    data = {
        "action": "reset_applications",
        helpers.ACTION_CHECKBOX_NAME: [application.pk],
        "confirmed": "true",
    }
    response = api_client.post(path=url, data=data)

    assert response.status_code == 302

    allocations = AllocatedTimeSlot.objects.filter(
        reservation_unit_option__application_section__application=application,
    )
    assert allocations.exists() is False


def test_application_admin__reset_applications__application_round_handled(api_client):
    admin = UserFactory.create_superuser()
    api_client.force_login(admin)

    application = ApplicationFactory.create_in_status_handled()
    option = application.application_sections.first().reservation_unit_options.first()
    allocation = AllocatedTimeSlotFactory.create(reservation_unit_option=option)
    series = ReservationSeriesFactory.create(allocated_time_slot=allocation)

    application = Application.objects.get(pk=application.pk)
    assert application.status == ApplicationStatusChoice.HANDLED

    url = reverse("admin:tilavarauspalvelu_application_changelist")
    data = {
        "action": "reset_applications",
        helpers.ACTION_CHECKBOX_NAME: [application.pk],
        "confirmed": "true",
    }
    response = api_client.post(path=url, data=data)

    assert response.status_code == 302

    messages = [message.message for message in get_messages(response.wsgi_request)]
    assert messages == [
        f"Application {application.pk} is in a handled application round. Reset the application round instead.",
    ]

    assert AllocatedTimeSlot.objects.filter(pk=allocation.pk).exists() is True

    series = ReservationSeries.objects.get(pk=series.pk)
    assert series.allocated_time_slot == allocation
