from __future__ import annotations

import datetime

import pytest
from django.urls import reverse
from social_django.models import UserSocialAuth

from tilavarauspalvelu.models import PersonalInfoViewLog

from tests.factories import UserFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Change page ──


def test_user_admin__change_page__does_not_show_tokens(api_client):
    admin = UserFactory.create_superuser()
    api_client.force_login(admin)

    user = UserFactory.create_profile_user()
    access_token = user.access_token
    refresh_token = user.refresh_token

    url = reverse("admin:tilavarauspalvelu_user_change", args=[user.pk])
    response = api_client.get(path=url)

    assert response.status_code == 200
    content = response.content.decode()
    assert access_token not in content
    assert refresh_token not in content


def test_user_admin__social_auth_change_page__not_available(api_client):
    admin = UserFactory.create_superuser()
    api_client.force_login(admin)

    user = UserFactory.create_profile_user()
    social_auth = UserSocialAuth.objects.get(user=user)

    response = api_client.get(path=f"/admin/social_django/usersocialauth/{social_auth.pk}/change/")

    assert response.status_code == 404


def test_user_admin__change_page__logs_date_of_birth_view(api_client):
    admin = UserFactory.create_superuser()
    api_client.force_login(admin)

    user = UserFactory.create(date_of_birth=datetime.date(2000, 1, 1))

    url = reverse("admin:tilavarauspalvelu_user_change", args=[user.pk])
    response = api_client.get(path=url)

    assert response.status_code == 200

    view_logs = list(PersonalInfoViewLog.objects.all())
    assert len(view_logs) == 1
    assert view_logs[0].user == user
    assert view_logs[0].viewer_user == admin
    assert view_logs[0].field == "User.date_of_birth"


def test_user_admin__change_page__does_not_log_view_without_permission(api_client):
    staff_user = UserFactory.create(is_staff=True)
    api_client.force_login(staff_user)

    user = UserFactory.create(date_of_birth=datetime.date(2000, 1, 1))

    url = reverse("admin:tilavarauspalvelu_user_change", args=[user.pk])
    response = api_client.get(path=url)

    assert response.status_code == 403
    assert PersonalInfoViewLog.objects.count() == 0
