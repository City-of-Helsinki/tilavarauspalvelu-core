from rest_framework import serializers

from api.graphql.base_serializers import PrimaryKeySerializer
from api.graphql.choice_fields import ChoiceIntegerField
from api.graphql.primary_key_fields import IntegerPrimaryKeyField
from api.graphql.validating_list_field import ValidatingListField
from api.graphql.validation_errors import ValidationErrorCodes, ValidationErrorWithCode
from reservation_units.models import ReservationUnit
from reservations.models import AbilityGroup, AgeGroup, RecurringReservation
from tilavarauspalvelu.utils.commons import WEEKDAYS


class RecurringReservationCreateSerializer(PrimaryKeySerializer):
    reservation_unit_pk = IntegerPrimaryKeyField(
        queryset=ReservationUnit.objects.all(),
        source="reservation_unit",
        allow_null=False,
    )
    age_group_pk = IntegerPrimaryKeyField(
        queryset=AgeGroup.objects.all(),
        source="age_group",
        allow_null=True,
        required=False,
    )
    ability_group_pk = IntegerPrimaryKeyField(
        queryset=AbilityGroup.objects.all(),
        source="ability_group",
        allow_null=True,
        required=False,
    )

    weekdays = ValidatingListField(
        child=ChoiceIntegerField(choices=WEEKDAYS.CHOICES, allow_null=False),
        allow_empty=False,
        required=True,
        help_text="List of weekdays which days the reservations occurs",
    )

    name = serializers.CharField(required=False, default="")
    begin_time = serializers.TimeField(
        required=True, help_text="Time when reservations begins."
    )
    end_time = serializers.TimeField(
        required=True, help_text="Time when reservations ends."
    )
    begin_date = serializers.DateField(
        required=True, help_text="Date when first reservation begins."
    )
    end_date = serializers.DateField(
        required=True, help_text="Date when last reservation begins."
    )
    interval = serializers.IntegerField(required=True)

    class Meta:
        model = RecurringReservation
        fields = [
            "pk",
            "user",
            "name",
            "reservation_unit_pk",
            "age_group_pk",
            "ability_group_pk",
            "interval",
            "weekdays",
            "begin_time",
            "end_time",
            "begin_date",
            "end_date",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields["user"].readonly = True

    def validate(self, data):
        begin = data.get("begin_time", getattr(self.instance, "begin_time", None))
        end = data.get("end_time", getattr(self.instance, "end_time", None))

        if end < begin:
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

    def validate_weekdays(self, weekdays):
        days = []
        weekdays = weekdays or getattr(self.instance, "weekdays", [])
        for weekday in weekdays:
            if weekday not in WEEKDAYS.VALUES:
                raise ValidationErrorWithCode(
                    f"Invalid weekday {weekday}.", ValidationErrorCodes.INVALID_WEEKDAY
                )
            days.append(str(weekday))

        return ",".join(days)

    def validate_interval(self, interval):
        allowed_values = [i for i in range(170) if i % 7 == 0]
        interval = interval or getattr(self.instance, "interval", None)
        if interval in allowed_values:
            return interval

        raise ValidationErrorWithCode(
            "Interval value not allowed, allowed values are 7,14,28 etc. divisible by seven.",
            ValidationErrorCodes.INVALID_INTERVAL,
        )
