import datetime

import snapshottest
from django.contrib.auth import get_user_model
from django.utils.timezone import get_default_timezone

from api.graphql.tests.base import GrapheneTestCaseBase
from permissions.models import UnitRole, UnitRoleChoice, UnitRolePermission
from reservation_units.models import PaymentType, ReservationUnit
from reservations.models import ReservationMetadataField, ReservationMetadataSet
from tests.factories import (
    OriginHaukiResourceFactory,
    PaymentMerchantFactory,
    PaymentProductFactory,
    ReservableTimeSpanFactory,
    ReservationPurposeFactory,
    ReservationUnitFactory,
    ReservationUnitTypeFactory,
    ServiceSectorFactory,
    SpaceFactory,
    UnitFactory,
    UnitGroupFactory,
)

DEFAULT_TIMEZONE = get_default_timezone()


class ReservationTestCaseBase(GrapheneTestCaseBase, snapshottest.TestCase):
    reservation_unit: ReservationUnit

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.space = SpaceFactory()
        cls.unit = UnitFactory(name="unit")
        cls.service_sector = ServiceSectorFactory(units=[cls.unit])
        cls.reservation_unit_type = ReservationUnitTypeFactory(name="reservation_unit_type")
        cls.payment_merchant = PaymentMerchantFactory()
        cls.payment_product = PaymentProductFactory(merchant=cls.payment_merchant)
        cls.reservation_unit = ReservationUnitFactory(
            spaces=[cls.space],
            unit=cls.unit,
            name="resunit",
            reservation_start_interval=ReservationUnit.RESERVATION_START_INTERVAL_15_MINUTES,
            reservation_unit_type=cls.reservation_unit_type,
            payment_merchant=cls.payment_merchant,
            payment_product=cls.payment_product,
            origin_hauki_resource=OriginHaukiResourceFactory(id="999"),
        )
        cls.reservation_unit.payment_types.set([PaymentType.ON_SITE])

        ReservableTimeSpanFactory(
            resource=cls.reservation_unit.origin_hauki_resource,
            start_datetime=datetime.datetime.combine(
                datetime.date.today(), datetime.time(hour=6), tzinfo=DEFAULT_TIMEZONE
            ),
            end_datetime=datetime.datetime.combine(
                datetime.date.today(), datetime.time(hour=22), tzinfo=DEFAULT_TIMEZONE
            ),
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

        cls.unit_role = UnitRole.objects.create(role=cls.unit_role_choice, user=cls.reservation_handler)
        cls.unit_role.unit.add(cls.unit)

        UnitRolePermission.objects.create(role=cls.unit_role_choice, permission="can_manage_reservations")

        cls.reservation_viewer = get_user_model().objects.create(
            username="res_viewer",
            first_name="Reservation",
            last_name="Viewer",
            email="reservation.viewer@foo.com",
            reservation_notification="ALL",
        )
        unit_group_viewer_role_choice = UnitRoleChoice.objects.get(code="viewer")

        cls.unit_group_role = UnitRole.objects.create(role=unit_group_viewer_role_choice, user=cls.reservation_viewer)

        cls.unit_group = UnitGroupFactory(units=[cls.unit])
        cls.unit_group_role.unit_group.add(cls.unit_group)

        UnitRolePermission.objects.create(role=unit_group_viewer_role_choice, permission="can_view_reservations")

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
