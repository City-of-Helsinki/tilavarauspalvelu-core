import json

import snapshottest
from assertpy import assert_that
from django.contrib.auth import get_user_model
from graphene_django.utils import GraphQLTestCase

from permissions.models import (
    GeneralRole,
    GeneralRoleChoice,
    ServiceSectorRole,
    ServiceSectorRoleChoice,
    UnitRole,
    UnitRoleChoice,
)
from spaces.tests.factories import ServiceSectorFactory, UnitFactory, UnitGroupFactory
from users.models import ReservationNotification, User


class UserTestCaseBase(GraphQLTestCase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
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
        GeneralRole.objects.create(role=general_role_choice, user=cls.non_staff_user)


class UserQueryTestCase(UserTestCaseBase):
    def make_user_query(self):
        return self.query(
            """
            query {
                currentUser {
                    totalCount
                    edges {
                        node {
                            username
                            firstName
                            lastName
                            email
                            isSuperuser
                            reservationNotification
                        }
                    }
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
        assert_that(self.non_staff_user.is_staff).is_false()
        self.client.force_login(self.non_staff_user)
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
                    totalCount
                    edges {
                        node {
                            username
                            generalRoles {
                                role {
                                    code
                                    verboseName
                                }
                            }
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

        self.client.force_login(self.staff_user)
        response = self.query(
            """
            query {
                currentUser {
                    totalCount
                    edges {
                        node {
                            username
                            serviceSectorRoles {
                                role {
                                    code
                                    verboseName
                                }
                                serviceSector {
                                    nameFi
                                }
                            }
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
        unit_role = UnitRoleChoice.objects.create(
            code="TEST_UNIT_ROLE", verbose_name="Test Unit Role"
        )

        role = UnitRole.objects.create(user=self.staff_user, role=unit_role)
        role.unit.set([unit])
        role.unit_group.set([unit_group])

        self.client.force_login(self.staff_user)
        response = self.query(
            """
            query {
                currentUser {
                    totalCount
                    edges {
                        node {
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
                            }
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
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "No permission to mutate"
        )
        assert_that(content["data"]["updateUser"]).is_none()

    def test_update_fails_when_user_tries_to_update_other_user(self):
        self.client.force_login(self.super_user)
        data = {"pk": self.staff_user.pk + 1, "reservationNotification": "NONE"}
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "No permission to mutate"
        )
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
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "No permission to mutate"
        )
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
        assert_that(content["data"]["updateUser"]["pk"]).is_equal_to(
            self.non_staff_user.pk
        )

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
