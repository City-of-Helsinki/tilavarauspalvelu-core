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


__all__ = [
    "generate_hauki_link",
]


def generate_hauki_link(
    reservation_unit_uuid: uuid.UUID | str,
    user_email: str,
    organization_id: str,
    target_resources: list[uuid.UUID] | None = None,
) -> str | None:
    """
    Generate a link to Hauki for the given reservation unit.

    :param reservation_unit_uuid: The UUID of the reservation unit.
    :param user_email: The user's email address.
    :param organization_id: Unit TPRek organization ID.
    :param target_resources: Additional reservation unit UUIDs to edit in bulk.
    """
    if (
        not settings.HAUKI_ADMIN_UI_URL
        or not settings.HAUKI_SECRET
        or not settings.HAUKI_ORIGIN_ID
        or not user_email
        or not organization_id
    ):
        return None

    now = local_datetime()
    hauki_expire_time_minutes = 30

    get_parameters_dict = {
        "hsa_source": settings.HAUKI_ORIGIN_ID,
        "hsa_username": user_email,
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

    data_string = "".join(get_parameters_dict[field] for field in data_fields if field in get_parameters_dict)

    get_parameters_dict["hsa_signature"] = hmac.new(
        key=settings.HAUKI_SECRET.encode("utf-8"),
        msg=data_string.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()

    if target_resources is not None:
        get_parameters_dict["target_resources"] = ",".join(
            f"{settings.HAUKI_ORIGIN_ID}:{resource}" for resource in target_resources
        )

    parameters = urlencode(get_parameters_dict)
    base_url = f"{settings.HAUKI_ADMIN_UI_URL}/resource"
    resource_url = quote_plus(f"{settings.HAUKI_ORIGIN_ID}:{reservation_unit_uuid}")
    return f"{base_url}/{resource_url}/?{parameters}"
