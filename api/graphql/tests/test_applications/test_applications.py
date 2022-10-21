import json

import freezegun
from assertpy import assert_that
from django.test import override_settings

from users.models import PersonalInfoViewLog

from .base import ApplicationTestCaseBase


@freezegun.freeze_time("2022-05-02T12:00:00Z")
class ApplicationsGraphQLTestCase(ApplicationTestCaseBase):
    def setUp(self):
        super().setUp()
        self.client.force_login(self.regular_joe)

    def test_getting_applications_base_testcase(self):
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

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_application_applicant_fields(self):
        response = self.query(
            """
            query {
                applications {
                    edges {
                        node {
                            applicantName
                            applicantEmail
                        }
                    }
                }
            }
            """
        )

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_application_applicant_no_value(self):
        self.application.user = None
        self.application.save()

        self.client.force_login(self.general_admin)

        response = self.query(
            """
            query {
                applications {
                    edges {
                        node {
                            applicantName
                            applicantEmail
                        }
                    }
                }
            }
            """
        )

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_application_home_city_fields(self):
        response = self.query(
            """
            query {
                applications {
                    edges {
                        node {
                            homeCity {
                                name
                            }
                        }
                    }
                }
            }
            """
        )

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_application_billing_address_fields(self):
        response = self.query(
            """
            query {
                applications {
                    edges {
                        node {
                            billingAddress {
                                streetAddress
                                postCode
                                city
                            }
                        }
                    }
                }
            }
            """
        )

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_application_aggregate_data_fields(self):
        response = self.query(
            """
            query {
                applications {
                    edges {
                        node {
                            aggregatedData {
                                appliedMinDurationTotal
                                appliedReservationsTotal
                                createdReservationsTotal
                                reservationsDurationTotal
                            }
                        }
                    }
                }
            }
            """
        )

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_application_status_field(self):
        response = self.query(
            """
            query {
                applications {
                    edges {
                        node {
                            status
                        }
                    }
                }
            }
            """
        )

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_application_contact_person_fields(self):
        response = self.query(
            """
            query {
                applications {
                    edges {
                        node {
                            contactPerson {
                                firstName
                                lastName
                                email
                                phoneNumber
                            }
                        }
                    }
                }
            }
            """
        )

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_application_organisation_fields(self):
        response = self.query(
            """
            query {
                applications {
                    edges {
                        node {
                            organisation {
                                name
                                identifier
                                yearEstablished
                                activeMembers
                                coreBusiness
                                organisationType
                                email
                                address {
                                    streetAddress
                                    postCode
                                    city
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
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_application_application_events_basic_fields(self):
        response = self.query(
            """
            query {
                applications {
                    edges {
                        node {
                            applicationEvents {
                                name
                                numPersons
                                minDuration
                                maxDuration
                                eventsPerWeek
                                biweekly
                                begin
                                end
                                status
                            }
                        }
                    }
                }
            }
            """
        )

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_application_application_events_age_group(self):
        response = self.query(
            """
            query {
                applications {
                    edges {
                        node {
                            applicationEvents {
                                ageGroup {
                                    minimum
                                    maximum
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
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_application_application_events_ability_group_fields(self):
        response = self.query(
            """
            query {
                applications {
                    edges {
                        node {
                            applicationEvents {
                                abilityGroup {
                                    name
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
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_application_application_events_purpose_fields(self):
        response = self.query(
            """
            query {
                applications {
                    edges {
                        node {
                            applicationEvents {
                                purpose {
                                    nameFi
                                    nameEn
                                    nameSv
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
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_application_application_events_aggregated_data_fields(self):
        response = self.query(
            """
            query {
                applications {
                    edges {
                        node {
                            applicationEvents {
                                aggregatedData {
                                    durationTotal
                                    reservationsTotal
                                    allocationResultsDurationTotal
                                    allocationResultsReservationsTotal
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
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_application_application_events_declined_reservation_unit_ids_field(self):
        response = self.query(
            """
            query {
                applications {
                    edges {
                        node {
                            applicationEvents {
                                declinedReservationUnits {
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
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_application_application_events_application_event_schedules_fields(self):
        response = self.query(
            """
            query {
                applications {
                    edges {
                        node {
                            applicationEvents {
                                applicationEventSchedules {
                                    day
                                    begin
                                    end
                                    priority
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
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_application_application_events_event_reservation_unit_base_fields(self):
        response = self.query(
            """
            query {
                applications {
                    edges {
                        node {
                            applicationEvents {
                                eventReservationUnits {
                                    priority
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
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_application_applicant_user_does_not_render_to_regular_user(self):
        response = self.query(
            """
            query {
                applications {
                    edges {
                        node {
                            applicantUser { firstName }
                        }
                    }
                }
            }
            """
        )

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content["data"]["applications"]["edges"][0]["node"]["applicantUser"]
        ).is_none()
        self.assertMatchSnapshot(content)

    def test_application_applicant_user_does_render_to_application_validator_user(self):
        unit_admin = self.create_unit_admin()
        self.client.force_login(unit_admin)
        response = self.query(
            """
            query {
                applications {
                    edges {
                        node {
                            applicantUser { firstName }
                        }
                    }
                }
            }
            """
        )

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content["data"]["applications"]["edges"][0]["node"]["applicantUser"]
        ).is_not_none()
        self.assertMatchSnapshot(content)

    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_application_applicant_user_logs_date_of_birth_view(self):
        unit_admin = self.create_unit_admin()
        self.client.force_login(unit_admin)
        assert_that(PersonalInfoViewLog.objects.count()).is_zero()
        response = self.query(
            """
            query {
                applications {
                    edges {
                        node {
                            applicantUser { dateOfBirth }
                        }
                    }
                }
            }
            """
        )

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

        assert_that(PersonalInfoViewLog.objects.count()).is_equal_to(1)
