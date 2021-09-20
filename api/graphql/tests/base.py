from django.contrib.auth import get_user_model
from graphene_django.utils import GraphQLTestCase

from permissions.models import GeneralRole, GeneralRoleChoice


class GrapheneTestCaseBase(GraphQLTestCase):
    @classmethod
    def setUpTestData(cls):
        cls.general_admin = get_user_model().objects.create(
            username="gen_admin",
            first_name="Admin",
            last_name="General",
            email="amin.general@foo.com",
        )
        GeneralRole.objects.create(
            user=cls.general_admin,
            role=GeneralRoleChoice.objects.get(code="admin"),
        )
        cls.regular_joe = get_user_model().objects.create(
            username="regjoe",
            first_name="joe",
            last_name="regular",
            email="joe.regularl@foo.com",
        )
