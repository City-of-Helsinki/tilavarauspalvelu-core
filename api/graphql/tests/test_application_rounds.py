import json

import snapshottest
from assertpy import assert_that
from django.contrib.auth import get_user_model
from freezegun import freeze_time

from api.graphql.tests.base import GrapheneTestCaseBase
from applications.models import (
    ApplicationRound,
    ApplicationRoundStatus,
    ApplicationStatus,
)
from applications.tests.factories import (
    ApplicationFactory,
    ApplicationRoundFactory,
    ApplicationRoundStatusFactory,
    ApplicationStatusFactory,
)
from permissions.models import GeneralRole, GeneralRoleChoice
from reservation_units.tests.factories import ReservationUnitFactory
from spaces.tests.factories import ServiceSectorFactory


@freeze_time("2021-05-03 03:21:34")
class ApplicationRoundQueryTestCase(GrapheneTestCaseBase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.general_admin = get_user_model().objects.create(
            username="app_round_admin",
            first_name="App",
            last_name="Round",
            email="app.round@foo.com",
        )

        GeneralRole.objects.create(
            user=cls.general_admin,
            role=GeneralRoleChoice.objects.get(code="admin"),
        )
        reservation_unit = ReservationUnitFactory(name_fi="test reservation unit")
        service_sector = ServiceSectorFactory(name_fi="service test sector")
        cls.application_round = ApplicationRoundFactory(
            name="Test application round",
            name_fi="Test application round fi",
            name_en="Test application round en",
            name_sv="Test application round sv",
            criteria_fi="Criteria fi",
            criteria_en="Criteria en",
            criteria_sv="Criteria sv",
            target_group=ApplicationRound.TARGET_GROUP_ALL,
            reservation_units=[reservation_unit],
            service_sector=service_sector,
        )
        cls.application_round_status = ApplicationRoundStatusFactory(
            application_round=cls.application_round,
            user=cls.general_admin,
            status=ApplicationRoundStatus.DRAFT,
        )
        app = ApplicationFactory(application_round=cls.application_round)
        ApplicationStatusFactory(application=app, status=ApplicationStatus.IN_REVIEW)

    def test_getting_application_rounds(self):
        self.client.force_login(self.regular_joe)

        response = self.query(
            """
            query {
                applicationRounds {
                    totalCount
                    edges {
                        node {
                            nameFi
                            nameEn
                            nameSv
                            reservationUnits {
                                nameFi
                            }
                            purposes {
                                nameFi
                            }
                            status
                            statusTimestamp
                            applicationRoundBaskets {
                                name
                                mustBeMainPurposeOfApplicant
                                customerType
                                allocationPercentage
                                orderNumber
                            }
                            allocating
                            criteriaFi
                            criteriaEn
                            criteriaSv
                            aggregatedData {
                                allocationResultEventsCount
                                allocationDurationTotal
                                totalReservationDuration
                                totalHourCapacity
                            }
                            applicationsSent
                            targetGroup
                            applicationsCount
                            reservationUnitCount
                            serviceSector {
                                nameFi
                                nameEn
                                nameSv
                            }
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_applications_count_does_not_include_draft_applications(self):
        application = ApplicationFactory(application_round=self.application_round)
        ApplicationStatus(application=application, status=ApplicationStatus.DRAFT)

        self.client.force_login(self.regular_joe)

        response = self.query(
            """
            query {
                applicationRounds {
                    totalCount
                    edges {
                        node {
                            applicationsCount
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)
