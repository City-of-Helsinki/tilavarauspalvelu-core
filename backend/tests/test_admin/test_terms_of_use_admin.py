from __future__ import annotations

import re

import pytest
from django.urls import reverse

from tests.factories import TermsOfUseFactory, UserFactory

pytestmark = [
    pytest.mark.django_db,
]


# ── Change page ──


def test_terms_of_use_admin__change_page__terms_without_name(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    terms_of_use = TermsOfUseFactory.create(name=None, name_fi=None, name_en=None, name_sv=None)
    url = reverse("admin:tilavarauspalvelu_termsofuse_change", args=[terms_of_use.pk])

    response = api_client.get(url)

    assert response.status_code == 200

    breadcrumbs = re.findall(r'<div class="breadcrumbs">(.*?)</div>', response.content.decode(), re.DOTALL)
    assert len(breadcrumbs) == 1

    breadcrumb_items = [item.strip() for item in breadcrumbs[0].split("&rsaquo;")]
    assert breadcrumb_items[-1] == ""
