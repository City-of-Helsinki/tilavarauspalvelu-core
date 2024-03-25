from typing import Any

from graphene_django_extensions import NestingModelSerializer

from api.graphql.extensions.fields import OldChoiceIntegerField, ValidatingListField
from api.graphql.extensions.validation_errors import ValidationErrorCodes, ValidationErrorWithCode
from reservations.models import RecurringReservation
from tilavarauspalvelu.utils.commons import WEEKDAYS

__all__ = [
    "RecurringReservationSerializer",
]


class RecurringReservationSerializer(NestingModelSerializer):
    # TODO: Refactor this away
    weekdays = ValidatingListField(
        child=OldChoiceIntegerField(choices=WEEKDAYS.CHOICES, allow_null=False),
        allow_empty=False,
        required=False,
    )

    class Meta:
        model = RecurringReservation
        fields = [
            "pk",
            "user",
            "name",
            "description",
            "reservation_unit",
            "age_group",
            "ability_group",
            "recurrence_in_days",
            "weekdays",
            "begin_time",
            "end_time",
            "begin_date",
            "end_date",
        ]
        extra_kwargs = {
            "user": {
                "read_only": False,
            },
        }

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        begin_time = data.get("begin_time", getattr(self.instance, "begin_time", None))
        end_time = data.get("end_time", getattr(self.instance, "end_time", None))

        if end_time < begin_time:
            raise ValidationErrorWithCode(
                "Begin time cannot be after end time.",
                ValidationErrorCodes.RESERVATION_BEGIN_AFTER_END,
            )

        begin_date = data.get("begin_date", getattr(self.instance, "begin_date", None))
        end_date = data.get("end_date", getattr(self.instance, "end_date", None))

        if end_date < begin_date:
            raise ValidationErrorWithCode(
                "Begin date cannot be after end date.",
                ValidationErrorCodes.RESERVATION_BEGIN_AFTER_END,
            )

        user = self.context.get("request").user
        if user.is_anonymous:
            user = None

        data["user"] = user

        return data

    def validate_weekdays(self, weekdays: list[str] | None) -> str:
        days = []
        weekdays = weekdays or getattr(self.instance, "weekdays", [])
        for weekday in weekdays:
            if weekday not in WEEKDAYS.VALUES:
                raise ValidationErrorWithCode(f"Invalid weekday {weekday}.", ValidationErrorCodes.INVALID_WEEKDAY)
            days.append(str(weekday))

        return ",".join(days)

    def validate_recurrence_in_days(self, recurrence_in_days: int) -> int:
        if recurrence_in_days == 0 or recurrence_in_days % 7 != 0:
            raise ValidationErrorWithCode(
                "Interval value not allowed, allowed values are 7,14,28 etc. divisible by seven.",
                ValidationErrorCodes.INVALID_RECURRENCE_IN_DAY,
            )
        return recurrence_in_days
