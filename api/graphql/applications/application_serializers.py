from rest_framework import serializers

from api.applications_api.serializers import (
    AddressSerializer,
    ApplicationSerializer,
    NullableCurrentUserDefault,
    OrganisationSerializer,
    PersonSerializer,
)
from api.graphql.applications.application_event_serializers import (
    ApplicationEventCreateSerializer,
)
from api.graphql.base_serializers import (
    PrimaryKeySerializer,
    PrimaryKeyUpdateSerializer,
)
from api.graphql.choice_char_field import ChoiceCharField
from api.graphql.primary_key_fields import IntegerPrimaryKeyField
from applications.models import Application, ApplicationRound, ApplicationStatus, City


class OrganisationCreateSerializer(OrganisationSerializer, PrimaryKeySerializer):
    identifier = serializers.CharField(required=False)


class PersonCreateSerializer(PersonSerializer, PrimaryKeySerializer):
    pass


class ApplicationEventInApplicationSerializer(ApplicationEventCreateSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["application"].required = False


class ApplicationCreateSerializer(ApplicationSerializer, PrimaryKeySerializer):

    contact_person = PersonCreateSerializer(
        help_text="Contact person information for the application",
        read_only=False,
        allow_null=True,
    )

    organisation = OrganisationCreateSerializer(
        help_text="Organisation information for the application",
        read_only=False,
        allow_null=True,
        required=False,
    )

    application_round_pk = IntegerPrimaryKeyField(
        queryset=ApplicationRound.objects.all(),
        source="application_round",
        help_text="Id of the application period for which this application is targeted to",
    )

    user = serializers.HiddenField(default=NullableCurrentUserDefault())

    application_events = ApplicationEventInApplicationSerializer(
        help_text="List of applications events", many=True
    )

    status = ChoiceCharField(
        help_text="Status of this application", choices=ApplicationStatus.STATUS_CHOICES
    )

    billing_address = AddressSerializer(
        help_text="Billing address for the application",
        allow_null=True,
    )

    applicant_type = serializers.CharField(allow_null=True)

    home_city_pk = IntegerPrimaryKeyField(
        queryset=City.objects.all(), source="home_city", required=False, allow_null=True
    )

    class Meta:
        model = Application
        fields = [
            "pk",
            "applicant_type",
            "applicant_name",
            "applicant_email",
            "organisation",
            "application_round_pk",
            "contact_person",
            "user",
            "application_events",
            "status",
            "billing_address",
            "home_city_pk",
            "created_date",
            "last_modified_date",
            "additional_information",
        ]
