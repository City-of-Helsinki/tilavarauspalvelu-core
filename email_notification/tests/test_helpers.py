import pytest
from assertpy import assert_that
from django.test.testcases import TestCase

from email_notification.helpers import get_staff_notification_recipients
from permissions.models import UnitRole, UnitRoleChoice, UnitRolePermission
from reservation_units.tests.factories import ReservationUnitFactory
from reservations.tests.factories import ReservationFactory
from spaces.tests.factories import UnitFactory
from users.models import ReservationNotification, User


class GetNotificationRecipientsTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.manager1 = User.objects.create(
            email="first.user@test.com",
            first_name="First",
            last_name="User",
            reservation_notification=ReservationNotification.ALL,
        )
        cls.manager2 = User.objects.create(
            email="second.user@test.com",
            first_name="Second",
            last_name="User",
            reservation_notification=ReservationNotification.ONLY_HANDLING_REQUIRED,
        )
        cls.normal_user = User.objects.create(
            email="third.user@test.com",
            first_name="Third",
            last_name="User",
            reservation_notification=ReservationNotification.NONE,
        )

        cls.unit1 = UnitFactory(name="Test Unit 1")
        cls.unit2 = UnitFactory(name="Test Unit 2")

        cls.runit1 = ReservationUnitFactory(unit=cls.unit1)
        cls.runit2 = ReservationUnitFactory(unit=cls.unit2)

        cls.reservation = ReservationFactory(reservation_unit=[cls.runit1, cls.runit2])

        cls.unit_role_choice = UnitRoleChoice.objects.create(code="reservation_manager")

        cls.unit_role = UnitRole.objects.create(
            role=cls.unit_role_choice, user=cls.manager1
        )
        cls.unit_role.unit.add(cls.unit1)

        cls.unit_role2 = UnitRole.objects.create(
            role=cls.unit_role_choice, user=cls.manager2
        )
        cls.unit_role2.unit.add(cls.unit1)

        UnitRolePermission.objects.create(
            role=cls.unit_role_choice, permission="can_manage_reservations"
        )

    @pytest.mark.django_db
    def test_get_staff_get_notification_recipients(self):
        result = get_staff_notification_recipients(
            self.reservation,
            [
                ReservationNotification.ALL,
                ReservationNotification.ONLY_HANDLING_REQUIRED,
            ],
        )
        assert_that(result).contains(self.manager1.email, self.manager2.email)
        assert_that(result).does_not_contain(self.normal_user.email)

    @pytest.mark.django_db
    def test_get_staff_notification_recipients_matching_settings(self):
        result = get_staff_notification_recipients(
            self.reservation, [ReservationNotification.ONLY_HANDLING_REQUIRED]
        )
        assert_that(result).contains(self.manager2.email)
        assert_that(result).does_not_contain(
            self.manager1.email, self.normal_user.email
        )

    @pytest.mark.django_db
    def test_get_staff_notification_recipients_without_reservation_user(self):
        self.reservation.user = self.manager1
        self.reservation.save()

        result = get_staff_notification_recipients(
            self.reservation,
            [
                ReservationNotification.ONLY_HANDLING_REQUIRED,
                ReservationNotification.ALL,
            ],
        )
        assert_that(result).contains(self.manager2.email)
        assert_that(result).does_not_contain(
            self.manager1.email, self.normal_user.email
        )
