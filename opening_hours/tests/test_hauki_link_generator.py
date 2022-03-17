import hmac
from urllib import parse

import pytest
from assertpy import assert_that
from django.conf import settings
from freezegun import freeze_time

from opening_hours.hauki_link_generator import generate_hauki_link

valid_signature = "3a8841996f4635970cc5a1d5dda58aaad4e2dd3cbb2857720939362792905b31"
VALID_SIGNATURE = "1e52776ccc95118a29835938593c277bbddca384317820eb5e59835f36307ba6"
ORGANIZATION = "parent-organisation"


@freeze_time("2021-01-01 12:00:00", tz_offset=2)
def test_hauki_link_generation_signature(enable_hauki_admin_ui):
    link = generate_hauki_link(
        uuid="123", username="foo@bar.com", organization_id=ORGANIZATION
    )
    params = dict(parse.parse_qsl(link))
    assert_that(hmac.compare_digest(VALID_SIGNATURE, params["hsa_signature"])).is_true()


@freeze_time("2021-01-01 14:00:00", tz_offset=2)
def test_comparing_signature_with_different_date(enable_hauki_admin_ui):
    link = generate_hauki_link(
        uuid="123", username="foo@bar.com", organization_id=ORGANIZATION
    )
    params = dict(parse.parse_qsl(link))
    assert_that(
        hmac.compare_digest(VALID_SIGNATURE, params["hsa_signature"])
    ).is_false()


@freeze_time("2021-01-01 12:00:00", tz_offset=2)
def test_hauki_link_params(enable_hauki_admin_ui):
    link = generate_hauki_link(
        uuid="123", username="foo@bar.com", organization_id=ORGANIZATION
    )
    params = dict(parse.parse_qsl(link))
    assert_that(params["hsa_organization"]).is_equal_to(settings.HAUKI_ORGANISATION_ID)
    assert_that(params["hsa_resource"]).is_equal_to(f"{settings.HAUKI_ORIGIN_ID}:123")
    assert_that(params["hsa_username"]).is_equal_to("foo@bar.com")
    assert_that(params["hsa_username"]).is_equal_to("foo@bar.com")


@freeze_time("2021-01-01 12:00:00", tz_offset=2)
@pytest.mark.parametrize(
    "setting",
    ["HAUKI_ADMIN_UI_URL", "HAUKI_SECRET", "HAUKI_ORIGIN_ID"],
)
def test_hauki_link_with_missing_settings(setting, enable_hauki_admin_ui):
    setattr(settings, setting, None)
    link = generate_hauki_link(
        uuid="123", username="foo@bar.com", organization_id=ORGANIZATION
    )

    assert_that(link).is_none()


@freeze_time("2021-01-01 12:00:00", tz_offset=2)
def test_hauki_link_generation_when_organization_none(enable_hauki_admin_ui):
    link = generate_hauki_link(uuid="123", username="foo@bar.com", organization_id=None)
    assert_that(link).is_none()
