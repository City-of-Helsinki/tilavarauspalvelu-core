from typing import Any

from graphene_django_extensions import NestingModelSerializer
from rest_framework.exceptions import ValidationError

from api.graphql.extensions import error_codes
from applications.choices import ApplicationRoundStatusChoice
from applications.models import ApplicationRound
from applications.tasks import generate_reservation_series_from_allocations
from common.date_utils import local_datetime


class SetApplicationRoundHandledSerializer(NestingModelSerializer):
    instance: ApplicationRound

    class Meta:
        model = ApplicationRound
        fields = [
            "pk",
        ]

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if self.instance.status != ApplicationRoundStatusChoice.IN_ALLOCATION:
            msg = "Application round is not in allocation state."
            raise ValidationError(msg, code=error_codes.APPLICATION_ROUND_NOT_IN_ALLOCATION)
        return attrs

    def save(self, **kwargs: Any) -> ApplicationRound:
        kwargs["handled_date"] = local_datetime()
        instance = super().save(**kwargs)
        generate_reservation_series_from_allocations.delay(instance.pk)
        return instance
