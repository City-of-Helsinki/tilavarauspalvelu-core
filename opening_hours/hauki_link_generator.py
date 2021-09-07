import datetime
import hashlib
import hmac
import urllib.parse
from datetime import timedelta
from typing import Union
from uuid import UUID

from django.conf import settings
from django.utils.timezone import get_default_timezone


def generate_hauki_link(uuid: UUID, username: str) -> Union[None, str]:
    if not (
        settings.HAUKI_ADMIN_UI_URL
        and settings.HAUKI_SECRET
        and settings.HAUKI_ORIGIN_ID
        and settings.HAUKI_ORGANISATION_ID
        and username
    ):
        return None

    now = datetime.datetime.now(tz=get_default_timezone())

    HAUKI_EXPIRACY_TIME_MINUTES = 30

    get_parameters_string = (
        f"hsa_source={settings.HAUKI_ORIGIN_ID}&hsa_username={username}"
        f"&hsa_organization={settings.HAUKI_ORGANISATION_ID}"
        f"&hsa_created_at={now}&hsa_valid_until={now + timedelta(minutes=HAUKI_EXPIRACY_TIME_MINUTES)}"
        f"&hsa_resource={settings.HAUKI_ORIGIN_ID}:{uuid}"
    )

    payload = dict(urllib.parse.parse_qsl(get_parameters_string))

    data_fields = [
        "hsa_source",
        "hsa_username",
        "hsa_created_at",
        "hsa_valid_until",
        "hsa_organization",
        "hsa_resource",
        "hsa_has_organization_rights",
    ]

    data_string = "".join([payload[field] for field in data_fields if field in payload])

    calculated_signature = hmac.new(
        key=settings.HAUKI_SECRET.encode("utf-8"),
        msg=data_string.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()

    return (
        f"{settings.HAUKI_ADMIN_UI_URL}/resource/"
        f"{settings.HAUKI_ORIGIN_ID}:{uuid}/?{get_parameters_string}&hsa_signature={calculated_signature}"
    )
