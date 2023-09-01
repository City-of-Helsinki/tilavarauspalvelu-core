from assertpy import assert_that
from django.contrib.auth import get_user_model
from django.test.testcases import TestCase

from permissions.models import (
    GeneralRole,
    GeneralRoleChoice,
    ServiceSectorRole,
    ServiceSectorRoleChoice,
    UnitRole,
    UnitRoleChoice,
)
from tests.factories import ServiceSectorFactory


class UserTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = get_user_model().objects.create(
            username="user",
            first_name="Test",
            last_name="User",
            email="test.user@example.com",
        )

    def test_user_without_roles_has_no_staff_permissions(self):
        assert_that(self.user.has_staff_permissions).is_false()

    def test_superuser_has_staff_permissions(self):
        self.user.is_superuser = True
        self.user.save()

        assert_that(self.user.has_staff_permissions).is_true()

    def test_user_with_general_role_has_staff_permissions(self):
        role = GeneralRoleChoice.objects.create(code="General Role")
        GeneralRole.objects.create(role=role, user=self.user)

        assert_that(self.user.has_staff_permissions).is_true()

    def test_user_with_service_sector_role_has_staff_permissions(self):
        sector = ServiceSectorFactory(name="Test Sector")
        role = ServiceSectorRoleChoice.objects.create(code="Service Sector Role")
        ServiceSectorRole.objects.create(role=role, user=self.user, service_sector=sector)

        assert_that(self.user.has_staff_permissions).is_true()

    def test_user_with_unit_role_has_staff_permissions(self):
        role_choice = UnitRoleChoice.objects.create(code="Service Sector Role")
        UnitRole.objects.create(role=role_choice, user=self.user)

        assert_that(self.user.has_staff_permissions).is_true()
