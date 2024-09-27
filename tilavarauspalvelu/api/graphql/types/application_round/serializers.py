from typing import Any

from graphene_django_extensions import NestingModelSerializer
from lookup_property import L
from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.enums import ApplicationRoundStatusChoice, ApplicationStatusChoice
from tilavarauspalvelu.models import ApplicationRound
from tilavarauspalvelu.tasks import generate_reservation_series_from_allocations
from utils.date_utils import local_datetime


class SetApplicationRoundHandledSerializer(NestingModelSerializer):
    instance: ApplicationRound

    class Meta:
        model = ApplicationRound
        fields = [
            "pk",
        ]

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if self.instance.status != ApplicationRoundStatusChoice.IN_ALLOCATION:
            msg = "Application round is not in allocation status."
            raise ValidationError(msg, code=error_codes.APPLICATION_ROUND_NOT_IN_ALLOCATION)

        if self.instance.applications.filter(L(status=ApplicationStatusChoice.IN_ALLOCATION)).exists():
            msg = "Application round has applications still in allocation."
            raise ValidationError(msg, code=error_codes.APPLICATION_ROUND_HAS_UNHANDLED_APPLICATIONS)

        return attrs

    def save(self, **kwargs: Any) -> ApplicationRound:
        kwargs["handled_date"] = local_datetime()
        instance = super().save(**kwargs)
        generate_reservation_series_from_allocations.delay(instance.pk)
        return instance
