import pytest
from assertpy import assert_that
from django.test import TestCase

from permissions.feature_permissions.tests.user_factory import UserFactory


@pytest.mark.django_db
class ApplicationRoundFeaturePermissionTestCase(TestCase):
    def test_should_return(self):
        user = UserFactory()
        print(user)
        assert_that(1).is_equal_to(403)

