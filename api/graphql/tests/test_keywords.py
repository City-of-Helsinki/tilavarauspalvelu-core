import json

import snapshottest
from assertpy import assert_that
from graphene_django.utils import GraphQLTestCase
from rest_framework.test import APIClient

from reservation_units.tests.factories import (
    KeywordCategoryFactory,
    KeywordFactory,
    KeywordGroupFactory,
)


class ResourceGraphQLTestCase(GraphQLTestCase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.category = KeywordCategoryFactory(name="Test category")
        cls.group = KeywordGroupFactory(
            name="Test group", keyword_category=cls.category
        )
        cls.keyword = KeywordFactory(name="Test keyword", keyword_group=cls.group)

        cls.api_client = APIClient()

    def test_getting_keyword_categories(self):
        response = self.query(
            """
            query {
            keywordCategories{
                edges{
                  node{
                    name
                    keywordGroups{
                      name
                      keywords{
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

    def test_getting_keyword_groups(self):
        response = self.query(
            """
            query {
              keywordGroups{
                edges{
                  node{
                    name
                    keywords{
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

    def test_getting_keywords(self):
        response = self.query(
            """
            query {
              keywords{
                edges{
                  node{
                    name
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
