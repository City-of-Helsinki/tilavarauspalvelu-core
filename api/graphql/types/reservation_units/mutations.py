import logging

import graphene
from auditlog.models import LogEntry
from django.conf import settings
from graphene_django.rest_framework.mutation import SerializerMutation
from graphql import GraphQLError

from api.graphql.extensions.legacy_helpers import OldAuthSerializerMutation
from api.graphql.types.reservation_units.permissions import ReservationUnitPermission
from api.graphql.types.reservation_units.serializers import (
    ReservationUnitCreateSerializer,
    ReservationUnitUpdateSerializer,
)
from api.graphql.types.reservation_units.types import ReservationUnitType
from opening_hours.utils.hauki_resource_hash_updater import HaukiResourceHashUpdater
from reservation_units.models import ReservationUnit
from utils.external_service.errors import ExternalServiceError

logger = logging.getLogger(__name__)


class ReservationUnitMutationMixin:
    @classmethod
    def perform_mutate(cls, serializer, info):
        """
        After serializer is validated and save we check if the reservation unit
        was published and thus should be sent to HAUKI and do it here.
        """
        mutation_response = super().perform_mutate(serializer, info)

        reservation_unit = serializer.instance

        if reservation_unit.origin_hauki_resource is not None:
            HaukiResourceHashUpdater([reservation_unit.origin_hauki_resource.id]).run(force_refetch=True)

        if settings.HAUKI_EXPORTS_ENABLED:
            try:
                reservation_unit.actions.send_reservation_unit_to_hauki()
            except ExternalServiceError:
                raise GraphQLError("Sending reservation unit as resource to HAUKI failed.")

        return mutation_response


class ReservationUnitCreateMutation(ReservationUnitMutationMixin, OldAuthSerializerMutation, SerializerMutation):
    reservation_unit = graphene.Field(ReservationUnitType)

    permission_classes = (ReservationUnitPermission,)

    class Meta:
        model_operations = ["create"]

        serializer_class = ReservationUnitCreateSerializer


class ReservationUnitUpdateMutation(ReservationUnitMutationMixin, OldAuthSerializerMutation, SerializerMutation):
    reservation_unit = graphene.Field(ReservationUnitType)

    permission_classes = (ReservationUnitPermission,)

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = ReservationUnitUpdateSerializer

    @classmethod
    def remove_personal_data_and_logs_on_archive(cls, input: dict):
        """
        When reservation unit is archived, we want to delete all personally identifiable information (GDPR stuff).
        Because all changes are stored to the audit log, we also need to delete old audit events related to the unit.
        """
        if "is_archived" not in input:
            return

        reservation_unit = ReservationUnit.objects.get(pk=input["pk"])

        # Archive state is unchanged or set to false, no need to do anything.
        if input["is_archived"] is False or reservation_unit.is_archived == input["is_archived"]:
            return

        # Don't allow new contact information or draft state to be saved when reservation unit is archived
        input.pop("contact_information", None)
        input.pop("is_draft", None)

        # Reset contact information and mark reservation unit as draft
        reservation_unit.contact_information = ""
        reservation_unit.is_draft = True
        reservation_unit.save()

        deleted_log_entries = LogEntry.objects.get_for_object(reservation_unit).delete()

        logger.info(
            f"Reservation unit {reservation_unit.pk} archived. Content information "
            f"removed and {deleted_log_entries} audit log entries deleted."
        )

    @classmethod
    def mutate(cls, root, info, input):
        cls.remove_personal_data_and_logs_on_archive(input)
        return super().mutate(root, info, input)
