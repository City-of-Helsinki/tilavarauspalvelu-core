from __future__ import annotations

import json
import pathlib
from typing import TYPE_CHECKING, Any

import pytest
from django.contrib import auth
from django.core import serializers
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import Client
from social_django.models import UserSocialAuth

from tests.factories.helsinki_profile import MyProfileDataFactory

from .helpers import KeycloakUser, browse

if TYPE_CHECKING:
    from collections.abc import Generator

    from pytest_django.fixtures import SettingsWrapper
    from responses import RequestsMock

    from .helpers import FakeKeycloakServer

pytestmark = [
    pytest.mark.django_db(transaction=True),
]


# ── Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────


# Users and associations that real logins created with social-auth-app-django 5.7.0, social-auth-core 4.8.5
# and django-helusers 1.1.0, against the same fake Keycloak. These are the versions before identifier keys.
LOGINS_FROM_SOCIAL_AUTH_5_7_0 = json.loads(
    (pathlib.Path(__file__).parent / "data" / "social_auth_app_django_5_7_0_logins.json").read_text()
)

SOCIAL_AUTH_5_7_0_MIGRATION = ("social_django", "0017_usersocialauth_user_social_auth_uid_required")


@pytest.fixture
def database_from_social_auth_5_7_0(request: pytest.FixtureRequest) -> Generator[None]:
    """Migrate social auth back to its 5.7.0 schema and save the users and associations that 5.7.0 created."""
    if request.config.getoption("nomigrations"):
        pytest.skip("Needs migrations.")

    executor = MigrationExecutor(connection)
    latest_migrations = executor.loader.graph.leaf_nodes()
    executor.migrate([SOCIAL_AUTH_5_7_0_MIGRATION])

    try:
        for user in serializers.deserialize("json", json.dumps(LOGINS_FROM_SOCIAL_AUTH_5_7_0["users"])):
            user.save()

        old_apps = executor.loader.project_state([SOCIAL_AUTH_5_7_0_MIGRATION]).apps
        old_user_social_auth = old_apps.get_model("social_django", "UserSocialAuth")
        for row in LOGINS_FROM_SOCIAL_AUTH_5_7_0["social_auths"]:
            old_user_social_auth.objects.create(
                pk=row["pk"],
                user_id=row["fields"]["user"],
                provider=row["fields"]["provider"],
                uid=row["fields"]["uid"],
                extra_data=row["fields"]["extra_data"],
            )

        yield

    finally:
        executor = MigrationExecutor(connection)
        executor.migrate(latest_migrations)


def migrate_to_latest() -> None:
    executor = MigrationExecutor(connection)
    executor.migrate(executor.loader.graph.leaf_nodes())


def keycloak_user_for(user_row: dict[str, Any], *, amr: list[str]) -> KeycloakUser:
    return KeycloakUser(
        sub=user_row["fields"]["uuid"],
        email=user_row["fields"]["email"],
        given_name=user_row["fields"]["first_name"],
        family_name=user_row["fields"]["last_name"],
        amr=amr,
        loa="substantial" if amr == ["suomi_fi"] else "low",
    )


# ── Identifier key backfill ─────────────────────────────────────────────────────────────────────────────────────────


@pytest.mark.usefixtures("database_from_social_auth_5_7_0")
def test_social_auth_migration__backfills_sub_as_identifier_key_for_tunnistamo_associations():
    migrate_to_latest()

    id_keys = dict(UserSocialAuth.objects.values_list("pk", "id_key"))
    assert id_keys == {row["pk"]: "sub" for row in LOGINS_FROM_SOCIAL_AUTH_5_7_0["social_auths"]}


# ── Login after migration ───────────────────────────────────────────────────────────────────────────────────────────


@pytest.mark.usefixtures("database_from_social_auth_5_7_0")
def test_social_auth_migration__customer_logs_in_to_the_same_user_and_association(
    keycloak_server: FakeKeycloakServer,
    requests_mock: RequestsMock,
    settings: SettingsWrapper,
):
    migrate_to_latest()
    settings.SOCIAL_AUTH_TUNNISTAMO_ALLOWED_REDIRECT_HOSTS = ["fake.test.varaamo.com"]
    requests_mock.post(
        settings.OPEN_CITY_PROFILE_GRAPHQL_API,
        json={"data": {"myProfile": MyProfileDataFactory.create_basic(id="fake-profile-id")}},
    )

    customer_row, _staff_member_row = LOGINS_FROM_SOCIAL_AUTH_5_7_0["users"]
    customer_social_auth_row, _staff_member_social_auth_row = LOGINS_FROM_SOCIAL_AUTH_5_7_0["social_auths"]
    client = Client(enforce_csrf_checks=True)

    response = browse(client, method="GET", url="/helauth/login/?ui=customer&lang=fi")
    customer = keycloak_user_for(customer_row, amr=["suomi_fi"])
    callback_url = keycloak_server.log_in(authorization_url=response["Location"], user=customer)
    browse(client, method="GET", url=callback_url)

    logged_in_user = auth.get_user(client)
    assert logged_in_user.pk == customer_row["pk"]

    social_auths = list(UserSocialAuth.objects.filter(user_id=customer_row["pk"]).values_list("pk", "uid", "id_key"))
    assert social_auths == [(customer_social_auth_row["pk"], customer_row["fields"]["uuid"], "sub")]


@pytest.mark.usefixtures("database_from_social_auth_5_7_0")
def test_social_auth_migration__staff_member_logs_in_to_the_same_user_and_association(
    keycloak_server: FakeKeycloakServer,
):
    migrate_to_latest()

    _customer_row, staff_member_row = LOGINS_FROM_SOCIAL_AUTH_5_7_0["users"]
    _customer_social_auth_row, staff_member_social_auth_row = LOGINS_FROM_SOCIAL_AUTH_5_7_0["social_auths"]
    client = Client(enforce_csrf_checks=True)

    response = browse(client, method="GET", url="/helauth/login/?next=/admin/")
    staff_member = keycloak_user_for(staff_member_row, amr=["helsinkiad"])
    callback_url = keycloak_server.log_in(authorization_url=response["Location"], user=staff_member)
    response = browse(client, method="GET", url=callback_url)

    assert response.status_code == 200
    assert response.request["PATH_INFO"] == "/admin/"

    logged_in_user = auth.get_user(client)
    assert logged_in_user.pk == staff_member_row["pk"]

    social_auths = list(
        UserSocialAuth.objects.filter(user_id=staff_member_row["pk"]).values_list("pk", "uid", "id_key")
    )
    assert social_auths == [(staff_member_social_auth_row["pk"], staff_member_row["fields"]["uuid"], "sub")]
