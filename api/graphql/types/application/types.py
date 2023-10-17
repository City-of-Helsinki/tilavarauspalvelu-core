import graphene
from django.contrib.auth import get_user_model
from django.db import models

from api.graphql.extensions.base_types import DjangoAuthNode
from api.graphql.types.address.types import AddressNode
from api.graphql.types.application.filtersets import ApplicationFilterSet
from api.graphql.types.application.permissions import ApplicationPermission
from api.graphql.types.application_event.types import ApplicationEventNode
from api.graphql.types.city.types import CityNode
from api.graphql.types.organization.types import OrganisationNode
from api.graphql.types.person.types import PersonNode
from api.graphql.types.users.types import ApplicantNode
from applications.choices import ApplicationStatusChoice
from applications.models import Application
from common.typing import AnyUser
from permissions.helpers import (
    get_service_sectors_where_can_view_applications,
    get_units_where_can_view_applications,
)

User = get_user_model()


class ApplicationNode(DjangoAuthNode):
    contact_person = PersonNode.Field()
    organisation = OrganisationNode.Field()
    status = graphene.Field(graphene.Enum.from_enum(ApplicationStatusChoice))
    billing_address = AddressNode.Field()
    home_city = CityNode.Field()

    applicant = ApplicantNode.Field(source="user")

    application_events = ApplicationEventNode.ListField()

    class Meta:
        model = Application
        fields = [
            "pk",
            "applicant_type",
            "organisation",
            "application_round",
            "applicant",
            "contact_person",
            "application_events",
            "status",
            "billing_address",
            "home_city",
            "created_date",
            "last_modified_date",
            "additional_information",
        ]
        filterset_class = ApplicationFilterSet
        permission_classes = (ApplicationPermission,)

    @classmethod
    def filter_queryset(cls, queryset: models.QuerySet, user: AnyUser) -> models.QuerySet:
        units = get_units_where_can_view_applications(user)
        service_sectors = get_service_sectors_where_can_view_applications(user)

        return queryset.filter(
            models.Q(application_round__service_sector__in=service_sectors)
            | models.Q(application_events__event_reservation_units__reservation_unit__unit__in=units)
            | models.Q(user=user)
        ).distinct()
