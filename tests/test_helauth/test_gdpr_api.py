import datetime
import uuid

import pytest
from dateutil.relativedelta import relativedelta
from django.urls import reverse
from django.utils import timezone

from applications.models import ApplicationEvent
from merchants.models import OrderStatus
from reservations.choices import ReservationStateChoice
from tests.factories import ApplicationFactory, PaymentOrderFactory, ReservationFactory, UserFactory
from tests.test_helauth.helpers import get_gdpr_auth_header, patch_oidc_config

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def test_query_user_data__simple(api_client, settings):
    user = UserFactory.create()

    settings.GDPR_API_QUERY_SCOPE = "testprefix.gdprquery"
    auth_header = get_gdpr_auth_header(user, [settings.GDPR_API_QUERY_SCOPE])
    api_client.credentials(HTTP_AUTHORIZATION=auth_header)

    url = reverse("gdpr_v1", kwargs={"uuid": user.uuid})
    with patch_oidc_config():
        response = api_client.get(url)

    assert response.status_code == 200, response.data
    assert response.data == {
        "key": "PROFILEUSER",
        "children": [
            {
                "key": "USER",
                "value": user.get_full_name(),
            },
            {
                "key": "EMAIL",
                "value": user.email,
            },
            {
                "key": "DATE_OF_BIRTH",
                "value": user.date_of_birth,
            },
            {
                "key": "USER_RESERVATIONS",
                "value": [],
            },
            {
                "key": "USER_APPLICATIONS",
                "value": [],
            },
        ],
    }


def test_query_user_data__full(api_client, settings):
    user = UserFactory.create()
    application = ApplicationFactory.create_in_status_in_allocation(user=user)
    event: ApplicationEvent = application.application_events.first()
    reservation = ReservationFactory.create(user=user)

    settings.GDPR_API_QUERY_SCOPE = "testprefix.gdprquery"
    auth_header = get_gdpr_auth_header(user, [settings.GDPR_API_QUERY_SCOPE])
    api_client.credentials(HTTP_AUTHORIZATION=auth_header)

    url = reverse("gdpr_v1", kwargs={"uuid": user.uuid})
    with patch_oidc_config():
        response = api_client.get(url)

    assert response.status_code == 200, response.data
    assert response.data == {
        "key": "PROFILEUSER",
        "children": [
            {
                "key": "USER",
                "value": user.get_full_name(),
            },
            {
                "key": "EMAIL",
                "value": user.email,
            },
            {
                "key": "DATE_OF_BIRTH",
                "value": user.date_of_birth,
            },
            {
                "key": "USER_RESERVATIONS",
                "value": [
                    [
                        reservation.name,
                        reservation.description,
                        reservation.begin,
                        reservation.end,
                        reservation.reservee_first_name,
                        reservation.reservee_last_name,
                        reservation.reservee_email,
                        reservation.reservee_phone,
                        reservation.reservee_address_zip,
                        reservation.reservee_address_city,
                        reservation.reservee_address_street,
                        reservation.billing_first_name,
                        reservation.billing_last_name,
                        reservation.billing_email,
                        reservation.billing_phone,
                        reservation.billing_address_zip,
                        reservation.billing_address_city,
                        reservation.billing_address_street,
                        reservation.reservee_id,
                        reservation.reservee_organisation_name,
                        reservation.free_of_charge_reason,
                        reservation.cancel_details,
                    ]
                ],
            },
            {
                "key": "USER_APPLICATIONS",
                "value": [
                    [
                        application.additional_information,
                        {
                            "events": [
                                event.name,
                                event.name_fi,
                                event.name_en,
                                event.name_sv,
                            ],
                        },
                        {
                            "contact_person": [
                                application.contact_person.first_name,
                                application.contact_person.last_name,
                                application.contact_person.email,
                                application.contact_person.phone_number,
                            ],
                        },
                        {
                            "organisation": [
                                application.organisation.name,
                                application.organisation.identifier,
                                application.organisation.email,
                                application.organisation.core_business,
                                application.organisation.core_business_fi,
                                application.organisation.core_business_en,
                                application.organisation.core_business_sv,
                            ]
                        },
                        {
                            "organisation_address": [
                                application.organisation.address.post_code,
                                application.organisation.address.street_address,
                                application.organisation.address.street_address_fi,
                                application.organisation.address.street_address_en,
                                application.organisation.address.street_address_sv,
                                application.organisation.address.city,
                                application.organisation.address.city_fi,
                                application.organisation.address.city_en,
                                application.organisation.address.city_sv,
                            ]
                        },
                        {
                            "billing_address": [
                                application.billing_address.post_code,
                                application.billing_address.street_address,
                                application.billing_address.street_address_fi,
                                application.billing_address.street_address_en,
                                application.billing_address.street_address_sv,
                                application.billing_address.city,
                                application.billing_address.city_fi,
                                application.billing_address.city_en,
                                application.billing_address.city_sv,
                            ],
                        },
                    ]
                ],
            },
        ],
    }


