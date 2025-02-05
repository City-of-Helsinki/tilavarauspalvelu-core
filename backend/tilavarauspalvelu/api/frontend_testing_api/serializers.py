from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.contrib.auth import login
from django.contrib.auth.hashers import make_password
from rest_framework import serializers

from tilavarauspalvelu.api.frontend_testing_api.helpers import set_current_datetime
from tilavarauspalvelu.enums import ReservationNotification, UserRoleChoice
from tilavarauspalvelu.models import Unit

from tests.factories import GeneralRoleFactory, UnitRoleFactory, UserFactory

if TYPE_CHECKING:
    import datetime

    from tilavarauspalvelu.models import User


class TestingBaseSerializer(serializers.Serializer):
    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        """Validate that only allowed parameters are passed"""
        for attr in attrs:
            if attr not in self.fields:
                msg = f"Invalid parameter: {attr}"
                raise serializers.ValidationError(msg)

        return attrs


class TestingUserSerializer(TestingBaseSerializer):
    role = serializers.ChoiceField(choices=UserRoleChoice, default=UserRoleChoice.ADMIN, required=False)
    is_unit_role = serializers.BooleanField(default=False, required=False)  # Unit or General role

    def create(self, validated_data: dict[str, Any] | None) -> User:
        return UserFactory.create(
            date_of_birth="1901-01-01",
            department_name=None,
            email="testuser@varaamo.fi",
            first_name="Varaamo",
            last_name=f"{validated_data['role']}" if validated_data else "NORMAL",
            is_staff=True,
            is_superuser=False,
            password=make_password(None),
            profile_id="UHJvZmlsZU5vZGU6MjBhNWE1MjItOTQ2NS00YTUzLTkxZDYtZDJiYjA4MWFiMzQ0",
            reservation_notification=ReservationNotification.ONLY_HANDLING_REQUIRED,
            tvp_uuid="65f8f884-c8a7-4e7e-b8bd-d9533b933d67",
            username="u-wou6xfojifd6bhbqv6ctjhz35u",
            uuid="b3a9eb95-c941-47e0-9c30-af85349f3bed",
        )

    def create_permissions(self, validated_data: dict[str, Any]) -> None:
        user = self.context["user"]
        user_role = validated_data["role"]
        if validated_data["is_unit_role"]:
            UnitRoleFactory.create(
                user=user,
                role=user_role,
                assigner=user,
                units=Unit.objects.all(),
                unit_groups=[],
            )
        else:
            GeneralRoleFactory.create(
                user=user,
                role=user_role,
                assigner=None,
            )


class TestingRootSerializer(TestingBaseSerializer):
    current_datetime = serializers.DateTimeField(required=False)
    user = TestingUserSerializer(required=False)
    params = TestingBaseSerializer()

    def create(self, validated_data: dict[str, Any]) -> Any:
        # Setup current datetime
        current_datetime: datetime.datetime | None = validated_data.get("current_datetime")
        if current_datetime is not None:
            set_current_datetime(current_datetime)

        # Create the user
        user_serializer: TestingUserSerializer = self.fields["user"]
        user_data: dict[str, Any] = validated_data.get("user")
        self.context["user"] = user_serializer.create(user_data)  # Save user to context for later use

        # Create data with the given params
        params_serializer: TestingBaseSerializer = self.fields["params"]
        instance = params_serializer.create(validated_data.get("params"))

        # If user data is provided, create permissions and login the user
        if user_data:
            login(self.context["request"], self.context["user"], backend="config.auth.ProxyModelBackend")
            user_serializer.create_permissions(user_data)

        return instance
