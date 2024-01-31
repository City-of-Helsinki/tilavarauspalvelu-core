from graphene_permissions.mixins import AuthFilter

from api.graphql.types.reservation_metadataset.permissions import ReservationMetadataSetPermission


class ReservationMetadataSetFilter(AuthFilter):
    permission_classes = (ReservationMetadataSetPermission,)
