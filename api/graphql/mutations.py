"""
Import all mutation classes to this file.

This is done to avoid issues where the mutation class's model serializer has other
model serializers as fields. In this case, graphene-django requires that a matching
ObjectType for the sub-serializer's model is created before the mutation class is created.
If the import order in `schema.py` is such that the mutation class is imported first,
the mutation class creation fails.

Importing all mutations to this file and then to the schema.py file AFTER importing
the corresponding `queries.py` with all the ObjectTypes mitigates this issue.
"""

from api.graphql.types.allocated_time_slot.mutations import (
    AllocatedTimeSlotCreateMutation,
    AllocatedTimeSlotDeleteMutation,
)
from api.graphql.types.application.mutations import (
    ApplicationCancelMutation,
    ApplicationCreateMutation,
    ApplicationSendMutation,
    ApplicationUpdateMutation,
)
from api.graphql.types.application_section.mutations import (
    ApplicationSectionCreateMutation,
    ApplicationSectionDeleteMutation,
    ApplicationSectionUpdateMutation,
)
from api.graphql.types.banner_notification.mutations import (
    BannerNotificationCreateMutation,
    BannerNotificationDeleteMutation,
    BannerNotificationUpdateMutation,
)
from api.graphql.types.equipment.mutations import (
    EquipmentCreateMutation,
    EquipmentDeleteMutation,
    EquipmentUpdateMutation,
)
from api.graphql.types.equipment_category.mutations import (
    EquipmentCategoryCreateMutation,
    EquipmentCategoryDeleteMutation,
    EquipmentCategoryUpdateMutation,
)
from api.graphql.types.merchants.mutations import RefreshOrderMutation
from api.graphql.types.purpose.mutations import PurposeCreateMutation, PurposeUpdateMutation
from api.graphql.types.recurring_reservation.mutations import (
    RecurringReservationCreateMutation,
    RecurringReservationUpdateMutation,
)
from api.graphql.types.reservation.mutations import (
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
from api.graphql.types.reservation_unit.mutations import ReservationUnitCreateMutation, ReservationUnitUpdateMutation
from api.graphql.types.reservation_unit_image.mutations import (
    ReservationUnitImageCreateMutation,
    ReservationUnitImageDeleteMutation,
    ReservationUnitImageUpdateMutation,
)
from api.graphql.types.reservation_unit_option.mutations import ReservationUnitOptionUpdateMutation
from api.graphql.types.resource.mutations import ResourceCreateMutation, ResourceDeleteMutation, ResourceUpdateMutation
from api.graphql.types.space.mutations import SpaceCreateMutation, SpaceDeleteMutation, SpaceUpdateMutation
from api.graphql.types.unit.mutations import UnitUpdateMutation
from api.graphql.types.user.mutations import UserUpdateMutation

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
    "ReservationAdjustTimeMutation",
    "ReservationApproveMutation",
    "ReservationCancellationMutation",
    "ReservationConfirmMutation",
    "ReservationCreateMutation",
    "ReservationDeleteMutation",
    "ReservationDenyMutation",
    "ReservationRefundMutation",
    "ReservationRequiresHandlingMutation",
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
    "SpaceCreateMutation",
    "SpaceDeleteMutation",
    "SpaceUpdateMutation",
    "UnitUpdateMutation",
    "UserUpdateMutation",
]
