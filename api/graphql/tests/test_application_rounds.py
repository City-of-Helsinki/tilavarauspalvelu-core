import json

import snapshottest
from assertpy import assert_that
from django.contrib.auth import get_user_model
from freezegun import freeze_time

from api.graphql.tests.base import GrapheneTestCaseBase
from applications.models import ApplicationRound, ApplicationRoundStatus
from applications.tests.factories import (
    ApplicationRoundFactory,
    ApplicationRoundStatusFactory,
)
from permissions.models import GeneralRole, GeneralRoleChoice


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

        cls.application_round = ApplicationRoundFactory(
            name="Test application round",
            name_fi="Test application round fi",
            name_en="Test application round en",
            name_sv="Test application round sv",
            criteria_fi="Criteria fi",
            criteria_en="Criteria en",
            criteria_sv="Criteria sv",
            target_group=ApplicationRound.TARGET_GROUP_ALL,
        )
        cls.application_round_status = ApplicationRoundStatusFactory(
            application_round=cls.application_round,
            user=cls.general_admin,
            status=ApplicationRoundStatus.DRAFT,
        )

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
                            approvedBy
                            applicationsSent
                            targetGroup
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)
