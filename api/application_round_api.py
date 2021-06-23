import logging

from django.conf import settings
from django.db.models import Sum
from rest_framework import permissions, serializers, viewsets

from applications.models import (
    ApplicationEventAggregateData,
    ApplicationRound,
    ApplicationRoundBasket,
    ApplicationRoundStatus,
    ApplicationStatus,
    City,
)
from permissions.api_permissions import ApplicationRoundPermission
from permissions.helpers import can_manage_service_sectors_application_rounds
from reservation_units.models import Purpose, ReservationUnit
from reservations.models import AgeGroup
from spaces.models import ServiceSector

logger = logging.getLogger(__name__)


class ApplicationRoundBasketSerializer(serializers.ModelSerializer):
    purpose_ids = serializers.PrimaryKeyRelatedField(
        queryset=Purpose.objects.all(), source="purposes", many=True
    )

    age_group_ids = serializers.PrimaryKeyRelatedField(
        queryset=AgeGroup.objects.all(), source="age_groups", many=True
    )

    home_city_id = serializers.PrimaryKeyRelatedField(
        queryset=City.objects.all(), source="home_city", required=False, allow_null=True
    )

    class Meta:
        model = ApplicationRoundBasket
        fields = [
            "id",
            "name",
            "purpose_ids",
            "must_be_main_purpose_of_applicant",
            "customer_type",
            "age_group_ids",
            "home_city_id",
            "allocation_percentage",
            "order_number",
        ]
        extra_kwargs = {
            "name": {
                "help_text": "Name that describes this basket.",
            },
            "purpose_ids": {
                "help_text": "List of ids of the purposes for this basket.",
            },
            "must_be_main_purpose_of_applicant": {
                "help_text": "A flag to determine if applicants main purpose must be "
                "same as this basket to be eligible.",
            },
            "customer_type": {
                "help_text": "Type of customers thats eligible for applying in this application round basket.",
            },
            "age_group_ids": {
                "help_text": "Ids of age groups that can be applied during this period for the basket.",
            },
            "home_city": {
                "help_text": "Home city of organisation thats eligible for applying in this application round basket.",
            },
            "allocation_percentage": {
                "help_text": "Percentage of allocation for the application round basket."
                " Sum of all baskets must be 100."
            },
        }


