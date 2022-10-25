import datetime
from typing import Dict, List, Optional

import snapshottest
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils.timezone import get_default_timezone

from api.graphql.tests.base import GrapheneTestCaseBase
from opening_hours.enums import State
from opening_hours.hours import TimeElement
from permissions.models import UnitRole, UnitRoleChoice, UnitRolePermission
from reservation_units.models import ReservationUnit
from reservation_units.tests.factories import (
    ReservationUnitFactory,
    ReservationUnitTypeFactory,
)
from reservations.models import ReservationMetadataField, ReservationMetadataSet
from reservations.tests.factories import ReservationPurposeFactory
from spaces.tests.factories import (
    ServiceSectorFactory,
    SpaceFactory,
    UnitFactory,
    UnitGroupFactory,
)

DEFAULT_TIMEZONE = get_default_timezone()


class ReservationTestCaseBase(GrapheneTestCaseBase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.space = SpaceFactory()
        cls.unit = UnitFactory(name="unit")
        cls.service_sector = ServiceSectorFactory(units=[cls.unit])
        cls.reservation_unit_type = ReservationUnitTypeFactory(
            name="reservation_unit_type"
        )
        cls.reservation_unit = ReservationUnitFactory(
            spaces=[cls.space],
            unit=cls.unit,
            name="resunit",
            reservation_start_interval=ReservationUnit.RESERVATION_START_INTERVAL_15_MINUTES,
            reservation_unit_type=cls.reservation_unit_type,
        )
        cls.purpose = ReservationPurposeFactory(name="purpose")

        # Setup for reservation notification tests
        cls.reservation_handler = get_user_model().objects.create(
            username="res_handler",
            first_name="Reservation",
            last_name="Handler",
            email="reservation.handler@foo.com",
            reservation_notification="ALL",
        )
        cls.unit_role_choice = UnitRoleChoice.objects.create(code="reservation_manager")

        cls.unit_role = UnitRole.objects.create(
            role=cls.unit_role_choice, user=cls.reservation_handler
        )
        cls.unit_role.unit.add(cls.unit)

        UnitRolePermission.objects.create(
            role=cls.unit_role_choice, permission="can_manage_reservations"
        )

        cls.reservation_viewer = get_user_model().objects.create(
            username="res_viewer",
            first_name="Reservation",
            last_name="Viewer",
            email="reservation.viewer@foo.com",
            reservation_notification="ALL",
        )
        unit_group_viewer_role_choice = UnitRoleChoice.objects.get(code="viewer")

        cls.unit_group_role = UnitRole.objects.create(
            role=unit_group_viewer_role_choice, user=cls.reservation_viewer
        )

        cls.unit_group = UnitGroupFactory(units=[cls.unit])
        cls.unit_group_role.unit_group.add(cls.unit_group)

        UnitRolePermission.objects.create(
            role=unit_group_viewer_role_choice, permission="can_view_reservations"
        )

    def get_mocked_opening_hours(
        self,
        reservation_unit: Optional[ReservationUnit] = None,
        date: Optional[datetime.date] = None,
        start_hour: int = 6,
        end_hour: int = 22,
    ) -> List[Dict]:
        if not reservation_unit:
            reservation_unit = self.reservation_unit
        if not date:
            date = datetime.date.today()

        resource_id = f"{settings.HAUKI_ORIGIN_ID}:{reservation_unit.uuid}"
        origin_id = str(reservation_unit.uuid)

        return [
            self._get_single_opening_hour_block(
                resource_id, origin_id, date, start_hour, end_hour
            )
        ]

    def _get_single_opening_hour_block(
        self, resource_id, origin_id, date, start_hour, end_hour
    ):
        return {
            "timezone": DEFAULT_TIMEZONE,
            "resource_id": resource_id,
            "origin_id": origin_id,
            "date": date,
            "times": [
                TimeElement(
                    start_time=datetime.time(hour=start_hour),
                    end_time=datetime.time(hour=end_hour),
                    end_time_on_next_day=False,
                    resource_state=State.WITH_RESERVATION,
                    periods=[],
                ),
            ],
        }

    def _create_metadata_set(self):
        supported_fields = ReservationMetadataField.objects.filter(
            field_name__in=[
                "reservee_first_name",
                "reservee_last_name",
                "reservee_phone",
                "home_city",
                "age_group",
            ]
        )
        required_fields = ReservationMetadataField.objects.filter(
            field_name__in=[
                "reservee_first_name",
                "reservee_last_name",
                "home_city",
                "age_group",
            ]
        )
        metadata_set = ReservationMetadataSet.objects.create(name="Test form")
        metadata_set.supported_fields.set(supported_fields)
        metadata_set.required_fields.set(required_fields)
        return metadata_set
