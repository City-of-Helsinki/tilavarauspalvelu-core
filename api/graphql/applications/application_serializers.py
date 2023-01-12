from typing import Any, Dict, List, Union

from rest_framework import serializers

from api.applications_api.serializers import (
    AddressSerializer,
    ApplicationEventSerializer,
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
from applications.models import (
    Address,
    Application,
    ApplicationEvent,
    ApplicationRound,
    ApplicationStatus,
    City,
    Organisation,
    Person,
)


class OrganisationCreateSerializer(OrganisationSerializer, PrimaryKeySerializer):
    identifier = serializers.CharField(required=False)

    class Meta:
        model = Organisation
        fields = [
            "pk",
            "name",
            "identifier",
            "year_established",
            "active_members",
            "organisation_type",
            "core_business",
            "email",
            "address",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["pk"].read_only = False


class PersonCreateSerializer(PersonSerializer, PrimaryKeySerializer):
    class Meta:
        model = Person
        fields = ["pk", "first_name", "last_name", "email", "phone_number"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["pk"].read_only = False


class AddressCreateSerializer(AddressSerializer, PrimaryKeySerializer):
    class Meta:
        model = Address

        fields = ["pk", "street_address", "post_code", "city"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["pk"].read_only = False


class ApplicationEventInApplicationSerializer(ApplicationEventCreateSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["application"].required = False
        self.fields["pk"].read_only = False


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

    billing_address = AddressCreateSerializer(
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

    @staticmethod
    def handle_person(contact_person_data: Dict[Any, Any]) -> Union[Person, None]:
        if contact_person_data is not None:
            # CASE: Create new person
            if "pk" not in contact_person_data or contact_person_data["pk"] is None:
                return PersonSerializer(data=contact_person_data).create(
                    validated_data=contact_person_data
                )

            # CASE: Update existing person
            return PersonSerializer(data=contact_person_data).update(
                instance=Person.objects.get(pk=contact_person_data["pk"]),
                validated_data=contact_person_data,
            )

        return None

    def handle_organisation(
        self, organisation_data: Dict[Any, Any]
    ) -> Union[Organisation, None]:
        if organisation_data is not None:
            # CASE: Create new organisation
            if "pk" not in organisation_data or organisation_data["pk"] is None:
                return OrganisationSerializer(data=organisation_data).create(
                    validated_data=organisation_data
                )

            # CASE: Update existing organisation
            return OrganisationSerializer(data=organisation_data).update(
                instance=Organisation.objects.get(pk=organisation_data["pk"]),
                validated_data=organisation_data,
            )

        return None

    def handle_events(
        self,
        application_instance: Application,
        event_data: Union[List[Dict[Any, Any]], None],
    ):
        event_ids = []

        if event_data is None:
            return

        for event in event_data:
            event["application"] = application_instance

            # CASE: Create new application event
            if "pk" not in event or event["pk"] is None:
                event_ids.append(
                    ApplicationEventSerializer(data=event)
                    .create(validated_data=event)
                    .id
                )

                continue

            # CASE: Update existing event
            event_ids.append(
                ApplicationEventSerializer(data=event)
                .update(
                    instance=ApplicationEvent.objects.get(pk=event["pk"]),
                    validated_data=event,
                )
                .id
            )

        # Delete events that were not created or modified
        ApplicationEvent.objects.filter(application=application_instance).exclude(
            id__in=event_ids
        ).delete()

    def handle_billing_address(self, billing_address_data: Dict[Any, Any]):
        if "pk" not in billing_address_data or billing_address_data["pk"] is None:
            billing_address = AddressSerializer(data=billing_address_data).create(
                validated_data=billing_address_data
            )

        else:
            billing_address = AddressSerializer(data=billing_address_data).update(
                instance=Address.objects.get(pk=billing_address_data["pk"]),
                validated_data=billing_address_data,
            )

        return billing_address

    def validate(self, data):
        try:
            data = super().validate(data)
        except serializers.ValidationError as e:
            raise self.validation_error_to_graphql_error(e)

        return data


class ApplicationUpdateSerializer(
    ApplicationCreateSerializer, PrimaryKeyUpdateSerializer
):
    application_events = ApplicationEventInApplicationSerializer(
        help_text="Application events in application", many=True
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        fields = dict(self.fields)
        fields.pop("pk")

        for key, value in fields.items():
            self.fields[key].required = False
