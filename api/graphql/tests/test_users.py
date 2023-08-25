import datetime
import json

import snapshottest
from assertpy import assert_that
from django.contrib.auth import get_user_model
from django.test import override_settings
from django.utils.timezone import get_default_timezone

from api.graphql.tests.base import GrapheneTestCaseBase
from permissions.models import (
    GeneralRole,
    GeneralRoleChoice,
    GeneralRolePermission,
    ServiceSectorRole,
    ServiceSectorRoleChoice,
    ServiceSectorRolePermission,
    UnitRole,
    UnitRoleChoice,
    UnitRolePermission,
)
from spaces.tests.factories import ServiceSectorFactory, UnitFactory, UnitGroupFactory
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


class UserQueryTestCase(UserTestCaseBase):
    def make_user_query(self):
        return self.query(
            """
            query {
                currentUser {
                    username
                    firstName
                    lastName
                    email
                    isSuperuser
                    reservationNotification
                }
            }
            """
        )

    def test_show_nothing_when_user_is_not_authenticated(self):
        response = self.make_user_query()

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)

    def test_show_reservation_notification_when_user_is_staff(self):
        self.client.force_login(self.staff_user)
        response = self.make_user_query()

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)

    def test_hide_reservation_notification_when_user_is_not_staff(self):
        assert_that(self.regular_joe.has_staff_permissions).is_false()
        self.client.force_login(self.regular_joe)
        response = self.make_user_query()

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)

    def test_show_general_roles(self):
        self.client.force_login(self.staff_user)
        response = self.query(
            """
            query {
                currentUser {
                    username
                    generalRoles {
                        role {
                            code
                            verboseName
                        }
                        permissions {
                            permission
                        }
                    }
                }
            }
            """
        )
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)

    def test_show_service_sector_roles(self):
        service_sector = ServiceSectorFactory(name="Test Service Sector")

        service_sector_role = ServiceSectorRoleChoice.objects.create(
            code="TEST_SERVICE_SECTOR_ROLE",
            verbose_name="Test Service Sector Role",
        )

        ServiceSectorRole.objects.create(
            user=self.staff_user,
            service_sector=service_sector,
            role=service_sector_role,
        )
        ServiceSectorRolePermission.objects.create(role=service_sector_role, permission="can_do_service_sector_things")

        self.client.force_login(self.staff_user)
        response = self.query(
            """
            query {
                currentUser {
                    username
                    serviceSectorRoles {
                        role {
                            code
                            verboseName
                        }
                        serviceSector {
                            nameFi
                        }
                        permissions {
                            permission
                        }
                    }
                }
            }
            """
        )

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)

    def test_show_unit_roles(self):
        unit = UnitFactory(name="Test Unit")
        unit_group = UnitGroupFactory(name="Test Unit Group", units=[unit])
        unit_role = UnitRoleChoice.objects.create(code="TEST_UNIT_ROLE", verbose_name="Test Unit Role")
        UnitRolePermission.objects.create(role=unit_role, permission="can_do_unit_things")

        role = UnitRole.objects.create(user=self.staff_user, role=unit_role)
        role.unit.set([unit])
        role.unit_group.set([unit_group])

        self.client.force_login(self.staff_user)
        response = self.query(
            """
            query {
                currentUser {
                    username
                    unitRoles {
                        role {
                            code
                            verboseName
                        }
                        units {
                            nameFi
                        }
                        unitGroups {
                            name
                            units {
                                nameFi
                            }
                        }
                        permissions {
                            permission
                        }
                    }
                }
            }
            """
        )

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)


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
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to("No permission to mutate")
        assert_that(content["data"]["updateUser"]).is_none()

    def test_update_fails_when_user_tries_to_update_other_user(self):
        self.client.force_login(self.super_user)
        data = {"pk": self.staff_user.pk + 1, "reservationNotification": "NONE"}
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to("No permission to mutate")
        assert_that(content["data"]["updateUser"]).is_none()

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
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to("No permission to mutate")
        assert_that(content["data"]["updateUser"]).is_none()

    def test_update_by_staff_with_roles_succeeds(self):
        self.client.force_login(self.staff_user)
        data = {"pk": self.staff_user.pk, "reservationNotification": "NONE"}
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content["data"]["updateUser"]["errors"]).is_none()
        assert_that(content["data"]["updateUser"]["pk"]).is_equal_to(self.staff_user.pk)

        updated_user = User.objects.get(pk=self.staff_user.pk)
        assert_that(updated_user.reservation_notification).is_equal_to("none")

    def test_update_by_non_staff_with_roles_succeeds(self):
        self.client.force_login(self.non_staff_user)
        data = {"pk": self.non_staff_user.pk, "reservationNotification": "NONE"}
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content["data"]["updateUser"]["errors"]).is_none()
        assert_that(content["data"]["updateUser"]["pk"]).is_equal_to(self.non_staff_user.pk)

        updated_user = User.objects.get(pk=self.non_staff_user.pk)
        assert_that(updated_user.reservation_notification).is_equal_to("none")

    def test_update_by_superuser_succeeds(self):
        self.client.force_login(self.super_user)
        data = {"pk": self.super_user.pk, "reservationNotification": "NONE"}
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content["data"]["updateUser"]["errors"]).is_none()
        assert_that(content["data"]["updateUser"]["pk"]).is_equal_to(self.super_user.pk)

        updated_user = User.objects.get(pk=self.super_user.pk)
        assert_that(updated_user.reservation_notification).is_equal_to("none")


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

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)

    def test_service_sector_admin_can_read_other(self):
        service_sector_admin = self.create_service_sector_admin()
        self.client.force_login(service_sector_admin)
        response = self.query(self.get_query(self.non_staff_user))

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)

    def test_unit_admin_can_read_other(self):
        unit_admin = self.create_unit_admin()
        self.client.force_login(unit_admin)
        response = self.query(self.get_query(self.non_staff_user))

        assert_that(response.status_code).is_equal_to(200)
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

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)
        assert_that(content["errors"]).is_not_none()

    def test_regular_user_cant_read_other(self):
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_query(self.non_staff_user))

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)

    def test_regular_user_cant_read_self(self):
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_query(self.regular_joe))

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)

    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_date_of_birth_read_is_logged(self):
        assert_that(PersonalInfoViewLog.objects.count()).is_zero()
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

        assert_that(response.status_code).is_equal_to(200)
        assert_that(PersonalInfoViewLog.objects.count()).is_equal_to(1)

        view_log = PersonalInfoViewLog.objects.first()
        assert_that(view_log.user).is_equal_to(self.regular_joe)
        assert_that(view_log.viewer_user).is_equal_to(self.general_admin)
        assert_that(view_log.viewer_username).is_equal_to(self.general_admin.username)
        assert_that(view_log.access_time).is_close_to(
            datetime.datetime.now(tz=get_default_timezone()),
            datetime.timedelta(seconds=5),
        )
        assert_that(view_log.field).is_equal_to("User.date_of_birth")