def test_query_user_data__user_not_found(api_client, settings):
    user = UserFactory.create()

    settings.GDPR_API_QUERY_SCOPE = "testprefix.gdprquery"
    auth_header = get_gdpr_auth_header(user, [settings.GDPR_API_QUERY_SCOPE])
    api_client.credentials(HTTP_AUTHORIZATION=auth_header)

    url = reverse("gdpr_v1", kwargs={"uuid": uuid.uuid4()})
    with patch_oidc_config():
        response = api_client.get(url)

    assert response.status_code == 404, response.data


def test_query_user_data__wrong_scope(api_client, settings):
    user = UserFactory.create()

    settings.GDPR_API_QUERY_SCOPE = "testprefix.gdprquery"
    auth_header = get_gdpr_auth_header(user, ["testprefix.invalid"])
    api_client.credentials(HTTP_AUTHORIZATION=auth_header)

    url = reverse("gdpr_v1", kwargs={"uuid": uuid.uuid4()})
    with patch_oidc_config():
        response = api_client.get(url)

    assert response.status_code == 403, response.data


def test_delete_user_data__should_anonymize(api_client, settings):
    user = UserFactory.create(username="foo")

    settings.GDPR_API_DELETE_SCOPE = "testprefix.gdprdelete"
    auth_header = get_gdpr_auth_header(user, [settings.GDPR_API_DELETE_SCOPE])
    api_client.credentials(HTTP_AUTHORIZATION=auth_header)

    url = reverse("gdpr_v1", kwargs={"uuid": user.uuid})
    with patch_oidc_config():
        response = api_client.delete(url)

    assert response.status_code == 204, response.data

    user.refresh_from_db()
    assert user.username == f"anonymized-{user.uuid}"


def test_delete_user_data__dont_anonymize_if_open_payments(api_client, settings):
    user = UserFactory.create(username="foo")
    reservation = ReservationFactory.create(user=user)
    PaymentOrderFactory.create(reservation=reservation, status=OrderStatus.DRAFT, remote_id=uuid.uuid4())

    settings.GDPR_API_DELETE_SCOPE = "testprefix.gdprdelete"
    auth_header = get_gdpr_auth_header(user, [settings.GDPR_API_DELETE_SCOPE])
    api_client.credentials(HTTP_AUTHORIZATION=auth_header)

    url = reverse("gdpr_v1", kwargs={"uuid": user.uuid})
    with patch_oidc_config():
        response = api_client.delete(url)

    assert response.status_code == 403, response.data
    user.refresh_from_db()
    assert user.username == "foo"


def test_delete_user_data__dont_anonymize_if_open_reservations(api_client, settings):
    user = UserFactory.create(username="foo")
    begin = timezone.now()
    end = begin + datetime.timedelta(hours=2)
    ReservationFactory.create(user=user, begin=begin, end=end, state=ReservationStateChoice.CREATED)

    settings.GDPR_API_DELETE_SCOPE = "testprefix.gdprdelete"
    auth_header = get_gdpr_auth_header(user, [settings.GDPR_API_DELETE_SCOPE])
    api_client.credentials(HTTP_AUTHORIZATION=auth_header)

    url = reverse("gdpr_v1", kwargs={"uuid": user.uuid})
    with patch_oidc_config():
        response = api_client.delete(url)

    assert response.status_code == 403, response.data
    user.refresh_from_db()
    assert user.username == "foo"


