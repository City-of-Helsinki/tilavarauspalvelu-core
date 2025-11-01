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
from __future__ import annotations

from .extensions import converters  # noqa: F401  # isort:skip
from .queries import *  # noqa: F403  # isort:skip

from .types.allocated_time_slot.mutations import AllocatedTimeSlotCreateMutation, AllocatedTimeSlotDeleteMutation
from .types.application.mutations import (
    ApplicationCancelMutation,
    ApplicationCreateMutation,
    ApplicationSendMutation,
    ApplicationUpdateMutation,
    ApplicationWorkingMemoMutation,
    RejectAllApplicationOptionsMutation,
    RestoreAllApplicationOptionsMutation,
)
from .types.application_round.mutation import SetApplicationRoundHandledMutation, SetApplicationRoundResultsSentMutation
from .types.application_section.mutations import (
    ApplicationSectionCreateMutation,
    ApplicationSectionDeleteMutation,
    ApplicationSectionReservationCancellationMutation,
    ApplicationSectionUpdateMutation,
    RejectAllSectionOptionsMutation,
    RestoreAllSectionOptionsMutation,
)
from .types.banner_notification.mutations import (
    BannerNotificationCreateMutation,
    BannerNotificationDeleteMutation,
    BannerNotificationUpdateMutation,
)
from .types.equipment.mutations import EquipmentCreateMutation, EquipmentDeleteMutation, EquipmentUpdateMutation
from .types.equipment_category.mutations import (
    EquipmentCategoryCreateMutation,
    EquipmentCategoryDeleteMutation,
    EquipmentCategoryUpdateMutation,
)
from .types.intended_use.mutations import IntendedUseCreateMutation, IntendedUseUpdateMutation
from .types.reservation.mutations import (
    ReservationAdjustTimeMutation,
    ReservationApproveMutation,
    ReservationCancellationMutation,
    ReservationConfirmMutation,
    ReservationCreateMutation,
    ReservationDeleteMutation,
    ReservationDeleteTentativeMutation,
    ReservationDenyMutation,
    ReservationRefundMutation,
    ReservationRequiresHandlingMutation,
    ReservationStaffAdjustTimeMutation,
    ReservationStaffChangeAccessCodeMutation,
    ReservationStaffCreateMutation,
    ReservationStaffModifyMutation,
    ReservationStaffRepairAccessCodeMutation,
    ReservationUpdateMutation,
    ReservationWorkingMemoMutation,
)
from .types.reservation_series.mutations import (
    ReservationSeriesAddMutation,
    ReservationSeriesChangeAccessCodeMutation,
    ReservationSeriesCreateMutation,
    ReservationSeriesDenyMutation,
    ReservationSeriesRepairAccessCodeMutation,
    ReservationSeriesRescheduleMutation,
    ReservationSeriesUpdateMutation,
)
from .types.reservation_unit.mutations import (
    ReservationUnitArchiveMutation,
    ReservationUnitCreateMutation,
    ReservationUnitUpdateMutation,
)
from .types.reservation_unit_image.mutations import (
    ReservationUnitImageCreateMutation,
    ReservationUnitImageDeleteMutation,
    ReservationUnitImageUpdateMutation,
)
from .types.reservation_unit_option.mutations import ReservationUnitOptionUpdateMutation
from .types.resource.mutations import ResourceCreateMutation, ResourceDeleteMutation, ResourceUpdateMutation
from .types.space.mutations import SpaceCreateMutation, SpaceDeleteMutation, SpaceUpdateMutation
from .types.unit.mutations import UnitUpdateMutation
from .types.user.mutations import CurrentUserUpdateMutation, UserStaffUpdateMutation

__all__ = [
    "AllocatedTimeSlotCreateMutation",
    "AllocatedTimeSlotDeleteMutation",
    "ApplicationCancelMutation",
    "ApplicationCreateMutation",
    "ApplicationSectionCreateMutation",
    "ApplicationSectionDeleteMutation",
    "ApplicationSectionReservationCancellationMutation",
    "ApplicationSectionUpdateMutation",
    "ApplicationSendMutation",
    "ApplicationUpdateMutation",
    "ApplicationWorkingMemoMutation",
    "BannerNotificationCreateMutation",
    "BannerNotificationDeleteMutation",
    "BannerNotificationUpdateMutation",
    "CurrentUserUpdateMutation",
    "EquipmentCategoryCreateMutation",
    "EquipmentCategoryDeleteMutation",
    "EquipmentCategoryUpdateMutation",
    "EquipmentCreateMutation",
    "EquipmentDeleteMutation",
    "EquipmentUpdateMutation",
    "IntendedUseCreateMutation",
    "IntendedUseUpdateMutation",
    "RejectAllApplicationOptionsMutation",
    "RejectAllSectionOptionsMutation",
    "ReservationAdjustTimeMutation",
    "ReservationApproveMutation",
    "ReservationCancellationMutation",
    "ReservationConfirmMutation",
    "ReservationCreateMutation",
    "ReservationDeleteMutation",
    "ReservationDeleteTentativeMutation",
    "ReservationDenyMutation",
    "ReservationRefundMutation",
    "ReservationRequiresHandlingMutation",
    "ReservationSeriesAddMutation",
    "ReservationSeriesChangeAccessCodeMutation",
    "ReservationSeriesCreateMutation",
    "ReservationSeriesDenyMutation",
    "ReservationSeriesRepairAccessCodeMutation",
    "ReservationSeriesRescheduleMutation",
    "ReservationSeriesUpdateMutation",
    "ReservationStaffAdjustTimeMutation",
    "ReservationStaffChangeAccessCodeMutation",
    "ReservationStaffCreateMutation",
    "ReservationStaffModifyMutation",
    "ReservationStaffRepairAccessCodeMutation",
    "ReservationUnitArchiveMutation",
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
    "SetApplicationRoundResultsSentMutation",
    "SpaceCreateMutation",
    "SpaceDeleteMutation",
    "SpaceUpdateMutation",
    "UnitUpdateMutation",
    "UserStaffUpdateMutation",
]
