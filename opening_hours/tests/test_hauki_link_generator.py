import hmac
from urllib import parse

import pytest
from django.conf import settings
from freezegun import freeze_time

from opening_hours.hauki_link_generator import generate_hauki_link

VALID_SIGNATURE = "1e52776ccc95118a29835938593c277bbddca384317820eb5e59835f36307ba6"
ORGANIZATION = "parent-organisation"


@pytest.mark.usefixtures("_use_hauki_env_variables")
@freeze_time("2021-01-01 12:00:00", tz_offset=2)
def test__hauki__link_generation__signature():
    link = generate_hauki_link(uuid="123", username="foo@bar.com", organization_id=ORGANIZATION)
    params = dict(parse.parse_qsl(link))

    assert hmac.compare_digest(VALID_SIGNATURE, params["hsa_signature"]) is True


@pytest.mark.usefixtures("_use_hauki_env_variables")
@freeze_time("2021-01-01 14:00:00", tz_offset=2)
def test__hauki__link_generation__signature_with_incorrect_datetime():
    link = generate_hauki_link(uuid="123", username="foo@bar.com", organization_id=ORGANIZATION)
    params = dict(parse.parse_qsl(link))

    assert hmac.compare_digest(VALID_SIGNATURE, params["hsa_signature"]) is False


@pytest.mark.usefixtures("_use_hauki_env_variables")
@freeze_time("2021-01-01 12:00:00", tz_offset=2)
def test__hauki__link_generation__params():
    link = generate_hauki_link(uuid="123", username="foo@bar.com", organization_id=ORGANIZATION)
    params = dict(parse.parse_qsl(link))

    assert params["hsa_organization"] == settings.HAUKI_ORGANISATION_ID
    assert params["hsa_resource"] == f"{settings.HAUKI_ORIGIN_ID}:123"
    assert params["hsa_username"] == "foo@bar.com"


@pytest.mark.usefixtures("_use_hauki_env_variables")
@pytest.mark.parametrize(
    "setting",
    ["HAUKI_ADMIN_UI_URL", "HAUKI_SECRET", "HAUKI_ORIGIN_ID"],
)
@freeze_time("2021-01-01 12:00:00", tz_offset=2)
def test__hauki__link_generation__missing_settings_values(setting):
    setattr(settings, setting, None)

    link = generate_hauki_link(uuid="123", username="foo@bar.com", organization_id=ORGANIZATION)

    assert link is None


@pytest.mark.usefixtures("_use_hauki_env_variables")
@freeze_time("2021-01-01 12:00:00", tz_offset=2)
def test__hauki__link_generation__organization_none():
    link = generate_hauki_link(uuid="123", username="foo@bar.com", organization_id=None)

    assert link is None
