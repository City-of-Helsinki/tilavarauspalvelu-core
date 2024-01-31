import graphene
from graphene import ClientIDMutation
from graphene_django.rest_framework.mutation import SerializerMutation
from graphene_file_upload.scalars import Upload
from rest_framework.generics import get_object_or_404

from api.graphql.extensions.legacy_helpers import OldAuthDeleteMutation, OldAuthSerializerMutation
from api.graphql.types.reservation_unit_image.permissions import ReservationUnitImagePermission
from api.graphql.types.reservation_unit_image.serializers import (
    ReservationUnitImageCreateSerializer,
    ReservationUnitImageUpdateSerializer,
)
from api.graphql.types.reservation_unit_image.types import ReservationUnitImageType
from common.typing import GQLInfo
from reservation_units.models import ReservationUnitImage


class ReservationUnitImageCreateMutation(OldAuthSerializerMutation, SerializerMutation):
    reservation_unit_image = graphene.Field(ReservationUnitImageType)

    class Input:
        image = Upload()

    permission_classes = (ReservationUnitImagePermission,)

    class Meta:
        model_operations = ["create"]
        serializer_class = ReservationUnitImageCreateSerializer

    def resolve_reservation_unit_image(root: ReservationUnitImage, info: GQLInfo):
        if root.pk:
            return get_object_or_404(ReservationUnitImage, pk=root.pk)
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
