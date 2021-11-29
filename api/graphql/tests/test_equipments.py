import json

import snapshottest
from assertpy import assert_that

from api.graphql.tests.base import GrapheneTestCaseBase
from reservation_units.models import Equipment
from reservation_units.tests.factories import EquipmentCategoryFactory, EquipmentFactory


class EquipmentBaseTestCase(GrapheneTestCaseBase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.category = EquipmentCategoryFactory(name="Test Category")

    def setUp(self) -> None:
        self.client.force_login(self.general_admin)


class EquipmentCreateTestCase(EquipmentBaseTestCase):
    def get_create_query(self):
        return """
            mutation createEquipment($input: EquipmentCreateMutationInput!) {
                createEquipment(input: $input) {
                    nameFi
                    pk
                    errors {
                        messages
                        field
                    }
                }
            }
        """

    def test_creating_equipment(self):
        data = {"nameFi": "Equipment name", "categoryPk": self.category.id}
        response = self.query(self.get_create_query(), input_data=data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("createEquipment").get("pk")).is_not_none()

    def test_regular_user_cannot_create(self):
        self.client.force_login(self.regular_joe)
        data = {
            "nameFi": "Regular user created equipment",
            "categoryPk": self.category.id,
        }
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(Equipment.objects.all().exists()).is_false()


class EquipmentUpdateTestCase(EquipmentBaseTestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.equipment = EquipmentFactory(name="Test equipment")

    def get_update_query(self):
        return """
            mutation updateEquipment($input: EquipmentUpdateMutationInput!) {
                updateEquipment(input: $input) {
                    nameFi
                    pk
                    errors {
                        messages
                        field
                    }
                }
            }
        """

    def test_update(self):
        data = {
            "pk": self.equipment.pk,
            "nameFi": "Updated name",
            "categoryPk": self.category.id,
        }
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content).get("data")

        assert_that(content.get("errors")).is_none()
        equipment_content = content.get("updateEquipment")
        self.equipment.refresh_from_db()

        assert_that(equipment_content.get("pk")).is_equal_to(self.equipment.pk)
        assert_that(equipment_content.get("nameFi")).is_equal_to("Updated name")
        assert_that(self.equipment.name).is_equal_to("Updated name")

    def test_updating_should_error_when_not_found(self):
        data = {"pk": 1234, "nameFi": "Me errors", "categoryPk": self.category.id}
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

    def test_regular_user_cannot_update(self):
        self.client.force_login(self.regular_joe)
        name = self.equipment.name
        data = {
            "pk": self.equipment.pk,
            "nameFi": "Regular user updated the name",
            "categoryPk": self.category.id,
        }
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        self.equipment.refresh_from_db()
        assert_that(self.equipment.name).is_equal_to(name)


class EquipmentQueryTestCase(EquipmentBaseTestCase):
    def test_getting_equipment(self):
        EquipmentFactory(name="Test equipment")
        response = self.query(
            """
            query {
              equipments {
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


class EquipmentCategoryCreateTestCase(EquipmentBaseTestCase):
    def get_create_query(self):
        return """
            mutation createEquipmentCategory($input: EquipmentCategoryCreateMutationInput!) {
                createEquipmentCategory(input: $input) {
                    nameFi
                    pk
                    errors {
                        messages
                        field
                    }
                }
            }
        """

    def test_creating_equipment_category(self):
        data = {"nameFi": "Equipment category name"}
        response = self.query(self.get_create_query(), input_data=data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("createEquipmentCategory").get("pk")
        ).is_not_none()

    def test_empty_name_errors(self):
        data = {
            "nameFi": "",
        }
        response = self.query(self.get_create_query(), input_data=data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("createEquipmentCategory").get("pk")
        ).is_none()
        assert_that(
            content.get("data").get("createEquipmentCategory").get("errors")
        ).is_not_none()

    def test_regular_user_cannot_create(self):
        self.client.force_login(self.regular_joe)
        data = {
            "nameFi": "Regular user created equipment category",
        }
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(Equipment.objects.all().exists()).is_false()


class EquipmentCategoryUpdateTestCase(EquipmentBaseTestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.equipment_category = EquipmentCategoryFactory(name="Test equipment")

    def get_update_query(self):
        return """
            mutation updateEquipmentCategory($input: EquipmentCategoryUpdateMutationInput!) {
                updateEquipmentCategory(input: $input) {
                    nameFi
                    pk
                    errors {
                        messages
                        field
                    }
                }
            }
        """

    def test_update(self):
        data = {"pk": self.equipment_category.pk, "nameFi": "Updated name"}
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content).get("data")

        assert_that(content.get("errors")).is_none()
        equipment_content = content.get("updateEquipmentCategory")
        self.equipment_category.refresh_from_db()

        assert_that(equipment_content.get("pk")).is_equal_to(self.equipment_category.pk)
        assert_that(equipment_content.get("nameFi")).is_equal_to("Updated name")
        assert_that(self.equipment_category.name).is_equal_to("Updated name")

    def test_updating_should_error_when_not_found(self):
        data = {"pk": 1234, "nameFi": "Me errors"}
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

    def test_regular_user_cannot_update(self):
        self.client.force_login(self.regular_joe)
        name = self.equipment_category.name
        data = {
            "pk": self.equipment_category.pk,
            "nameFi": "Regular user updated the name",
        }
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        self.equipment_category.refresh_from_db()
        assert_that(self.equipment_category.name).is_equal_to(name)


class EquipmentCategoryQueryTestCase(EquipmentBaseTestCase):
    def test_getting_equipment_category(self):
        response = self.query(
            """
            query {
              equipmentCategories {
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
