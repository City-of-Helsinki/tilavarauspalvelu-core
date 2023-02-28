import datetime
import uuid

import requests_mock
from assertpy import assert_that
from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from django.utils.timezone import get_default_timezone
from helusers.settings import api_token_auth_settings
from jose import jwt
from rest_framework.test import APITestCase

from api.tests.test_gdpr.gdpr_key import rsa_key
from applications.models import ApplicationStatus
from applications.tests.factories import (
    AddressFactory,
    ApplicationFactory,
    ApplicationStatusFactory,
)
from merchants.models import OrderStatus
from merchants.tests.factories import PaymentOrderFactory
from reservations.models import STATE_CHOICES as ReservationState
from reservations.tests.factories import ReservationFactory

User = get_user_model()


@override_settings(
    OIDC_API_TOKEN_AUTH={
        "AUDIENCE": "test_audience",
        "API_SCOPE_PREFIX": "testprefix",
        "ISSUER": "http://localhost/openid",
        "TOKEN_AUTH_REQUIRE_SCOPE_PREFIX": True,
    },
    GDPR_API_QUERY_SCOPE="testprefix.gdprquery",
    GDPR_API_DELETE_SCOPE="testprefix.gdprdelete",
)
class TilavarauspalveluGDPRAPIViewTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.user = User.objects.create(
            username="regjoe",
            first_name="joe",
            last_name="regular",
            email="joe.regular@foo.com",
        )
        ReservationFactory(user=cls.user)
        billing_address = AddressFactory()
        ApplicationFactory(user=cls.user, billing_address=billing_address)
        cls.url = reverse("gdpr_v1", kwargs={"uuid": cls.user.uuid})

    def setUp(self) -> None:
        """Revert the user data to original for every test."""
        self.user.username = "regjoe"
        self.user.first_name = "joe"
        self.user.last_name = "regular"
        self.user.email = "joe.regular@foo.com"
        self.user.date_of_birth = datetime.date(2000, 1, 1)
        self.user.save()

    def get_auth_header(self, user, scopes, req_mock):
        audience = api_token_auth_settings.AUDIENCE
        issuer = api_token_auth_settings.ISSUER
        auth_field = api_token_auth_settings.API_AUTHORIZATION_FIELD
        config_url = f"{issuer}/.well-known/openid-configuration"
        jwks_url = f"{issuer}/jwks"

        configuration = {
            "issuer": issuer,
            "jwks_uri": jwks_url,
        }

        keys = {"keys": [rsa_key.public_key_jwk]}

        now = datetime.datetime.now(tz=get_default_timezone())
        expire = now + datetime.timedelta(days=14)

        jwt_data = {
            "iss": issuer,
            "aud": audience,
            "sub": str(user.uuid),
            "iat": int(now.timestamp()),
            "exp": int(expire.timestamp()),
            auth_field: scopes,
        }
        encoded_jwt = jwt.encode(
            jwt_data, key=rsa_key.private_key_pem, algorithm=rsa_key.jose_algorithm
        )

        req_mock.get(config_url, json=configuration)
        req_mock.get(jwks_url, json=keys)

        auth_header = f"{api_token_auth_settings.AUTH_SCHEME} {encoded_jwt}"

        return auth_header

    @requests_mock.Mocker()
    def test_get_user_data_should_return_data(self, req_mock):
        auth_header = self.get_auth_header(
            self.user, [settings.GDPR_API_QUERY_SCOPE], req_mock
        )

        self.client.credentials(HTTP_AUTHORIZATION=auth_header)
        response = self.client.get(self.url)
        assert_that(response.status_code).is_equal_to(200)
        assert_that(response.data["children"][0]["value"]).is_not_empty()

    @requests_mock.Mocker()
    def test_get_user_data_should_not_returns_not_found(self, req_mock):
        auth_header = self.get_auth_header(
            self.user, [settings.GDPR_API_QUERY_SCOPE], req_mock
        )

        url = reverse("gdpr_v1", kwargs={"uuid": uuid.uuid4()})
        self.client.credentials(HTTP_AUTHORIZATION=auth_header)
        response = self.client.get(url)
        assert_that(response.status_code).is_equal_to(404)

    @requests_mock.Mocker()
    def test_get_user_returns_forbidden_when_wrong_scope(self, req_mock):
        auth_header = self.get_auth_header(self.user, ["testprefix.invalid"], req_mock)
        self.client.credentials(HTTP_AUTHORIZATION=auth_header)
        response = self.client.get(self.url)
        assert_that(response.status_code).is_equal_to(403)

    @requests_mock.Mocker()
    def test_delete_user_should_anonymize_data(self, req_mock):
        auth_header = self.get_auth_header(
            self.user, [settings.GDPR_API_DELETE_SCOPE], req_mock
        )
        old_uuid = self.user.uuid
        self.client.credentials(HTTP_AUTHORIZATION=auth_header)
        response = self.client.delete(self.url)

        assert_that(response.status_code).is_equal_to(204)

        self.user.refresh_from_db()
        assert_that(self.user.uuid).is_not_equal_to(old_uuid)
        assert_that(self.user.username).contains("anonymized")
        assert_that(self.user.pk).is_not_none()

    @requests_mock.Mocker()
    def test_delete_user_does_not_anonymize_data_when_open_payments(self, req_mock):
        reservation = ReservationFactory(user=self.user)
        PaymentOrderFactory(
            reservation=reservation, status=OrderStatus.DRAFT, remote_id=uuid.uuid4()
        )

        auth_header = self.get_auth_header(
            self.user, [settings.GDPR_API_DELETE_SCOPE], req_mock
        )
        old_uuid = self.user.uuid
        self.client.credentials(HTTP_AUTHORIZATION=auth_header)
        response = self.client.delete(self.url)

        assert_that(response.status_code).is_equal_to(403)

        self.user.refresh_from_db()
        assert_that(self.user.uuid).is_equal_to(old_uuid)
        assert_that(self.user.username).does_not_contain("anonymized")
        assert_that(self.user.pk).is_not_none()

    @requests_mock.Mocker()
    def test_delete_user_does_not_anonymize_data_when_open_reservations(self, req_mock):
        begin = timezone.now()
        end = begin + datetime.timedelta(hours=2)
        ReservationFactory(
            user=self.user, begin=begin, end=end, state=ReservationState.CREATED
        )

        auth_header = self.get_auth_header(
            self.user, [settings.GDPR_API_DELETE_SCOPE], req_mock
        )
        old_uuid = self.user.uuid
        self.client.credentials(HTTP_AUTHORIZATION=auth_header)
        response = self.client.delete(self.url)

        assert_that(response.status_code).is_equal_to(403)

        self.user.refresh_from_db()
        assert_that(self.user.uuid).is_equal_to(old_uuid)
        assert_that(self.user.username).does_not_contain("anonymized")
        assert_that(self.user.pk).is_not_none()

    @requests_mock.Mocker()
    def test_delete_user_does_not_anonymize_data_when_open_applications(self, req_mock):
        app = ApplicationFactory(user=self.user)
        ApplicationStatusFactory(application=app, status=ApplicationStatus.ALLOCATED)

        auth_header = self.get_auth_header(
            self.user, [settings.GDPR_API_DELETE_SCOPE], req_mock
        )
        old_uuid = self.user.uuid
        self.client.credentials(HTTP_AUTHORIZATION=auth_header)
        response = self.client.delete(self.url)

        assert_that(response.status_code).is_equal_to(403)

        self.user.refresh_from_db()
        assert_that(self.user.uuid).is_equal_to(old_uuid)
        assert_that(self.user.username).does_not_contain("anonymized")
        assert_that(self.user.pk).is_not_none()

    @requests_mock.Mocker()
    def test_other_user_cant_delete_else_data(self, req_mock):
        other_user = User.objects.create(
            username="othuser",
            first_name="oth",
            last_name="er",
            email="oth.er@foo.com",
        )
        auth_header = self.get_auth_header(
            other_user, [settings.GDPR_API_DELETE_SCOPE], req_mock
        )
        self.client.credentials(HTTP_AUTHORIZATION=auth_header)
        response = self.client.delete(self.url)

        assert_that(response.status_code).is_equal_to(403)

    @requests_mock.Mocker()
    def test_delete_user_should_not_anonymize_data_when_no_auth(self, req_mock):
        other_user = User.objects.create(
            username="othuser",
            first_name="oth",
            last_name="er",
            email="oth.er@foo.com",
        )
        url = reverse("gdpr_v1", kwargs={"uuid": other_user.uuid})
        auth_header = self.get_auth_header(
            self.user, [settings.GDPR_API_DELETE_SCOPE], req_mock
        )
        self.client.credentials(HTTP_AUTHORIZATION=auth_header)
        response = self.client.delete(url)

        assert_that(response.status_code).is_equal_to(403)

    @requests_mock.Mocker()
    def test_delete_user_returns_forbidden_when_using_wrong_scope(self, req_mock):
        auth_header = self.get_auth_header(
            self.user, ["testprefix.wrong_scope"], req_mock
        )
        self.client.credentials(HTTP_AUTHORIZATION=auth_header)
        response = self.client.delete(self.url)
        assert_that(response.status_code, 403)
        self.user.refresh_from_db()
        assert_that(self.user.username).does_not_contain("anonymized")

    @requests_mock.Mocker()
    def test_delete_profile_should_keep_data_when_dry_run(self, req_mock):
        auth_header = self.get_auth_header(
            self.user, [settings.GDPR_API_DELETE_SCOPE], req_mock
        )
        self.client.credentials(HTTP_AUTHORIZATION=auth_header)
        uuid = self.user.uuid
        # make sure we do not deleted the profile when client specify different types of true values
        # quite nice set of true values copied from parking permits gdpr tests.
        true_values = ["true", "True", "TRUE", "1", 1, True]
        response = self.client.delete(self.url, data={"dry_run": true_values})
        assert_that(response.status_code).is_equal_to(204)
        self.user.refresh_from_db()
        assert_that(self.user.email).is_equal_to("joe.regular@foo.com")
        assert_that(self.user.uuid).is_equal_to(uuid)
