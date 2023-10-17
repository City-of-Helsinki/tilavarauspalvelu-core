from api.graphql.extensions.base_mutations import UpdateAuthMutation
from api.graphql.types.application_event_schedule.permissions import ApplicationEventScheduleAllocationPermission
from api.graphql.types.application_event_schedule.serializers import (
    ApplicationEventScheduleApproveSerializer,
    ApplicationEventScheduleDeclineSerializer,
)


class ApplicationEventScheduleApproveMutation(UpdateAuthMutation):
    class Meta:
        serializer_class = ApplicationEventScheduleApproveSerializer
        permission_classes = (ApplicationEventScheduleAllocationPermission,)


class ApplicationEventScheduleDeclineMutation(UpdateAuthMutation):
    class Meta:
        serializer_class = ApplicationEventScheduleDeclineSerializer
        permission_classes = (ApplicationEventScheduleAllocationPermission,)
