import datetime
import json

import snapshottest
from django.contrib.auth import get_user_model
from django.test import override_settings
from django.utils.timezone import get_default_timezone

from api.graphql.tests.base import GrapheneTestCaseBase
from permissions.models import (
    GeneralRole,
    GeneralRoleChoice,
    GeneralRolePermission,
    UnitRolePermission,
)
from users.models import PersonalInfoViewLog, ReservationNotification, User


class UserTestCaseBase(GrapheneTestCaseBase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.super_user = get_user_model().objects.create(
            username="super_admin",
            first_name="Super",
            last_name="Admin",
            email="super.admin@foo.com",
            is_staff=True,
            is_superuser=True,
            reservation_notification=ReservationNotification.ALL,
        )

        cls.staff_user = get_user_model().objects.create(
            username="staff_admin",
            first_name="Staff",
            last_name="Admin",
            email="staff.admin@foo.com",
            is_staff=True,
            reservation_notification=ReservationNotification.ONLY_HANDLING_REQUIRED,
        )

        cls.non_staff_user = get_user_model().objects.create(
            username="non_staff_admin",
            first_name="Non-Staff",
            last_name="Admin",
            email="non-staff.admin@foo.com",
            is_staff=False,
            reservation_notification="only_handling_required",
        )

        general_role_choice = GeneralRoleChoice.objects.create(code="general_role")
        GeneralRole.objects.create(role=general_role_choice, user=cls.staff_user)
        GeneralRolePermission.objects.create(role=general_role_choice, permission="can_do_stuff")
        GeneralRole.objects.create(role=general_role_choice, user=cls.non_staff_user)


class UpdateUserTestCase(UserTestCaseBase):
    def get_update_query(self):
        return """
        mutation updateUser($input: UserUpdateMutationInput!) {
            updateUser(input: $input) {
                pk
                errors {
                  field
                  messages
                }
            }
        }
        """

    def test_update_fails_when_user_is_not_logged_in(self):
        data = {"pk": 1, "reservationNotification": "NONE"}
        response = self.query(self.get_update_query(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is not None
        assert content.get("errors")[0]["message"] == "No permission to mutate"
        assert content["data"]["updateUser"] is None

    def test_update_fails_when_user_tries_to_update_other_user(self):
        self.client.force_login(self.super_user)
        data = {"pk": self.staff_user.pk + 1, "reservationNotification": "NONE"}
        response = self.query(self.get_update_query(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is not None
        assert content.get("errors")[0]["message"] == "No permission to mutate"
        assert content["data"]["updateUser"] is None

    def test_update_fails_when_user_has_no_roles(self):
        no_roles_user = get_user_model().objects.create(
            username="normal_user",
            first_name="Normal",
            last_name="user",
            email="normal.user@foo.com",
            is_staff=False,
            is_superuser=False,
            reservation_notification=ReservationNotification.NONE,
        )
        self.client.force_login(no_roles_user)
        data = {"pk": no_roles_user.pk, "reservationNotification": "ALL"}
        response = self.query(self.get_update_query(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is not None
        assert content.get("errors")[0]["message"] == "No permission to mutate"
        assert content["data"]["updateUser"] is None

    def test_update_by_staff_with_roles_succeeds(self):
        self.client.force_login(self.staff_user)
        data = {"pk": self.staff_user.pk, "reservationNotification": "NONE"}
        response = self.query(self.get_update_query(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content["data"]["updateUser"]["errors"] is None
        assert content["data"]["updateUser"]["pk"] == self.staff_user.pk

        updated_user = User.objects.get(pk=self.staff_user.pk)
        assert updated_user.reservation_notification == "none"

    def test_update_by_non_staff_with_roles_succeeds(self):
        self.client.force_login(self.non_staff_user)
        data = {"pk": self.non_staff_user.pk, "reservationNotification": "NONE"}
        response = self.query(self.get_update_query(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content["data"]["updateUser"]["errors"] is None
        assert content["data"]["updateUser"]["pk"] == self.non_staff_user.pk

        updated_user = User.objects.get(pk=self.non_staff_user.pk)
        assert updated_user.reservation_notification == "none"

    def test_update_by_superuser_succeeds(self):
        self.client.force_login(self.super_user)
        data = {"pk": self.super_user.pk, "reservationNotification": "NONE"}
        response = self.query(self.get_update_query(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content["data"]["updateUser"]["errors"] is None
        assert content["data"]["updateUser"]["pk"] == self.super_user.pk

        updated_user = User.objects.get(pk=self.super_user.pk)
        assert updated_user.reservation_notification == "none"


class UsersQueryTestCase(UserTestCaseBase):
    def get_query(self, user):
        return (
            """
            query {
                user(pk: %i) {
                    username
                    firstName
                    lastName
                    email
                    isSuperuser
                    reservationNotification
                }
            }
            """
            % user.id
        )

    def test_general_admin_can_read_other(self):
        self.client.force_login(self.general_admin)
        response = self.query(self.get_query(self.non_staff_user))

        assert response.status_code == 200
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)

    def test_service_sector_admin_can_read_other(self):
        service_sector_admin = self.create_service_sector_admin()
        self.client.force_login(service_sector_admin)
        response = self.query(self.get_query(self.non_staff_user))

        assert response.status_code == 200
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)

    def test_unit_admin_can_read_other(self):
        unit_admin = self.create_unit_admin()
        self.client.force_login(unit_admin)
        response = self.query(self.get_query(self.non_staff_user))

        assert response.status_code == 200
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)

    def test_unit_admin_cant_read_permissions(self):
        unit_admin = self.create_unit_admin()
        UnitRolePermission.objects.filter(permission="can_view_users").delete()
        self.client.force_login(unit_admin)

        query = (
            """
            query {
                user(pk: %i) {
                    unitRoles { permissions { permission } }
                    serviceSectorRoles { permissions { permission } }
                    generalRoles { permissions { permission } }
                }
            }
            """
            % self.non_staff_user.id
        )

        response = self.query(query)

        assert response.status_code == 200
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)
        assert content["errors"] is not None

    def test_regular_user_cant_read_other(self):
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_query(self.non_staff_user))

        assert response.status_code == 200
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)

    def test_regular_user_cant_read_self(self):
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_query(self.regular_joe))

        assert response.status_code == 200
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)

    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_date_of_birth_read_is_logged(self):
        assert PersonalInfoViewLog.objects.count() == 0
        query = (
            """
                query {
                    user(pk: %i) {
                        username
                        firstName
                        lastName
                        email
                        isSuperuser
                        reservationNotification
                        dateOfBirth
                    }
                }
        """
            % self.regular_joe.id
        )
        self.client.force_login(self.general_admin)
        response = self.query(query)

        assert response.status_code == 200
        assert PersonalInfoViewLog.objects.count() == 1

        view_log = PersonalInfoViewLog.objects.first()
        assert view_log.user == self.regular_joe
        assert view_log.viewer_user == self.general_admin
        assert view_log.viewer_username == self.general_admin.username
        now = datetime.datetime.now(tz=get_default_timezone())
        assert now - datetime.timedelta(seconds=5) <= view_log.access_time <= now  # Within the last 5 seconds

        assert view_log.field == "User.date_of_birth"
