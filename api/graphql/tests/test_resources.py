import json
from datetime import timedelta

import snapshottest
from assertpy import assert_that
from django.contrib.auth import get_user_model
from graphene_django.utils import GraphQLTestCase

from permissions.models import (
    GeneralRole,
    GeneralRoleChoice,
    GeneralRolePermission,
    ServiceSectorRole,
    ServiceSectorRoleChoice,
    ServiceSectorRolePermission,
    UnitRole,
    UnitRoleChoice,
    UnitRolePermission,
)
from resources.models import Resource
from resources.tests.factories import ResourceFactory
from spaces.tests.factories import (
    ServiceSectorFactory,
    SpaceFactory,
    UnitFactory,
    UnitGroupFactory,
)


class ResourceGraphQLBase(GraphQLTestCase):
    @classmethod
    def setUpTestData(cls):
        unit = UnitFactory()
        service_sector = ServiceSectorFactory(units=[unit])
        cls.space = SpaceFactory(name_fi="Test space", unit=unit)
        cls.resource = ResourceFactory(
            name_fi="Test resource",
            name_en="name",
            name_sv="namn",
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

        unit_role_choice = UnitRoleChoice.objects.get(code="admin")
        UnitRolePermission.objects.create(
            role=unit_role_choice,
            permission="can_manage_resources",
        )
        cls.unit_admin = get_user_model().objects.create(
            username="unitadmin",
            first_name="Unit",
            last_name="Admin",
            email="unit.admin@foo.com",
        )

        unit_role = UnitRole.objects.create(
            user=cls.unit_admin,
            role=unit_role_choice,
        )
        unit_role.unit.add(unit)

        cls.unit_group_admin = get_user_model().objects.create(
            username="unitgroupadmin",
            first_name="GroupUnit",
            last_name="Admin",
            email="unit.groupadmin@foo.com",
        )
        unit_group = UnitGroupFactory(units=[unit])
        unit_group_role = UnitRole.objects.create(
            user=cls.unit_group_admin,
            role=unit_role_choice,
        )
        unit_group_role.unit_group.add(unit_group)

        cls.service_sector_admin = get_user_model().objects.create(
            username="Service",
            first_name="SectorAdmin",
            last_name="Admin",
            email="service.sector@foo.com",
        )
        ss_role_choice = ServiceSectorRoleChoice.objects.get(code="admin")
        ServiceSectorRolePermission.objects.create(
            role=ss_role_choice,
            permission="can_manage_resources",
        )
        ServiceSectorRole.objects.create(
            user=cls.service_sector_admin,
            role=ss_role_choice,
            service_sector=service_sector,
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
                    nameFi
                    space {
                        nameFi
                    }
                    building {
                      nameFi
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
        query = f"""
            {{
                resourceByPk(pk: {self.resource.id}) {{
                    id
                    nameFi
                    pk
                    bufferTimeBefore
                    bufferTimeAfter
                }}
            }}
            """
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
        query = f"""
            {{
                resourceByPk(pk: {self.resource.id + 657}) {{
                    id
                    nameFi
                    pk
                }}
            }}
            """
        response = self.query(query)

        content = json.loads(response.content)
        errors = content.get("errors")
        assert_that(len(errors)).is_equal_to(1)
        assert_that(errors[0].get("message")).is_equal_to(
            "No Resource matches the given query."
        )

    def test_only_with_permissions_with_no_permissions(self):
        response = self.query(
            """
            query {
              resources(onlyWithPermission:true) {
                edges {
                  node {
                    nameFi
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

    def test_only_with_permissions_with_general_role(self):
        role_choice = GeneralRoleChoice.objects.create(code="resource_manager")
        GeneralRolePermission.objects.create(
            role=role_choice, permission="can_manage_resources"
        )
        GeneralRole.objects.create(
            user=self.regular_joe,
            role=role_choice,
        )
        self.client.force_login(self.regular_joe)
        response = self.query(
            """
            query {
              resources(onlyWithPermission:true) {
                edges {
                  node {
                    nameFi
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

    def test_only_with_permission_with_service_sector_role(self):
        unit = UnitFactory(name="test unit")
        service_sector = ServiceSectorFactory(name="test service sector", units=[unit])
        space = SpaceFactory(name_fi="test space", unit=unit)
        another_space = SpaceFactory(name_fi="another_space")

        ResourceFactory(name_fi="i am from the sector!", space=space)
        ResourceFactory(name_fi="hide me", space=another_space)

        spaces_role_choice = ServiceSectorRoleChoice.objects.create(
            code="resource_manager"
        )
        ServiceSectorRolePermission.objects.create(
            role=spaces_role_choice, permission="can_manage_resources"
        )
        ServiceSectorRole.objects.create(
            user=self.regular_joe,
            role=spaces_role_choice,
            service_sector=service_sector,
        )
        self.client.force_login(self.regular_joe)
        response = self.query(
            """
            query {
                resources(onlyWithPermission:true) {
                    edges {
                        node {
                            nameFi
                          }
                        }
                    }
                }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_only_with_permission_with_unit_role(self):
        unit = UnitFactory(name="test unit")
        space = SpaceFactory(name_fi="test space", unit=unit)
        another_space = SpaceFactory(name_fi="another space")
        ResourceFactory(name_fi="i'm from the unit!", space=space)
        ResourceFactory(name_fi="hide me", space=another_space)

        role_choice = UnitRoleChoice.objects.create(code="resource_manager")
        UnitRolePermission.objects.create(
            role=role_choice, permission="can_manage_resources"
        )
        role = UnitRole.objects.create(user=self.regular_joe, role=role_choice)
        role.unit.set([unit])

        self.client.force_login(self.regular_joe)
        response = self.query(
            """
            query {
                resources(onlyWithPermission:true) {
                    edges {
                        node {
                            nameFi
                          }
                        }
                    }
                }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_only_with_permission_with_unit_group_role(self):
        unit = UnitFactory(name="test unit")
        unit_group = UnitGroupFactory(name="test group", units=[unit])
        space = SpaceFactory(name_fi="test_space", unit=unit)
        another_space = SpaceFactory(name_fi="another space")

        ResourceFactory(name_fi="i'm from the unit group!", space=space)
        ResourceFactory(name_fi="hide me", space=another_space)

        role_choice = UnitRoleChoice.objects.create(code="resource_manager")
        UnitRolePermission.objects.create(
            role=role_choice, permission="can_manage_resources"
        )
        role = UnitRole.objects.create(user=self.regular_joe, role=role_choice)
        role.unit_group.set([unit_group])

        self.client.force_login(self.regular_joe)
        response = self.query(
            """
            query {
                resources(onlyWithPermission:true) {
                    edges {
                        node {
                            nameFi
                          }
                        }
                    }
                }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)


class ResourceCreateForPublishGraphQLTestCase(ResourceGraphQLBase):
    def setUp(self) -> None:
        self.client.force_login(self.general_admin)

    def get_create_query(self):
        return (
            "mutation createResource($input: ResourceCreateMutationInput!) "
            "{createResource(input: $input){pk errors{messages field}}}"
        )

    def get_valid_input_data(self):
        return {
            "nameFi": "fina",
            "nameEn": "enna",
            "nameSv": "svna",
            "spacePk": self.space.id,
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

    def test_service_sector_admin_can_create_resource(self):
        self.client.force_login(self.service_sector_admin)

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

    def test_unit_admin_can_create_resource(self):
        self.client.force_login(self.unit_admin)

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

    def test_unit_group_admin_can_create_resource(self):
        self.client.force_login(self.unit_group_admin)

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

    def test_validation_error_when_no_space_and_fixed_location(self):
        data = self.get_valid_input_data()
        data.pop("spacePk")
        response = self.query(
            self.get_create_query(),
            input_data=data,
        )
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")[0].get("message")).contains(
            "Location type 'fixed' needs a space to be defined."
        )
        assert_that(Resource.objects.exclude(id=self.resource.id).count()).is_equal_to(
            0
        )

    def test_created_when_no_space_and_movable_location(self):
        data = self.get_valid_input_data()
        data.pop("spacePk")
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
        self.client.force_login(self.regular_joe)
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
        assert_that(content.get("errors")[0].get("message")).contains(
            "Wrong type of location type"
        )
        assert_that(Resource.objects.exclude(id=self.resource.id).count()).is_equal_to(
            0
        )


class ResourceCreateAsDraftGraphQLTestCase(ResourceGraphQLBase):
    def setUp(self) -> None:
        self.client.force_login(self.general_admin)

    def get_create_query(self):
        return (
            "mutation createResource($input: ResourceCreateMutationInput!) "
            "{createResource(input: $input){pk errors{messages}}}"
        )

    def get_valid_input_data(self):
        return {
            "nameFi": "fina",
            "nameEn": "enna",
            "nameSv": "svna",
            "spacePk": self.space.id,
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
        res_pk = content.get("data").get("createResource").get("pk")
        assert_that(Resource.objects.get(pk=res_pk))

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
        res_pk = content.get("data").get("createResource").get("pk")
        assert_that(Resource.objects.get(pk=res_pk))

    def test_created_when_no_space_and_fixed_location(self):
        data = self.get_valid_input_data()
        data.pop("spacePk")
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
        res_pk = content.get("data").get("createResource").get("pk")
        assert_that(Resource.objects.get(pk=res_pk))

    def test_regular_user_cannot_create(self):
        self.client.force_login(self.regular_joe)
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
        self.client.force_login(self.general_admin)

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.resource.is_draft = False
        cls.resource.save()

    def get_update_query(self):
        return (
            "mutation updateResource($input: ResourceUpdateMutationInput!) "
            "{updateResource(input: $input){pk errors{messages}}}"
        )

    def get_valid_input_data(self):
        return {
            "pk": self.resource.pk,
            "nameFi": "fina",
            "nameEn": "enna",
            "nameSv": "svna",
            "spacePk": self.space.id,
            "locationType": Resource.LOCATION_FIXED,
        }

    def test_resource_updated(self):
        response = self.query(
            self.get_update_query(), input_data=self.get_valid_input_data()
        )
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        updated_resource = Resource.objects.get(id=self.resource.id)
        assert_that(updated_resource.name).is_equal_to("fina")
        assert_that(updated_resource.name_en).is_equal_to("enna")
        assert_that(updated_resource.name_sv).is_equal_to("svna")

    def test_update_without_translations(self):
        data = self.get_valid_input_data()
        data["nameEn"] = None
        data["nameSv"] = None
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("updateResource").get("errors")).is_none()
        updated_resource = Resource.objects.get(id=self.resource.id)
        assert_that(updated_resource.name).is_equal_to("fina")
        assert_that(updated_resource.name_en).is_none()
        assert_that(updated_resource.name_sv).is_none()

    def test_validation_error_when_empty_finnish_name(self):
        data = self.get_valid_input_data()
        data["nameFi"] = ""
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).contains(
            "Missing translation for nameFi."
        )

    def test_validation_error_when_try_to_null_space_and_fixed_location(self):
        data = self.get_valid_input_data()
        data["spacePk"] = None
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        self.resource.refresh_from_db()
        assert_that(content.get("errors")[0].get("message")).contains(
            "Location type 'fixed' needs a space to be defined."
        )

    def test_space_not_in_data_and_fixed_location_space_not_nulled(self):
        data = self.get_valid_input_data()
        data.pop("spacePk")
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("updateResource").get("errors")).is_none()
        self.resource.refresh_from_db()
        assert_that(self.resource.space).is_not_none()

    def test_update_space_null_and_location_movable(self):
        data = self.get_valid_input_data()
        data["spacePk"] = None
        data["locationType"] = Resource.LOCATION_MOVABLE
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("updateResource").get("errors")).is_none()
        self.resource.refresh_from_db()
        assert_that(self.resource.space).is_none()

    def test_regular_user_cannot_update(self):
        self.client.force_login(self.regular_joe)
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

    def test_partial_update_fails_when_removing_space_from_fixed_location(self):
        data = {"pk": self.resource.pk, "spacePk": None}
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        self.resource.refresh_from_db()
        assert_that(content.get("errors")[0].get("message")).contains(
            "Location type 'fixed' needs a space to be defined."
        )

    def test_location_type_wrong_errors(self):
        data = {"pk": self.resource.pk, "locationType": "imsowrong"}
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).contains(
            "Wrong type of location type"
        )


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
        self.client.force_login(self.general_admin)
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
        self.client.force_login(self.regular_joe)
        response = self.query(
            self.get_delete_query(), input_data={"pk": self.resource.pk}
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).contains(
            "No permissions to perform delete."
        )

        assert_that(Resource.objects.filter(pk=self.resource.pk).exists()).is_true()
