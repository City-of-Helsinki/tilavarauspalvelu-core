import json

from assertpy import assert_that
from django.contrib.auth import get_user_model

from applications.models import Application
from applications.tests.factories import (
    ApplicationEventFactory,
    ApplicationFactory,
    EventReservationUnitFactory,
)
from permissions.models import (
    ServiceSectorRole,
    ServiceSectorRoleChoice,
    ServiceSectorRolePermission,
    UnitRole,
    UnitRoleChoice,
    UnitRolePermission,
)
from reservation_units.tests.factories import ReservationUnitFactory
from spaces.tests.factories import UnitGroupFactory

from .base import ApplicationTestCaseBase


class ApplicationsGraphQLPermissionsTestCase(ApplicationTestCaseBase):
    def setUp(self):
        super().setUp()

        # This application should not be in most of the responses
        # Only in super admin fetch
        ApplicationFactory(applicant_type=Application.APPLICANT_TYPE_ASSOCIATION)

    # -----------------------
    # Helper function section
    # -----------------------

    def perform_basic_query(self):
        response = self.query(
            """
            query {
                applications {
                    edges {
                        node {
                            applicantType
                            createdDate
                            lastModifiedDate
                            additionalInformation
                        }
                    }
                }
            }
            """
        )

        return response

    # ---------------------
    # Test function section
    # ---------------------

    def test_application_mutation_fails(self):
        self.client.force_login(self.general_admin)

        mutation_query = """
            mutation updateApplications($input: ApplicationsUpdateMutationInput!) {
                updateApplications(input: $input) {
                    status
                }
            }
        """
        status_fetch_query = """
            query {
                applications {
                    edges {
                        node {
                            pk
                            status
                        }
                    }
                }
            }
        """

        response = self.query(status_fetch_query)
        initial_state = json.loads(response.content)

        response = self.query(mutation_query, input_data={"id": 1, "status": "draft"})
        assert_that(response.status_code).is_equal_to(400)
        content = json.loads(response.content)

        # Find correct error message
        message_found = False
        for msg in content.get("errors"):
            if "Cannot query field 'updateApplications'" in msg.get("message", ""):
                message_found = True
        assert_that(message_found).is_true()

        response = self.query(status_fetch_query)
        updated_state = json.loads(response.content)

        assert_that(updated_state).is_equal_to(initial_state)

    def test_not_logged_in_user_does_not_receive_data(self):
        self.client.logout()

        response = self.perform_basic_query()
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)

        assert_that(
            content.get("data", {}).get("applications", {}).get("edges")
        ).is_empty()

    def test_unauthorized_user_does_not_receive_data(self):
        unauthorized_user = get_user_model().objects.create()
        self.client.force_login(unauthorized_user)

        response = self.perform_basic_query()
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data", {}).get("applications", {}).get("edges")
        ).is_empty()

    def test_regular_user_can_view_only_own_application(self):
        self.client.force_login(self.regular_joe)

        response = self.perform_basic_query()
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_service_sector_user_can_view_application(self):
        service_sector_admin = self.create_service_sector_admin()

        self.client.force_login(service_sector_admin)

        response = self.perform_basic_query()
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_service_sector_admin_cannot_view_other_sector_than_own(self):
        service_sector_admin = self.create_service_sector_admin()

        # Create new service sector admin to test that this Application does not get added to the response
        service_sector_admin_two = get_user_model().objects.create(
            username="ss_admin_two",
            first_name="AminAdmin",
            last_name="DeeDee",
            email="aminadmin.deedee@foo.com",
        )

        application_two = ApplicationFactory(
            applicant_type=Application.APPLICANT_TYPE_ASSOCIATION
        )

        ServiceSectorRole.objects.create(
            user=service_sector_admin_two,
            role=ServiceSectorRoleChoice.objects.get(code="admin"),
            service_sector=application_two.application_round.service_sector,
        )
        ServiceSectorRolePermission.objects.create(
            role=ServiceSectorRoleChoice.objects.get(code="admin"),
            permission="can_handle_applications",
        )

        self.client.force_login(service_sector_admin)

        response = self.perform_basic_query()
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_unit_admin_can_view_application(self):
        unit_admin = self.create_unit_admin()

        self.client.force_login(unit_admin)

        response = self.perform_basic_query()
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_unit_admin_cannot_view_other_unit_application(self):
        unit_admin = self.create_unit_admin()

        # Create new unit admin to test that this Application does not get added to the response
        unit_admin_two = get_user_model().objects.create(
            username="ss_admin_two",
            first_name="AminAdmin",
            last_name="DeeDee",
            email="aminadmin.deedee@foo.com",
        )

        unit_role = UnitRole.objects.create(
            user=unit_admin_two,
            role=UnitRoleChoice.objects.get(code="admin"),
        )
        UnitRolePermission.objects.create(
            role=UnitRoleChoice.objects.get(code="admin"),
            permission="can_validate_applications",
        )

        application_two = ApplicationFactory(
            applicant_type=Application.APPLICANT_TYPE_ASSOCIATION
        )
        application_event = ApplicationEventFactory(application=application_two)
        test_unit_1 = ReservationUnitFactory(
            name="Declined unit 10",
            name_fi="Declined unit FI 10",
            name_en="Declined unit EN 10",
            name_sv="Declined unit SV 10",
        )
        event_reservation_unit = EventReservationUnitFactory(
            priority=1,
            reservation_unit=test_unit_1,
            application_event=application_event,
        )

        unit_role.unit.add(event_reservation_unit.reservation_unit.unit)

        self.client.force_login(unit_admin)

        response = self.perform_basic_query()
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_unit_group_admin_can_view_application(self):
        unit_group_admin = self.create_unit_group_admin()

        self.client.force_login(unit_group_admin)

        response = self.perform_basic_query()
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_unit_group_admin_cannot_view_other_group_application(self):
        unit_group_admin = self.create_unit_group_admin()

        # Create new unit group admin to test that this Application does not get added to the response
        unit_group_admin_two = get_user_model().objects.create(
            username="ss_admin_two",
            first_name="AminAdmin",
            last_name="DeeDee",
            email="aminadmin.deedee@foo.com",
        )

        unit_role = UnitRole.objects.create(
            user=unit_group_admin_two,
            role=UnitRoleChoice.objects.get(code="admin"),
        )
        UnitRolePermission.objects.create(
            role=UnitRoleChoice.objects.get(code="admin"),
            permission="can_validate_applications",
        )

        application_two = ApplicationFactory(
            applicant_type=Application.APPLICANT_TYPE_ASSOCIATION
        )
        application_event = ApplicationEventFactory(application=application_two)
        test_unit_1 = ReservationUnitFactory(
            name="Declined unit 10",
            name_fi="Declined unit FI 10",
            name_en="Declined unit EN 10",
            name_sv="Declined unit SV 10",
        )
        event_reservation_unit = EventReservationUnitFactory(
            priority=1,
            reservation_unit=test_unit_1,
            application_event=application_event,
        )
        unit_group = UnitGroupFactory(
            units=(event_reservation_unit.reservation_unit.unit,)
        )

        unit_role.unit_group.add(unit_group)

        self.client.force_login(unit_group_admin)

        response = self.perform_basic_query()
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_super_admin_can_view_all_applications(self):
        self.client.force_login(self.general_admin)

        response = self.perform_basic_query()
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)
