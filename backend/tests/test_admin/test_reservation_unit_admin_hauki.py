from __future__ import annotations

import pytest
from django.contrib.messages import get_messages
from django.urls import reverse

from tilavarauspalvelu.enums import AccessType, ReservationKind, TermsOfUseTypeChoices
from tilavarauspalvelu.integrations.opening_hours.hauki_api_client import HaukiAPIClient
from tilavarauspalvelu.integrations.sentry import SentryLogger
from utils.date_utils import local_date

from tests.factories import OriginHaukiResourceFactory, ReservationUnitFactory, TermsOfUseFactory, UserFactory
from tests.helpers import ResponseMock, patch_method
from tests.test_admin.helpers import management_form_data, required_reservation_unit_form_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@patch_method(HaukiAPIClient.request, return_value=ResponseMock(status_code=503, url="https://hauki.test/resource/"))
@patch_method(SentryLogger.log_exception)
def test_reservation_unit_admin__hauki_refetch_error_does_not_fail_save(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    reservation_unit = ReservationUnitFactory.create(
        name="old name",
        reservation_kind=ReservationKind.SEASON,
        origin_hauki_resource=OriginHaukiResourceFactory.create(id=2),
        payment_terms=TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.PAYMENT),
        cancellation_terms=TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.CANCELLATION),
        service_specific_terms=TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.SERVICE),
        pricing_terms=TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.PRICING),
    )

    url = reverse("admin:tilavarauspalvelu_reservationunit_change", args=[reservation_unit.pk])
    data = {
        **required_reservation_unit_form_data(reservation_unit),
        **management_form_data("access_types", total_forms=1),
        "name": "new name",
        "name_fi": "new name",
        "origin_hauki_resource": reservation_unit.origin_hauki_resource.pk,
        "access_types-0-access_type": AccessType.UNRESTRICTED.value,
        "access_types-0-begin_date": local_date().isoformat(),
    }

    response = api_client.post(path=url, data=data)

    assert response.status_code == 302, response.content
    assert response.url == reverse("admin:tilavarauspalvelu_reservationunit_changelist")

    reservation_unit.refresh_from_db()
    assert reservation_unit.name == "new name"

    assert SentryLogger.log_exception.call_count == 1
    error = SentryLogger.log_exception.call_args.args[0]
    assert str(error) == "GET request to HAUKI (https://hauki.test/resource/) failed with status 503."
    assert SentryLogger.log_exception.call_args.kwargs == {"details": f"Reservation unit: {reservation_unit.pk}"}

    warnings = [str(message) for message in get_messages(response.wsgi_request) if message.level_tag == "warning"]
    assert warnings == [
        (
            "The reservation unit was saved, but its opening hours could not be updated from Hauki. "
            "The error was reported to Sentry."
        ),
    ]
