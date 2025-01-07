from __future__ import annotations

import datetime
import hashlib
import hmac
from typing import TYPE_CHECKING
from urllib.parse import quote_plus, urlencode

from django.conf import settings

from utils.date_utils import local_datetime

if TYPE_CHECKING:
    import uuid


def generate_hauki_link(reservation_unit_uuid: uuid.UUID | str, username: str, organization_id: str) -> str | None:
    if not (
        settings.HAUKI_ADMIN_UI_URL
        and settings.HAUKI_SECRET
        and settings.HAUKI_ORIGIN_ID
        and username
        and organization_id
    ):
        return None

    now = local_datetime()
    hauki_expire_time_minutes = 30

    get_parameters_dict = {
        "hsa_source": settings.HAUKI_ORIGIN_ID,
        "hsa_username": username,
        "hsa_organization": organization_id,
        "hsa_created_at": now.isoformat(),
        "hsa_valid_until": (now + datetime.timedelta(minutes=hauki_expire_time_minutes)).isoformat(),
        "hsa_resource": f"{settings.HAUKI_ORIGIN_ID}:{reservation_unit_uuid}",
        "hsa_has_organization_rights": "true",
    }

    data_fields = [
        "hsa_source",
        "hsa_username",
        "hsa_created_at",
        "hsa_valid_until",
        "hsa_organization",
        "hsa_resource",
        "hsa_has_organization_rights",
    ]

    data_string = "".join([get_parameters_dict[field] for field in data_fields if field in get_parameters_dict])

    calculated_signature = hmac.new(
        key=settings.HAUKI_SECRET.encode("utf-8"),
        msg=data_string.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()

    get_parameters_dict["hsa_signature"] = calculated_signature

    parameters = urlencode(get_parameters_dict)
    base_url = f"{settings.HAUKI_ADMIN_UI_URL}/resource"
    resource_url = quote_plus(f"{settings.HAUKI_ORIGIN_ID}:{reservation_unit_uuid}")
    return f"{base_url}/{resource_url}/?{parameters}"
