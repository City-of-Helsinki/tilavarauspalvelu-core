import json
from datetime import timedelta

import snapshottest
from assertpy import assert_that
from django.contrib.auth import get_user_model
from graphene_django.utils import GraphQLTestCase

from permissions.models import GeneralRole, GeneralRoleChoice
from resources.models import Resource
from resources.tests.factories import ResourceFactory
from spaces.tests.factories import SpaceFactory


class ResourceGraphQLBase(GraphQLTestCase):
    @classmethod
    def setUpTestData(cls):
        cls.space = SpaceFactory(name="Test space")
        cls.resource = ResourceFactory(
            name="Test resource",
            name_en="name",
            name_sv="namn",
            description_fi="selite",
            description_en="desc",
            description_sv="besk",
            space=cls.space,
        )

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


class ResourceGraphQLTestCase(ResourceGraphQLBase, snapshottest.TestCase):
    def test_getting_resources_with_null_buffer_times(self):
        response = self.query(
            """
            query {
              resources {
                edges {
                  node {
                    name
                    space {
                      name
                    }
                    building {
                      name
                    }
                    locationType
                    bufferTimeBefore
                    bufferTimeAfter
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

    def test_should_be_able_to_find_by_pk_with_buffer_times(self):
        self.resource.buffer_time_before = timedelta(hours=1)
        self.resource.buffer_time_after = timedelta(hours=2)
        self.resource.save()
        query = (
            f"{{\n"
            f"resourceByPk(pk: {self.resource.id}) {{\n"
            f"id name pk bufferTimeBefore bufferTimeAfter\n"
            f"}}"
            f"}}"
        )
        response = self.query(query)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        resource = content.get("data").get("resourceByPk")

        assert_that(resource.get("pk")).is_equal_to(self.resource.id)

        assert_that(resource.get("id")).is_not_equal_to(self.resource.id)

        content.get("data").get("resourceByPk").pop("pk")
        content.get("data").get("resourceByPk").pop("id")
        self.assertMatchSnapshot(content)

    def test_should_error_when_not_found_by_pk(self):
        query = (
            f"{{\n"
            f"resourceByPk(pk: {self.resource.id + 657}) {{\n"
            f"id name pk\n"
            f"}}"
            f"}}"
        )
        response = self.query(query)

        content = json.loads(response.content)
        errors = content.get("errors")
        assert_that(len(errors)).is_equal_to(1)
        assert_that(errors[0].get("message")).is_equal_to(
            "No Resource matches the given query."
        )


class ResourceCreateForPublishGraphQLTestCase(ResourceGraphQLBase):
    def setUp(self) -> None:
        self._client.force_login(self.general_admin)

    def get_create_query(self):
        return (
            "mutation createResource($input: ResourceCreateMutationInput!) "
            "{createResource(input: $input){id errors{messages field}}}"
        )

    def get_valid_input_data(self):
        return {
            "descriptionFi": "fide",
            "descriptionEn": "ende",
            "descriptionSv": "svde",
            "nameFi": "fina",
            "nameEn": "enna",
            "nameSv": "svna",
            "spaceId": self.space.id,
            "locationType": Resource.LOCATION_FIXED,
        }

    def test_resource_created(self):
        response = self.query(
            self.get_create_query(),
            input_data=self.get_valid_input_data(),
        )
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("createResource").get("errors")).is_none()
        assert_that(Resource.objects.exclude(id=self.resource.id).count()).is_equal_to(
            1
        )

    def test_validation_error_when_missing_name_translation(self):
        data = self.get_valid_input_data()
        data.pop("nameSv")
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(
            content.get("data").get("createResource").get("errors")[0].get("messages")
        ).contains(
            "Not draft state resources must have a translations. Missing translation for name_sv."
        )
        assert_that(Resource.objects.exclude(id=self.resource.id).count()).is_equal_to(
            0
        )

    def test_validation_error_when_missing_description_translation(self):
        data = self.get_valid_input_data()
        data.pop("descriptionEn")
        response = self.query(
            self.get_create_query(),
            input_data=data,
        )
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(
            content.get("data").get("createResource").get("errors")[0].get("messages")
        ).contains(
            "Not draft state resources must have a translations. Missing translation for description_en."
        )
        assert_that(Resource.objects.exclude(id=self.resource.id).count()).is_equal_to(
            0
        )

    def test_validation_error_when_no_space_and_fixed_location(self):
        data = self.get_valid_input_data()
        data.pop("spaceId")
        response = self.query(
            self.get_create_query(),
            input_data=data,
        )
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(
            content.get("data").get("createResource").get("errors")[0].get("messages")
        ).contains("Location type 'fixed' needs a space to be defined.")
        assert_that(Resource.objects.exclude(id=self.resource.id).count()).is_equal_to(
            0
        )

    def test_created_when_no_space_and_movable_location(self):
        data = self.get_valid_input_data()
        data.pop("spaceId")
        data["locationType"] = Resource.LOCATION_MOVABLE
        response = self.query(
            self.get_create_query(),
            input_data=data,
        )
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("createResource").get("errors")).is_none()
        assert_that(Resource.objects.exclude(id=self.resource.id).count()).is_equal_to(
            1
        )

    def test_regular_user_cannot_create(self):
        self._client.force_login(self.regular_joe)
        response = self.query(
            self.get_create_query(),
            input_data=self.get_valid_input_data(),
        )
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(Resource.objects.exclude(id=self.resource.id).count()).is_equal_to(
            0
        )

    def test_location_type_wrong_errors(self):
        data = self.get_valid_input_data()
        data["locationType"] = "imwrong"
        response = self.query(
            self.get_create_query(),
            input_data=data,
        )
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(
            content.get("data")
            .get("createResource")
            .get("errors")[0]
            .get("messages")[0]
        ).contains("Wrong type of location type")
        assert_that(Resource.objects.exclude(id=self.resource.id).count()).is_equal_to(
            0
        )


class ResourceCreateAsDraftGraphQLTestCase(ResourceGraphQLBase):
    def setUp(self) -> None:
        self._client.force_login(self.general_admin)

    def get_create_query(self):
        return (
            "mutation createResource($input: ResourceCreateMutationInput!) "
            "{createResource(input: $input){id errors{messages}}}"
        )

    def get_valid_input_data(self):
        return {
            "descriptionFi": "fide",
            "descriptionEn": "ende",
            "descriptionSv": "svde",
            "nameFi": "fina",
            "nameEn": "enna",
            "nameSv": "svna",
            "spaceId": self.space.id,
            "locationType": Resource.LOCATION_FIXED,
            "isDraft": True,
        }

    def test_resource_created(self):
        response = self.query(
            self.get_create_query(),
            input_data=self.get_valid_input_data(),
        )
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("createResource").get("errors")).is_none()
        assert_that(Resource.objects.exclude(id=self.resource.id).count()).is_equal_to(
            1
        )
        res_id = content.get("data").get("createResource").get("id")
        assert_that(Resource.objects.get(id=res_id))

    def test_created_when_missing_name_translation(self):
        data = self.get_valid_input_data()
        data.pop("nameFi")
        response = self.query(
            self.get_create_query(),
            input_data=self.get_valid_input_data(),
        )
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("createResource").get("errors")).is_none()
        assert_that(Resource.objects.exclude(id=self.resource.id).count()).is_equal_to(
            1
        )
        res_id = content.get("data").get("createResource").get("id")
        assert_that(Resource.objects.get(id=res_id))

    def test_created_when_missing_description_translation(self):
        data = self.get_valid_input_data()
        data.pop("descriptionFi")
        response = self.query(
            self.get_create_query(),
            input_data=self.get_valid_input_data(),
        )
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("createResource").get("errors")).is_none()
        assert_that(Resource.objects.exclude(id=self.resource.id).count()).is_equal_to(
            1
        )
        res_id = content.get("data").get("createResource").get("id")
        assert_that(Resource.objects.get(id=res_id))

    def test_created_when_no_space_and_fixed_location(self):
        data = self.get_valid_input_data()
        data.pop("spaceId")
        response = self.query(
            self.get_create_query(),
            input_data=self.get_valid_input_data(),
        )
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("createResource").get("errors")).is_none()
        assert_that(Resource.objects.exclude(id=self.resource.id).count()).is_equal_to(
            1
        )
        res_id = content.get("data").get("createResource").get("id")
        assert_that(Resource.objects.get(id=res_id))

    def test_regular_user_cannot_create(self):
        self._client.force_login(self.regular_joe)
        response = self.query(
            self.get_create_query(),
            input_data=self.get_valid_input_data(),
        )
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(Resource.objects.exclude(id=self.resource.id).count()).is_equal_to(
            0
        )


class ResourceUpdateForPublishGraphQLTestCase(ResourceGraphQLBase):
    def setUp(self) -> None:
        self._client.force_login(self.general_admin)

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.resource.is_draft = False
        cls.resource.save()

    def get_update_query(self):
        return (
            "mutation updateResource($input: ResourceUpdateMutationInput!) "
            "{updateResource(input: $input){id errors{messages}}}"
        )

    def get_valid_input_data(self):
        return {
            "pk": self.resource.pk,
            "descriptionFi": "fide",
            "descriptionEn": "ende",
            "descriptionSv": "svde",
            "nameFi": "fina",
            "nameEn": "enna",
            "nameSv": "svna",
            "spaceId": self.space.id,
            "locationType": Resource.LOCATION_FIXED,
        }

    def test_resource_updated(self):
        response = self.query(
            self.get_update_query(), input_data=self.get_valid_input_data()
        )
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(Resource.objects.get(id=self.resource.id).name).is_equal_to("fina")

    def test_validation_error_when_empty_name_translation(self):
        data = self.get_valid_input_data()
        data["nameSv"] = ""
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateResource").get("errors")[0].get("messages")
        ).contains(
            "Not draft state resources must have a translations. Missing translation for name_sv."
        )

    def test_validation_error_when_empty_description_translation(self):
        data = self.get_valid_input_data()
        data["descriptionFi"] = ""
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateResource").get("errors")[0].get("messages")
        ).contains(
            "Not draft state resources must have a translations. Missing translation for description_fi."
        )

    def test_validation_error_when_try_to_null_space_and_fixed_location(self):
        data = self.get_valid_input_data()
        data["spaceId"] = ""
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.resource.refresh_from_db()
        assert_that(
            content.get("data").get("updateResource").get("errors")[0].get("messages")
        ).contains("Location type 'fixed' needs a space to be defined.")

    def test_space_not_in_data_and_fixed_location_space_not_nulled(self):
        data = self.get_valid_input_data()
        data.pop("spaceId")
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("updateResource").get("errors")).is_none()
        self.resource.refresh_from_db()
        assert_that(self.resource.space).is_not_none()

    def test_update_space_null_and_location_movable(self):
        data = self.get_valid_input_data()
        data["spaceId"] = ""
        data["locationType"] = Resource.LOCATION_MOVABLE
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("updateResource").get("errors")).is_none()
        self.resource.refresh_from_db()
        assert_that(self.resource.space).is_none()

    def test_regular_user_cannot_update(self):
        self._client.force_login(self.regular_joe)
        response = self.query(
            self.get_update_query(),
            input_data=self.get_valid_input_data(),
        )
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

    def test_partial_update_ok(self):
        data = {"pk": self.resource.pk, "nameFi": "NewFinnishName"}
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("updateResource").get("errors")).is_none()
        self.resource.refresh_from_db()
        assert_that(self.resource.name_fi).is_equal_to("NewFinnishName")

    def test_partial_update_fails_when_emptying_description(self):
        data = {"pk": self.resource.pk, "descriptionFi": ""}
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.resource.refresh_from_db()
        assert_that(
            content.get("data").get("updateResource").get("errors")[0].get("messages")
        ).contains(
            "Not draft state resources must have a translations. Missing translation for description_fi."
        )

    def test_partial_update_fails_when_removing_space_from_fixed_location(self):
        data = {"pk": self.resource.pk, "spaceId": ""}
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.resource.refresh_from_db()
        assert_that(
            content.get("data").get("updateResource").get("errors")[0].get("messages")
        ).contains("Location type 'fixed' needs a space to be defined.")

    def test_location_type_wrong_errors(self):
        data = {"pk": self.resource.pk, "locationType": "imsowrong"}
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data")
            .get("updateResource")
            .get("errors")[0]
            .get("messages")[0]
        ).contains("Wrong type of location type")


class ResourceUpdateAsDraftGraphQLTestCase(ResourceGraphQLBase):
    def setUp(self):
        self._client.force_login(self.general_admin)

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.resource.is_draft = True
        cls.resource.save()

    def get_update_query(self):
        return "mutation updateResource($input: ResourceUpdateMutationInput!) {updateResource(input: $input){pk}}"

    def get_valid_input_data(self):
        return {"pk": self.resource.pk}

    def test_resource_updated(self):
        data = self.get_valid_input_data()
        data["nameFi"] = "new FinnName"
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(Resource.objects.get(id=self.resource.id).name).is_equal_to(
            "new FinnName"
        )

    def test_updated_when_empty_name_translations(self):
        data = self.get_valid_input_data()
        data["nameEn"] = ""
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(Resource.objects.get(id=self.resource.id).name_en).is_equal_to("")

    def test_updated_when_empty_description_translation(self):
        data = self.get_valid_input_data()
        data["descriptionSv"] = ""
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            Resource.objects.get(id=self.resource.id).description_sv
        ).is_equal_to("")

    def test_updated_when_no_space_and_fixed_location(self):
        data = self.get_valid_input_data()
        data["spaceId"] = ""
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(Resource.objects.get(id=self.resource.id).space).is_none()

    def test_regular_user_cannot_update(self):
        self._client.force_login(self.regular_joe)
        response = self.query(
            self.get_update_query(),
            input_data=self.get_valid_input_data(),
        )
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()


class ResourceDeleteGraphQLTestCase(ResourceGraphQLBase):
    @classmethod
    def setUp(self) -> None:
        self.resource.refresh_from_db()
        if not self.resource.pk:
            self.resource.save()

    def get_delete_query(self):
        return (
            "mutation deleteResource($input: ResourceDeleteMutationInput!) "
            "{deleteResource(input: $input){deleted errors}}"
        )

    def test_resource_deleted(self):
        self._client.force_login(self.general_admin)
        response = self.query(
            self.get_delete_query(), input_data={"pk": self.resource.pk}
        )

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("deleteResource").get("errors")).is_none()
        assert_that(content.get("data").get("deleteResource").get("deleted")).is_true()

        assert_that(Resource.objects.filter(pk=self.resource.pk).exists()).is_false()

    def test_regular_user_cannot_delete(self):
        self._client.force_login(self.regular_joe)
        response = self.query(
            self.get_delete_query(), input_data={"pk": self.resource.pk}
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("deleteResource").get("errors")).contains(
            "No permissions to perform delete."
        )
        assert_that(content.get("data").get("deleteResource").get("deleted")).is_false()

        assert_that(Resource.objects.filter(pk=self.resource.pk).exists()).is_true()
