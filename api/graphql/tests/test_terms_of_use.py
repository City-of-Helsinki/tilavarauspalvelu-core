import json

import snapshottest
from assertpy import assert_that

from api.graphql.tests.base import GrapheneTestCaseBase
from terms_of_use.models import TermsOfUse
from terms_of_use.tests.factories import TermsOfUseFactory


class TermsOfUseQueryTestCase(GrapheneTestCaseBase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.purpose = TermsOfUseFactory(
            pk="some_generic_terms",
            name_fi="name fi",
            name_sv="name sv",
            name_en="name en",
            text_fi="text fi",
            text_sv="text sv",
            text_en="text en",
            terms_type=TermsOfUse.TERMS_TYPE_GENERIC,
        )

    def test_getting_reservation_unit_purposes(self):
        response = self.query(
            """
            query {
                termsOfUse {
                    edges {
                        node {
                            pk
                            nameFi
                            nameSv
                            nameEn
                            textFi
                            textSv
                            textEn
                            termsType
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
