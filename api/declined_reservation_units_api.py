from django.conf import settings
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, serializers, viewsets

from applications.models import ApplicationEvent
from permissions.api_permissions.drf_permissions import ApplicationEventPermission
from reservation_units.models import ReservationUnit


class DeclinedReservationUnitSerializer(serializers.ModelSerializer):

    declined_reservation_unit_ids = serializers.PrimaryKeyRelatedField(
        queryset=ReservationUnit.objects.all(),
        source="declined_reservation_units",
        many=True,
    )

    class Meta:
        model = ApplicationEvent
        fields = [
            "id",
            "declined_reservation_unit_ids",
        ]


@extend_schema(description="Declined reservation units for application event.")
class DeclinedReservationUnitViewSet(viewsets.ModelViewSet):
    serializer_class = DeclinedReservationUnitSerializer
    queryset = ApplicationEvent.objects.all()
    http_method_names = ["put", "get"]
    permission_classes = (
        [ApplicationEventPermission]
        if not settings.TMP_PERMISSIONS_DISABLED
        else [permissions.AllowAny]
    )