def test_delete_user_data__dont_anonymize_if_reservation_one_month_ago(api_client, settings):
    user = UserFactory.create(username="foo")
    begin = timezone.now() - relativedelta(months=1)
    end = begin + datetime.timedelta(hours=2)
    ReservationFactory.create(user=user, begin=begin, end=end, state=ReservationStateChoice.CONFIRMED)

    settings.GDPR_API_DELETE_SCOPE = "testprefix.gdprdelete"
    auth_header = get_gdpr_auth_header(user, [settings.GDPR_API_DELETE_SCOPE])
    api_client.credentials(HTTP_AUTHORIZATION=auth_header)

    url = reverse("gdpr_v1", kwargs={"uuid": user.uuid})
    with patch_oidc_config():
        response = api_client.delete(url)

    assert response.status_code == 403, response.data
    user.refresh_from_db()
    assert user.username == "foo"


def test_delete_user_data__dont_anonymize_if_open_applications(api_client, settings):
    user = UserFactory.create(username="foo")
    ApplicationFactory.create_in_status_in_allocation(user=user)

    settings.GDPR_API_DELETE_SCOPE = "testprefix.gdprdelete"
    auth_header = get_gdpr_auth_header(user, [settings.GDPR_API_DELETE_SCOPE])
    api_client.credentials(HTTP_AUTHORIZATION=auth_header)

    url = reverse("gdpr_v1", kwargs={"uuid": user.uuid})
    with patch_oidc_config():
        response = api_client.delete(url)

    assert response.status_code == 403, response.data
    user.refresh_from_db()
    assert user.username == "foo"


def test_delete_user_data__cannot_anonymize_other_users_data(api_client, settings):
    user = UserFactory.create(username="foo")
    other_user = UserFactory.create(username="bar")

    settings.GDPR_API_DELETE_SCOPE = "testprefix.gdprdelete"
    auth_header = get_gdpr_auth_header(user, [settings.GDPR_API_DELETE_SCOPE])
    api_client.credentials(HTTP_AUTHORIZATION=auth_header)

    url = reverse("gdpr_v1", kwargs={"uuid": other_user.uuid})
    with patch_oidc_config():
        response = api_client.delete(url)

    assert response.status_code == 403, response.data
    other_user.refresh_from_db()
    assert other_user.username == "bar"


def test_delete_user_data__not_authenticated(api_client, settings):
    user = UserFactory.create(username="foo")

    settings.GDPR_API_DELETE_SCOPE = "testprefix.gdprdelete"

    url = reverse("gdpr_v1", kwargs={"uuid": user.uuid})
    with patch_oidc_config():
        response = api_client.delete(url)

    assert response.status_code == 401, response.data
    user.refresh_from_db()
    assert user.username == "foo"


def test_delete_user_data__wrong_scope(api_client, settings):
    user = UserFactory.create(username="foo")

    settings.GDPR_API_DELETE_SCOPE = "testprefix.gdprdelete"
    auth_header = get_gdpr_auth_header(user, ["testprefix.wrong_scope"])
    api_client.credentials(HTTP_AUTHORIZATION=auth_header)

    url = reverse("gdpr_v1", kwargs={"uuid": user.uuid})
    with patch_oidc_config():
        response = api_client.delete(url)

    assert response.status_code == 403, response.data
    user.refresh_from_db()
    assert user.username == "foo"


@pytest.mark.parametrize("dry_run", ["true", "True", "TRUE", "1", 1, True])
def test_delete_user_data__dont_anonymize_if_dryrun(api_client, settings, dry_run):
    user = UserFactory.create(username="foo")

    settings.GDPR_API_DELETE_SCOPE = "testprefix.gdprdelete"
    auth_header = get_gdpr_auth_header(user, [settings.GDPR_API_DELETE_SCOPE])
    api_client.credentials(HTTP_AUTHORIZATION=auth_header)

    url = reverse("gdpr_v1", kwargs={"uuid": user.uuid})
    with patch_oidc_config():
        response = api_client.delete(url, data={"dry_run": dry_run})

    assert response.status_code == 204, response.data
    user.refresh_from_db()
    assert user.username == "foo"
