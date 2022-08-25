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
from users.models import ReservationNotification


class UserQueryTestCaseBase(GraphQLTestCase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
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


class UserQueryTestCase(UserQueryTestCaseBase):
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
        general_role = GeneralRoleChoice.objects.create(
            code="TEST_GENERAL_ROLE", verbose_name="Test General Role"
        )

        GeneralRole.objects.create(user=self.staff_user, role=general_role)

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
