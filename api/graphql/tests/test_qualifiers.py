import json

import snapshottest
from assertpy import assert_that

from api.graphql.tests.base import GrapheneTestCaseBase
from reservation_units.tests.factories import QualifierFactory


class QualifierQueryTestCase(GrapheneTestCaseBase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.qualifier = QualifierFactory(name_fi="Qualifier FI", name_en="Qualifier EN", name_sv="Qualifier SV")

    def test_getting_qualifiers(self):
        response = self.query(
            """
            query {
            qualifiers{
                edges{
                  node{
                    nameFi
                    nameEn
                    nameSv
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
