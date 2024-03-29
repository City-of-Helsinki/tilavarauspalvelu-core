from rest_framework import serializers

from api.graphql.extensions.legacy_helpers import (
    OldChoiceIntegerField,
    OldPrimaryKeySerializer,
    OldPrimaryKeyUpdateSerializer,
)
from api.graphql.extensions.validating_list_field import ValidatingListField
from api.graphql.extensions.validation_errors import ValidationErrorCodes, ValidationErrorWithCode
from common.fields.serializer import IntegerPrimaryKeyField
from reservation_units.models import ReservationUnit
from reservations.models import AbilityGroup, AgeGroup, RecurringReservation
from tilavarauspalvelu.utils.commons import WEEKDAYS


class RecurringReservationCreateSerializer(OldPrimaryKeySerializer):
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
        child=OldChoiceIntegerField(choices=WEEKDAYS.CHOICES, allow_null=False),
        allow_empty=False,
        required=True,
        help_text="List of weekdays which days the reservations occurs",
    )

    name = serializers.CharField(required=False, default="")
    description = serializers.CharField(required=False, default="", allow_blank=True)
    begin_time = serializers.TimeField(required=True, help_text="Time when reservations begins.")
    end_time = serializers.TimeField(required=True, help_text="Time when reservations ends.")
    begin_date = serializers.DateField(required=True, help_text="Date when first reservation begins.")
    end_date = serializers.DateField(required=True, help_text="Date when last reservation begins.")
    recurrence_in_days = serializers.IntegerField(required=True)

    class Meta:
        model = RecurringReservation
        fields = [
            "pk",
            "user",
            "name",
            "description",
            "reservation_unit_pk",
            "age_group_pk",
            "ability_group_pk",
            "recurrence_in_days",
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
                raise ValidationErrorWithCode(f"Invalid weekday {weekday}.", ValidationErrorCodes.INVALID_WEEKDAY)
            days.append(str(weekday))

        return ",".join(days)

    def validate_recurrence_in_days(self, recurrence_in_days):
        if recurrence_in_days == 0 or recurrence_in_days % 7 != 0:
            raise ValidationErrorWithCode(
                "Interval value not allowed, allowed values are 7,14,28 etc. divisible by seven.",
                ValidationErrorCodes.INVALID_RECURRENCE_IN_DAY,
            )

        return recurrence_in_days


class RecurringReservationUpdateSerializer(OldPrimaryKeyUpdateSerializer, RecurringReservationCreateSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields["user"].readonly = True
        self.fields["name"].required = False
        self.fields["description"].required = False
        self.fields["recurrence_in_days"].required = False
        self.fields["begin_time"].required = False
        self.fields["end_time"].required = False
        self.fields["begin_date"].required = False
        self.fields["end_date"].required = False
        self.fields["weekdays"].required = False
        self.fields["ability_group_pk"].required = False
        self.fields["age_group_pk"].required = False
        self.fields.pop("reservation_unit_pk")
