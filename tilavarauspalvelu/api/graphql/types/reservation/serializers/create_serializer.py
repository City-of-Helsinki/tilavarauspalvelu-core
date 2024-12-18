from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.conf import settings

from tilavarauspalvelu.api.graphql.types.reservation.serializers._base_save_serializer import (
    ReservationBaseSaveSerializer,
)
from tilavarauspalvelu.integrations.helauth.clients import HelsinkiProfileClient
from utils.external_service.errors import ExternalServiceError
from utils.sentry import SentryLogger

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Reservation
    from tilavarauspalvelu.typing import AnyUser, WSGIRequest


class ReservationCreateSerializer(ReservationBaseSaveSerializer):
    instance: Reservation

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        data = super().validate(data)

        if settings.PREFILL_RESERVATION_WITH_PROFILE_DATA:
            self._prefill_reservation_from_profile(data)

        return data

    def _prefill_reservation_from_profile(self, data: dict[str, Any]) -> None:
        request: WSGIRequest = self.context["request"]
        user: AnyUser = request.user
        if user.is_anonymous:
            return

        id_token = user.id_token
        if id_token is None or id_token.is_ad_login:
            return

        try:
            prefill_info = HelsinkiProfileClient.get_reservation_prefill_info(user=user, session=request.session)
        except ExternalServiceError:
            return
        except Exception as error:  # noqa: BLE001
            msg = "Unexpected error reading profile data"
            SentryLogger.log_exception(error, details=msg, user=user.pk)
            return

        if prefill_info is not None:
            data.update({key: value for key, value in prefill_info.items() if value is not None})
