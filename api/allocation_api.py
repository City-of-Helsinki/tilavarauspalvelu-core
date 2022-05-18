import threading

from django.conf import settings
from django.db.models import Prefetch
from django.utils.datetime_safe import datetime
from rest_framework import permissions, serializers, viewsets
from rest_framework.exceptions import ValidationError

from allocation.allocation_runner import start_allocation
from allocation.models import AllocationRequest
from api.applications_api.serializers import NullableCurrentUserDefault
from applications.models import (
    ApplicationRound,
    ApplicationRoundBasket,
    ApplicationRoundStatus,
)
from permissions.api_permissions.drf_permissions import AllocationRequestPermission


class AllocationInProcessException(Exception):
    pass


class UnsuitableStatusForAllocationException(Exception):
    pass


class AllocationRequestSerializer(serializers.ModelSerializer):
    start_date = serializers.DateTimeField(read_only=True)
    end_date = serializers.DateTimeField(read_only=True)
    completed = serializers.BooleanField(read_only=True)
    user = serializers.HiddenField(default=NullableCurrentUserDefault())
    application_round_id = serializers.IntegerField(required=True)
    application_round_basket_ids = serializers.PrimaryKeyRelatedField(
        queryset=ApplicationRoundBasket.objects.all(),
        source="application_round_baskets",
        many=True,
    )

    class Meta:
        model = AllocationRequest
        fields = [
            "id",
            "application_round_id",
            "start_date",
            "end_date",
            "completed",
            "user",
            "application_round_basket_ids",
        ]

    def create(self, validated_data):
        validated_data["start_date"] = datetime.now()

        application_round_id = validated_data["application_round_id"]

        application_round = ApplicationRound.objects.get(pk=application_round_id)

        if application_round.status not in [
            ApplicationRoundStatus.REVIEW_DONE,
            ApplicationRoundStatus.ALLOCATED,
        ]:
            raise ValidationError(
                f"Can only allocate application rounds when "
                f"{ApplicationRoundStatus.REVIEW_DONE} or {ApplicationRoundStatus.ALLOCATED}"
            )

        matching_requests = AllocationRequest.objects.filter(
            application_round__id=application_round_id, end_date=None
        )

        if len(matching_requests) > 0:
            raise ValidationError(
                f"Allocation in process for application round {application_round_id}."
            )

        allocation_request = super().create(validated_data)
        t = threading.Thread(
            target=start_allocation, args=[allocation_request], daemon=True
        )
        t.start()
        return allocation_request

    def update(self, instance, validated_data):
        return AllocationRequest.objects.get(pk=instance.id)


class AllocationRequestViewSet(viewsets.ModelViewSet):
    queryset = AllocationRequest.objects.all().prefetch_related(
        Prefetch(
            "application_round_baskets",
            queryset=ApplicationRoundBasket.objects.all().only("id"),
        )
    )
    serializer_class = AllocationRequestSerializer
    permission_classes = (
        [AllocationRequestPermission]
        if not settings.TMP_PERMISSIONS_DISABLED
        else [permissions.AllowAny]
    )
