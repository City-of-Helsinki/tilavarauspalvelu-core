from __future__ import annotations

import re

import pytest
from django.contrib.messages import get_messages
from django.urls import reverse

from tilavarauspalvelu.constants import NEVER_ANY_OPENING_HOURS_HASH
from tilavarauspalvelu.integrations.opening_hours.hauki_api_client import HaukiAPIClient
from tilavarauspalvelu.integrations.sentry import SentryLogger

from tests.factories import OriginHaukiResourceFactory, ReservationUnitFactory, UserFactory
from tests.helpers import ResponseMock, patch_method

pytestmark = [
    pytest.mark.django_db,
]

NEVER_ANY_OPENING_HOURS_NOTE = "OriginHaukiResources with this specific hash never have any opening hours."
HAUKI_ERROR_MESSAGE = "Could not update the reservable time spans from Hauki."


# ── Linked reservation units ──


def test_origin_hauki_resource_admin__changelist__linked_reservation_names_fall_back_to_other_languages(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    resource = OriginHaukiResourceFactory.create()
    ReservationUnitFactory.create(origin_hauki_resource=resource, name_fi="Sauna", name_en="Sauna", name_sv="Bastu")
    ReservationUnitFactory.create(origin_hauki_resource=resource, name_fi=None, name_en="Cottage", name_sv=None)
    ReservationUnitFactory.create(origin_hauki_resource=resource, name_fi=None, name_en=None, name_sv=None)
    url = reverse("admin:tilavarauspalvelu_originhaukiresource_changelist")

    response = api_client.get(url)

    assert response.status_code == 200

    linked_reservation_units = re.findall(
        r'<td class="field-linked_reservation_units">(.*?)</td>',
        response.content.decode(),
    )
    assert linked_reservation_units == ["Sauna, Cottage"]


# ── Opening hours hash help text ──


def test_origin_hauki_resource_admin__never_any_opening_hours_note__shown_once(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    resource = OriginHaukiResourceFactory.create(opening_hours_hash=NEVER_ANY_OPENING_HOURS_HASH)
    url = reverse("admin:tilavarauspalvelu_originhaukiresource_change", args=[resource.pk])

    api_client.get(url)
    response = api_client.get(url)

    assert response.status_code == 200
    assert response.content.decode().count(NEVER_ANY_OPENING_HOURS_NOTE) == 1


def test_origin_hauki_resource_admin__never_any_opening_hours_note__not_shown_for_other_hashes(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    never_resource = OriginHaukiResourceFactory.create(opening_hours_hash=NEVER_ANY_OPENING_HOURS_HASH)
    never_url = reverse("admin:tilavarauspalvelu_originhaukiresource_change", args=[never_resource.pk])
    api_client.get(never_url)

    resource = OriginHaukiResourceFactory.create(opening_hours_hash="abc123")
    url = reverse("admin:tilavarauspalvelu_originhaukiresource_change", args=[resource.pk])
    response = api_client.get(url)

    assert response.status_code == 200
    assert response.content.decode().count(NEVER_ANY_OPENING_HOURS_NOTE) == 0


# ── Hauki errors ──


@patch_method(HaukiAPIClient.request, return_value=ResponseMock(status_code=503, url="https://hauki.test/resource/"))
@patch_method(SentryLogger.log_exception)
def test_origin_hauki_resource_admin__update_all__hauki_error_shows_message(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    OriginHaukiResourceFactory.create(id=2)

    url = reverse("admin:tilavarauspalvelu_originhaukiresource_update_all_hauki_resources_reservable_time_spans")
    response = api_client.get(path=url)

    assert response.status_code == 302, response.content

    assert SentryLogger.log_exception.call_count == 1
    error = SentryLogger.log_exception.call_args.args[0]
    assert str(error) == "GET request to HAUKI (https://hauki.test/resource/) failed with status 503."
    assert SentryLogger.log_exception.call_args.kwargs == {"details": "Hauki resources: all"}

    errors = [str(message) for message in get_messages(response.wsgi_request) if message.level_tag == "error"]
    assert errors == [HAUKI_ERROR_MESSAGE]


@patch_method(HaukiAPIClient.request, return_value=ResponseMock(status_code=503, url="https://hauki.test/resource/"))
@patch_method(SentryLogger.log_exception)
def test_origin_hauki_resource_admin__update_single__hauki_error_shows_message(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    resource = OriginHaukiResourceFactory.create(id=2)

    url = reverse(
        "admin:tilavarauspalvelu_originhaukiresource_update_single_hauki_resource_reservable_times_pans",
        args=[resource.pk],
    )
    response = api_client.get(path=url)

    assert response.status_code == 302, response.content

    assert SentryLogger.log_exception.call_count == 1
    error = SentryLogger.log_exception.call_args.args[0]
    assert str(error) == "GET request to HAUKI (https://hauki.test/resource/) failed with status 503."
    assert SentryLogger.log_exception.call_args.kwargs == {"details": "Hauki resources: 2"}

    errors = [str(message) for message in get_messages(response.wsgi_request) if message.level_tag == "error"]
    assert errors == [HAUKI_ERROR_MESSAGE]


@patch_method(HaukiAPIClient.request)
@patch_method(SentryLogger.log_exception)
def test_origin_hauki_resource_admin__update_single__invalid_id_shows_message(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    url = reverse(
        "admin:tilavarauspalvelu_originhaukiresource_update_single_hauki_resource_reservable_times_pans",
        args=["invalid"],
    )
    response = api_client.get(path=url)

    assert response.status_code == 302, response.content

    assert HaukiAPIClient.request.call_count == 0

    assert SentryLogger.log_exception.call_count == 1
    assert SentryLogger.log_exception.call_args.kwargs == {"details": "Hauki resources: invalid"}

    errors = [str(message) for message in get_messages(response.wsgi_request) if message.level_tag == "error"]
    assert errors == [HAUKI_ERROR_MESSAGE]


@patch_method(HaukiAPIClient.request, return_value=ResponseMock(status_code=503, url="https://hauki.test/resource/"))
@patch_method(SentryLogger.log_exception)
def test_origin_hauki_resource_admin__update_action__hauki_error_shows_message(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    resource_1 = OriginHaukiResourceFactory.create(id=2)
    resource_2 = OriginHaukiResourceFactory.create(id=3)

    url = reverse("admin:tilavarauspalvelu_originhaukiresource_changelist")
    data = {
        "action": "update_reservable_time_spans_action",
        "_selected_action": [resource_1.pk, resource_2.pk],
    }
    response = api_client.post(path=url, data=data)

    assert response.status_code == 302, response.content

    assert SentryLogger.log_exception.call_count == 1
    error = SentryLogger.log_exception.call_args.args[0]
    assert str(error) == "GET request to HAUKI (https://hauki.test/resource/) failed with status 503."
    assert SentryLogger.log_exception.call_args.kwargs == {"details": "Hauki resources: [2, 3]"}

    errors = [str(message) for message in get_messages(response.wsgi_request) if message.level_tag == "error"]
    assert errors == [HAUKI_ERROR_MESSAGE]