class ApplicationRoundSerializer(serializers.ModelSerializer):
    application_round_baskets = ApplicationRoundBasketSerializer(many=True)
    reservation_unit_ids = serializers.PrimaryKeyRelatedField(
        queryset=ReservationUnit.objects.all(), source="reservation_units", many=True
    )
    purpose_ids = serializers.PrimaryKeyRelatedField(
        queryset=Purpose.objects.all(), source="purposes", many=True
    )
    status = serializers.ChoiceField(
        help_text="Status of this application round",
        choices=ApplicationRoundStatus.get_statuses(),
    )
    status_timestamp = serializers.DateTimeField(read_only=True)
    service_sector_id = serializers.PrimaryKeyRelatedField(
        queryset=ServiceSector.objects.all(), source="service_sector"
    )

    allocating = serializers.BooleanField(read_only=True)

    is_admin = serializers.SerializerMethodField()

    aggregated_data = serializers.SerializerMethodField()

    approved_by = serializers.SerializerMethodField()

    applications_sent = serializers.SerializerMethodField()

    class Meta:
        model = ApplicationRound
        fields = [
            "id",
            "name",
            "reservation_unit_ids",
            "application_period_begin",
            "application_period_end",
            "reservation_period_begin",
            "reservation_period_end",
            "public_display_begin",
            "public_display_end",
            "purpose_ids",
            "service_sector_id",
            "status",
            "status_timestamp",
            "application_round_baskets",
            "allocating",
            "criteria",
            "is_admin",
            "aggregated_data",
            "approved_by",
            "applications_sent",
        ]
        extra_kwargs = {
            "name": {
                "help_text": "Name that describes this event.",
            },
            "reservation_unit_ids": {
                "help_text": "Ids of reservation units that can be applied during this period.",
            },
            "application_period_begin": {
                "help_text": "Begin date and time of the period when applications can be sent.",
            },
            "application_period_end": {
                "help_text": "End date and time of the period when applications can be sent.",
            },
            "reservation_period_begin": {
                "help_text": "Begin date and time of the period where applied reservation are allocated.",
            },
            "reservation_period_end": {
                "help_text": "End date and time of the period where applied reservation are allocated.",
            },
            "public_display_begin": {
                "help_text": "Begin date when application round is visible to public.",
            },
            "public_display_end": {
                "help_text": "End date when application round is visible to public.",
            },
            "purpose_ids": {
                "help_text": "Ids of purposes that are allowed for events applied for this application period.",
            },
            "service_sector_id": {
                "help_text": "Id of the service sector of the application round.",
            },
            "status": {
                "help_text": "Status of the application round.",
            },
            "status_timestamp": {
                "help_text": "Timestamp of the status of the application round.",
            },
            "application_round_baskets": {
                "help_text": "List of allocation 'basket' objects which determines priority of reservation allocation.",
            },
            "is_admin": {
                "help_text": "Whether the current user can administer the application round or not.",
            },
            "approved_by": {
                "help_text": "Person name who approved this application round."
            },
        }

    def _get_allocation_result_summary(self, instance):
        events_count = (
            ApplicationEventAggregateData.objects.filter(
                application_event__application__application_round=instance,
                name="allocation_results_reservations_total",
            )
            .distinct()
            .aggregate(events_count=Sum("value"))
        )
        duration_total = (
            ApplicationEventAggregateData.objects.filter(
                application_event__application__application_round=instance,
                name="allocation_results_duration_total",
            )
            .distinct()
            .aggregate(duration_total=Sum("value"))
        )

        return {
            "allocation_result_events_count": events_count.get("events_count", 0),
            "allocation_duration_total": duration_total.get("duration_total", 0),
        }

    def get_is_admin(self, obj):
        request = self.context["request"] if "request" in self.context else None
        request_user = (
            request.user if request and request.user.is_authenticated else None
        )

        if request_user is None:
            return False
        service_sector = obj.service_sector

        return can_manage_service_sectors_application_rounds(
            request_user, service_sector
        )

    def get_approved_by(self, instance):
        request = self.context.get("request", None)
        request_user = getattr(request, "user", None)
        if not request_user or not request_user.is_authenticated:
            return ""

        approved_status = instance.statuses.filter(
            status=ApplicationRoundStatus.APPROVED
        ).first()
        if not getattr(approved_status, "user", None):
            return ""

        return approved_status.user.get_full_name()

    def get_aggregated_data(self, instance):
        allocation_result_dict = self._get_allocation_result_summary(instance)
        allocation_result_dict.update(instance.aggregated_data_dict)
        return allocation_result_dict

    def get_applications_sent(self, instance: ApplicationRound):
        not_sent = instance.applications.filter(
            cached_latest_status__in=[
                ApplicationStatus.IN_REVIEW,
                ApplicationStatus.REVIEW_DONE,
            ]
        ).exists()
        return not not_sent

    def create(self, validated_data):
        request = self.context["request"] if "request" in self.context else None
        request_user = (
            request.user if request and request.user.is_authenticated else None
        )

        status = validated_data.pop("status")

        basket_data = validated_data.pop("application_round_baskets")

        application_round = super().create(validated_data)

        self.handle_baskets(
            application_round_instance=application_round, basket_data=basket_data
        )

        application_round.set_status(status, request_user)

        return application_round

    def update(self, instance, validated_data):
        if self.partial:
            return self.partial_update(instance, validated_data)

        request = self.context["request"] if "request" in self.context else None
        request_user = (
            request.user if request and request.user.is_authenticated else None
        )

        status = validated_data.pop("status")

        basket_data = validated_data.pop("application_round_baskets")

        self.handle_baskets(
            application_round_instance=instance, basket_data=basket_data
        )

        application_round = super().update(instance, validated_data)

        application_round.set_status(status, request_user)

        return application_round

    def partial_update(self, instance, validated_data):
        request = self.context["request"] if "request" in self.context else None
        request_user = (
            request.user if request and request.user.is_authenticated else None
        )
        status = validated_data.pop("status", None)
        if status:
            instance.set_status(status, request_user)
        instance = super().update(instance, validated_data)
        return instance

    def validate(self, data):
        baskets = data.get("application_round_baskets", None)
        if self.partial and not baskets:
            return data

        basket_order_numbers = list(map(lambda basket: basket["order_number"], baskets))
        if len(basket_order_numbers) > len(set(basket_order_numbers)):
            raise serializers.ValidationError("Order numbers should be unique")

        status = data.get("status", None)

        if (
            self.instance
            and self.instance.status == ApplicationRoundStatus.APPROVED
            and status != ApplicationRoundStatus.APPROVED
        ):
            raise serializers.ValidationError(
                "Cannot change status of APPROVED application round."
            )

        return data

    def handle_baskets(self, application_round_instance, basket_data):
        basket_ids = []
        for basket in basket_data:
            basket["application_round"] = application_round_instance
            if "id" not in basket or ["id"] is None:
                basket_ids.append(
                    ApplicationRoundBasketSerializer(data=basket)
                    .create(validated_data=basket)
                    .id
                )
            else:
                basket_ids.append(
                    ApplicationRoundBasketSerializer(data=basket)
                    .update(
                        instance=ApplicationRoundBasket.objects.get(pk=basket["id"]),
                        validated_data=basket,
                    )
                    .id
                )
        ApplicationRoundBasket.objects.filter(
            application_round=application_round_instance
        ).exclude(id__in=basket_ids).delete()


class ApplicationRoundViewSet(viewsets.ModelViewSet):
    queryset = ApplicationRound.objects.all()
    serializer_class = ApplicationRoundSerializer
    permission_classes = (
        [ApplicationRoundPermission]
        if not settings.TMP_PERMISSIONS_DISABLED
        else [permissions.AllowAny]
    )
