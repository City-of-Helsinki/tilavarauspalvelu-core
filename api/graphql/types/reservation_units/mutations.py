import graphene
from auditlog.models import LogEntry
from django.conf import settings
from graphene import ClientIDMutation
from graphene_django.rest_framework.mutation import SerializerMutation
from graphene_file_upload.scalars import Upload
from graphql import GraphQLError
from rest_framework.generics import get_object_or_404

from api.graphql.extensions.legacy_helpers import OldAuthDeleteMutation, OldAuthSerializerMutation
from api.graphql.types.reservation_units.permissions import (
    EquipmentCategoryPermission,
    EquipmentPermission,
    PurposePermission,
    ReservationUnitImagePermission,
    ReservationUnitPermission,
)
from api.graphql.types.reservation_units.serializers import (
    EquipmentCategoryCreateSerializer,
    EquipmentCategoryUpdateSerializer,
    EquipmentCreateSerializer,
    EquipmentUpdateSerializer,
    PurposeCreateSerializer,
    PurposeUpdateSerializer,
    ReservationUnitCreateSerializer,
    ReservationUnitImageCreateSerializer,
    ReservationUnitImageUpdateSerializer,
    ReservationUnitUpdateSerializer,
)
from api.graphql.types.reservation_units.types import (
    EquipmentCategoryType,
    EquipmentType,
    PurposeType,
    ReservationUnitImageType,
    ReservationUnitType,
)
from opening_hours.errors import HaukiAPIError, HaukiRequestError
from opening_hours.utils.hauki_exporter import ReservationUnitHaukiExporter
from reservation_units.models import (
    Equipment,
    EquipmentCategory,
    Purpose,
    ReservationUnit,
    ReservationUnitImage,
)
from tilavarauspalvelu.utils import logging

logger = logging.getLogger(__name__)


class EquipmentCreateMutation(OldAuthSerializerMutation, SerializerMutation):
    equipment = graphene.Field(EquipmentType)

    permission_classes = (EquipmentPermission,)

    class Meta:
        model_operations = ["create"]
        serializer_class = EquipmentCreateSerializer


class EquipmentUpdateMutation(OldAuthSerializerMutation, SerializerMutation):
    equipment = graphene.Field(EquipmentType)

    permission_classes = (EquipmentPermission,)

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = EquipmentUpdateSerializer


class EquipmentDeleteMutation(OldAuthDeleteMutation, ClientIDMutation):
    permission_classes = (EquipmentPermission,)
    model = Equipment

    @classmethod
    def validate(cls, root, info, **input):
        return None


class EquipmentCategoryCreateMutation(OldAuthSerializerMutation, SerializerMutation):
    equipment_category = graphene.Field(EquipmentCategoryType)

    permission_classes = (EquipmentCategoryPermission,)

    class Meta:
        model_operations = ["create"]
        serializer_class = EquipmentCategoryCreateSerializer


class EquipmentCategoryUpdateMutation(OldAuthSerializerMutation, SerializerMutation):
    equipment_category = graphene.Field(EquipmentCategoryType)

    permission_classes = (EquipmentCategoryPermission,)

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = EquipmentCategoryUpdateSerializer


class EquipmentCategoryDeleteMutation(OldAuthDeleteMutation, ClientIDMutation):
    permission_classes = (EquipmentCategoryPermission,)
    model = EquipmentCategory

    @classmethod
    def validate(cls, root, info, **input):
        return None


class PurposeCreateMutation(OldAuthSerializerMutation, SerializerMutation):
    purpose = graphene.Field(PurposeType)

    permission_classes = (PurposePermission,)

    class Meta:
        model_operations = ["create"]

        serializer_class = PurposeCreateSerializer

    @classmethod
    def perform_mutate(cls, serializer, info):
        purpose = serializer.create(serializer.validated_data)
        return cls(errors=None, purpose=purpose)


class PurposeUpdateMutation(OldAuthSerializerMutation, SerializerMutation):
    purpose = graphene.Field(PurposeType)

    permission_classes = (PurposePermission,)

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = PurposeUpdateSerializer

    @classmethod
    def perform_mutate(cls, serializer, info):
        validated_data = serializer.validated_data
        pk = validated_data.get("pk")
        purpose = serializer.update(get_object_or_404(Purpose, pk=pk), validated_data)
        return cls(errors=None, purpose=purpose)


class ReservationUnitMutationMixin:
    @classmethod
    def perform_mutate(cls, serializer, info):
        """
        After serializer is validated and save we check if the reservation unit
        was published and thus should be sent to HAUKI and do it here.
        """
        mutation_response = super().perform_mutate(serializer, info)
        reservation_unit = serializer.instance
        if not settings.HAUKI_EXPORTS_ENABLED:
            return mutation_response

        exporter = ReservationUnitHaukiExporter(reservation_unit)
        try:
            exporter.send_reservation_unit_to_hauki()
        except (HaukiRequestError, HaukiAPIError):
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

    @classmethod
    def remove_personal_data_and_logs_on_archive(cls, input: dict):
        """
        When reservation unit is archived, we want to delete all personally identifiable information (GDPR stuff).
        Because all changes are stored to the audit log, we also need to delete old audit events related to the unit.
        """
        if "is_archived" not in input:
            return

        reservation_unit_pk = input["pk"]
        reservation_unit = ReservationUnit.objects.get(pk=reservation_unit_pk)
        old_archived_value = reservation_unit.is_archived
        new_archived_value = input["is_archived"]

        if not new_archived_value or old_archived_value == new_archived_value:
            return

        # Don't allow new contact information to be saved when reservation unit is archived
        if "contact_information" in input:
            del input["contact_information"]

        # Reset contact information
        reservation_unit.contact_information = ""
        reservation_unit.save()

        deleted_log_entries = LogEntry.objects.get_for_object(reservation_unit).delete()

        logger.info(
            f"Reservation unit {reservation_unit_pk} archived. Content information "
            f"removed and {deleted_log_entries} audit log entries deleted."
        )

    @classmethod
    def mutate(cls, root, info, input):
        cls.remove_personal_data_and_logs_on_archive(input)
        return super().mutate(root, info, input)

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = ReservationUnitUpdateSerializer


class ReservationUnitImageCreateMutation(OldAuthSerializerMutation, SerializerMutation):
    reservation_unit_image = graphene.Field(ReservationUnitImageType)

    class Input:
        image = Upload()

    permission_classes = (ReservationUnitImagePermission,)

    class Meta:
        model_operations = ["create"]
        serializer_class = ReservationUnitImageCreateSerializer

    def resolve_reservation_unit_image(self, info):
        if self.pk:
            return get_object_or_404(ReservationUnitImage, pk=self.pk)
        return None


class ReservationUnitImageUpdateMutation(OldAuthSerializerMutation, SerializerMutation):
    reservation_unit_image = graphene.Field(ReservationUnitImageType)

    permission_classes = (ReservationUnitImagePermission,)

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = ReservationUnitImageUpdateSerializer


class ReservationUnitImageDeleteMutation(OldAuthDeleteMutation, ClientIDMutation):
    permission_classes = (ReservationUnitImagePermission,)
    model = ReservationUnitImage

    @classmethod
    def validate(cls, root, info, **input):
        return None
