from rest_framework import serializers, viewsets

from applications.models import ApplicationRound, ApplicationRoundBasket
from permissions.api_permissions import ApplicationRoundPermission
from reservation_units.models import Purpose, ReservationUnit
from reservations.models import AgeGroup
from spaces.models import ServiceSector


class ApplicationRoundBasketSerializer(serializers.ModelSerializer):
    purpose_id = serializers.PrimaryKeyRelatedField(
        queryset=Purpose.objects.all(), source="purpose"
    )
    age_group_ids = serializers.PrimaryKeyRelatedField(
        queryset=AgeGroup.objects.all(), source="age_groups", many=True
    )

    class Meta:
        model = ApplicationRoundBasket
        fields = [
            "id",
            "name",
            "purpose_id",
            "must_be_main_purpose_of_applicant",
            "customer_type",
            "age_group_ids",
            "home_city",
            "allocation_percentage",
            "order_number",
        ]
        extra_kwargs = {
            "name": {
                "help_text": "Name that describes this basket.",
            },
            "purpose_id": {
                "help_text": "Id of the purpose for this basket.",
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
    status = serializers.CharField(help_text="Status of this application round")
    service_sector_id = serializers.PrimaryKeyRelatedField(
        queryset=ServiceSector.objects.all(), source="service_sector"
    )

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
            "application_round_baskets",
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
            "application_round_baskets": {
                "help_text": "List of allocation 'basket' objects which determines priority of reservation allocation.",
            },
        }

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

    def validate(self, data):
        baskets = data["application_round_baskets"]
        basket_order_numbers = list(map(lambda basket: basket["order_number"], baskets))
        if len(basket_order_numbers) > len(set(basket_order_numbers)):
            raise serializers.ValidationError("Order numbers should be unique")

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
    permission_classes = [ApplicationRoundPermission]
