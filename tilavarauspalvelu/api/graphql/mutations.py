"""
Import all mutation classes to this file.

This is done to avoid issues where the mutation class's model serializer has other
model serializers as fields. In this case, `graphene-django` requires that a matching
ObjectType for the sub-serializer's model is created before the mutation class is created.
If the import order in `schema.py` is such that the mutation class is imported first,
the mutation class creation fails.

Importing all queries to this file from `queries.py` before importing any mutations,
and then importing both to `schema.py` from these respective files solves the import order issue.
"""

# Import all queries before importing any mutations! See explanation above.
from .queries import *  # noqa: F403  # isort:skip

from tilavarauspalvelu.api.graphql.types.allocated_time_slot.mutations import (
    AllocatedTimeSlotCreateMutation,
    AllocatedTimeSlotDeleteMutation,
)
from tilavarauspalvelu.api.graphql.types.application.mutations import (
    ApplicationCancelMutation,
    ApplicationCreateMutation,
    ApplicationSendMutation,
    ApplicationUpdateMutation,
    RejectAllApplicationOptionsMutation,
    RestoreAllApplicationOptionsMutation,
)
from tilavarauspalvelu.api.graphql.types.application_round.mutation import SetApplicationRoundHandledMutation
from tilavarauspalvelu.api.graphql.types.application_section.mutations import (
    ApplicationSectionCreateMutation,
    ApplicationSectionDeleteMutation,
    ApplicationSectionUpdateMutation,
    RejectAllSectionOptionsMutation,
    RestoreAllSectionOptionsMutation,
)
from tilavarauspalvelu.api.graphql.types.banner_notification.mutations import (
    BannerNotificationCreateMutation,
    BannerNotificationDeleteMutation,
    BannerNotificationUpdateMutation,
)
from tilavarauspalvelu.api.graphql.types.equipment.mutations import (
    EquipmentCreateMutation,
    EquipmentDeleteMutation,
    EquipmentUpdateMutation,
)
from tilavarauspalvelu.api.graphql.types.equipment_category.mutations import (
    EquipmentCategoryCreateMutation,
    EquipmentCategoryDeleteMutation,
    EquipmentCategoryUpdateMutation,
)
from tilavarauspalvelu.api.graphql.types.merchants.mutations import RefreshOrderMutation
from tilavarauspalvelu.api.graphql.types.purpose.mutations import PurposeCreateMutation, PurposeUpdateMutation
from tilavarauspalvelu.api.graphql.types.recurring_reservation.mutations import (
    RecurringReservationCreateMutation,
    RecurringReservationUpdateMutation,
    ReservationSeriesCreateMutation,
)
from tilavarauspalvelu.api.graphql.types.reservation.mutations import (
    ReservationAdjustTimeMutation,
    ReservationApproveMutation,
    ReservationCancellationMutation,
    ReservationConfirmMutation,
    ReservationCreateMutation,
    ReservationDeleteMutation,
    ReservationDenyMutation,
    ReservationRefundMutation,
    ReservationRequiresHandlingMutation,
    ReservationStaffAdjustTimeMutation,
    ReservationStaffCreateMutation,
    ReservationStaffModifyMutation,
    ReservationUpdateMutation,
    ReservationWorkingMemoMutation,
)
from tilavarauspalvelu.api.graphql.types.reservation_unit.mutations import (
    ReservationUnitCreateMutation,
    ReservationUnitUpdateMutation,
)
from tilavarauspalvelu.api.graphql.types.reservation_unit_image.mutations import (
    ReservationUnitImageCreateMutation,
    ReservationUnitImageDeleteMutation,
    ReservationUnitImageUpdateMutation,
)
from tilavarauspalvelu.api.graphql.types.reservation_unit_option.mutations import ReservationUnitOptionUpdateMutation
from tilavarauspalvelu.api.graphql.types.resource.mutations import (
    ResourceCreateMutation,
    ResourceDeleteMutation,
    ResourceUpdateMutation,
)
from tilavarauspalvelu.api.graphql.types.space.mutations import (
    SpaceCreateMutation,
    SpaceDeleteMutation,
    SpaceUpdateMutation,
)
from tilavarauspalvelu.api.graphql.types.unit.mutations import UnitUpdateMutation
from tilavarauspalvelu.api.graphql.types.user.mutations import UserUpdateMutation

__all__ = [
    "AllocatedTimeSlotCreateMutation",
    "AllocatedTimeSlotDeleteMutation",
    "ApplicationCancelMutation",
    "ApplicationCreateMutation",
    "ApplicationSectionCreateMutation",
    "ApplicationSectionDeleteMutation",
    "ApplicationSectionUpdateMutation",
    "ApplicationSendMutation",
    "ApplicationUpdateMutation",
    "BannerNotificationCreateMutation",
    "BannerNotificationDeleteMutation",
    "BannerNotificationUpdateMutation",
    "EquipmentCategoryCreateMutation",
    "EquipmentCategoryDeleteMutation",
    "EquipmentCategoryUpdateMutation",
    "EquipmentCreateMutation",
    "EquipmentDeleteMutation",
    "EquipmentUpdateMutation",
    "PurposeCreateMutation",
    "PurposeUpdateMutation",
    "RecurringReservationCreateMutation",
    "RecurringReservationUpdateMutation",
    "RefreshOrderMutation",
    "RejectAllApplicationOptionsMutation",
    "RejectAllSectionOptionsMutation",
    "ReservationAdjustTimeMutation",
    "ReservationApproveMutation",
    "ReservationCancellationMutation",
    "ReservationConfirmMutation",
    "ReservationCreateMutation",
    "ReservationDeleteMutation",
    "ReservationDenyMutation",
    "ReservationRefundMutation",
    "ReservationRequiresHandlingMutation",
    "ReservationSeriesCreateMutation",
    "ReservationStaffAdjustTimeMutation",
    "ReservationStaffCreateMutation",
    "ReservationStaffModifyMutation",
    "ReservationUnitCreateMutation",
    "ReservationUnitImageCreateMutation",
    "ReservationUnitImageDeleteMutation",
    "ReservationUnitImageUpdateMutation",
    "ReservationUnitOptionUpdateMutation",
    "ReservationUnitUpdateMutation",
    "ReservationUpdateMutation",
    "ReservationWorkingMemoMutation",
    "ResourceCreateMutation",
    "ResourceDeleteMutation",
    "ResourceUpdateMutation",
    "RestoreAllApplicationOptionsMutation",
    "RestoreAllSectionOptionsMutation",
    "SetApplicationRoundHandledMutation",
    "SpaceCreateMutation",
    "SpaceDeleteMutation",
    "SpaceUpdateMutation",
    "UnitUpdateMutation",
    "UserUpdateMutation",
]
