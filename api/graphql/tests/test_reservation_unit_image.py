import json

from assertpy import assert_that
from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from graphene_file_upload.django.testing import (
    GraphQLFileUploadTestCase,
    file_graphql_query,
)

from api.graphql.tests.base import GrapheneTestCaseBase
from reservation_units.models import ReservationUnitImage
from reservation_units.tests.factories import (
    ReservationUnitFactory,
    ReservationUnitImageFactory,
)

DEFAULT_GRAPHQL_URL = "/graphql/"


class ReservationUnitImageCreateTestCase(
    GrapheneTestCaseBase, GraphQLFileUploadTestCase
):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.file_to_upload = SimpleUploadedFile(
            name="eltest.png",
            content="lostest".encode("utf-8"),
            content_type="image/png",
        )

        cls.res_unit = ReservationUnitFactory()

    def get_create_query(self):
        return """
        mutation createReservationUnitImage($input: ReservationUnitImageCreateMutationInput!) {
            createReservationUnitImage(input: $input) {
                pk
                errors {
                    messages field
                }
            }
        }
        """

    def test_upload_image_success(self):
        self.client.force_login(self.general_admin)
        response = file_graphql_query(
            self.get_create_query(),
            op_name="createReservationUnitImage",
            files={"image": self.file_to_upload},
            variables={
                "input": {
                    "imageType": "MAIN",
                    "reservationUnitPk": self.res_unit.id,
                    "image": self.file_to_upload.name,
                }
            },
            client=self.client,
        )
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        image_data = content.get("data").get("createReservationUnitImage")
        assert_that(image_data.get("errors")).is_none()

        self.res_unit.refresh_from_db()
        img = self.res_unit.images.first()
        assert_that(img).is_not_none()
        assert_that(img.image.name).starts_with(
            f"{settings.RESERVATION_UNIT_IMAGES_ROOT}/eltest"
        )
        assert_that(img.image.name).ends_with(".png")
        assert_that(img.image_type).is_equal_to("main")

    def test_upload_file_not_an_image_fails(self):
        file_to_upload = SimpleUploadedFile(
            name="eltest.xsl",
            content="lostest".encode("utf-8"),
            content_type="application/pdf",
        )

        self.client.force_login(self.general_admin)
        response = file_graphql_query(
            self.get_create_query(),
            op_name="createReservationUnitImage",
            files={"image": file_to_upload},
            variables={
                "input": {
                    "imageType": "image_type.MAIN",
                    "reservationUnitPk": self.res_unit.id,
                    "image": file_to_upload.name,
                }
            },
            client=self.client,
        )
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

        self.res_unit.refresh_from_db()
        img = self.res_unit.images.first()
        assert_that(img).is_none()

    def test_upload_image_as_regular_user_fails(self):
        self.client.force_login(self.regular_joe)
        response = file_graphql_query(
            self.get_create_query(),
            op_name="createReservationUnitImage",
            files={"image": self.file_to_upload},
            variables={
                "input": {
                    "imageType": "MAIN",
                    "reservationUnitPk": self.res_unit.id,
                    "image": self.file_to_upload.name,
                }
            },
            client=self.client,
        )
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

        self.res_unit.refresh_from_db()
        img = self.res_unit.images.first()
        assert_that(img).is_none()


class ReservationUnitImageUpdateTestCase(GrapheneTestCaseBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.res_unit = ReservationUnitFactory()
        cls.res_unit_image = ReservationUnitImageFactory(
            reservation_unit=cls.res_unit, image_type="main"
        )

    def get_update_query(self):
        return """
        mutation updateReservationUnitImage($input: ReservationUnitImageUpdateMutationInput!) {
            updateReservationUnitImage(input: $input) {
                pk
                imageType
                errors {
                    messages field
                }
            }
        }
        """

    def get_valid_input_data(self):
        return {
            "pk": self.res_unit_image.id,
        }

    def test_update_image_type_success(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_input_data()
        input_data["imageType"] = "OTHER"

        response = self.query(self.get_update_query(), input_data=input_data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        update_data = content.get("data").get("updateReservationUnitImage")
        assert_that(update_data.get("errors")).is_none()
        assert_that(update_data.get("imageType")).is_equal_to("OTHER")
        self.res_unit_image.refresh_from_db()
        assert_that(self.res_unit_image.image_type).is_equal_to("other")

    def test_regular_user_cant_update(self):
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_input_data()
        input_data["imageType"] = "OTHER"

        response = self.query(self.get_update_query(), input_data=input_data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()


class ReservationUnitImageDeleteGraphQLTestCase(GrapheneTestCaseBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        res_unit = ReservationUnitFactory()
        cls.res_unit_image = ReservationUnitImageFactory(reservation_unit=res_unit)

    def get_delete_query(self):
        return """
            mutation deleteReservationUnitImage($input: ReservationUnitImageDeleteMutationInput!) {
                deleteReservationUnitImage(input: $input) {
                    deleted
                    errors
                }
            }
            """

    def test_reservation_unit_image_deleted(self):
        self.client.force_login(self.general_admin)
        response = self.query(
            self.get_delete_query(), input_data={"pk": self.res_unit_image.pk}
        )

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("deleteReservationUnitImage").get("errors")
        ).is_none()
        assert_that(
            content.get("data").get("deleteReservationUnitImage").get("deleted")
        ).is_true()

        assert_that(
            ReservationUnitImage.objects.filter(pk=self.res_unit_image.pk).exists()
        ).is_false()

    def test_regular_user_cannot_delete(self):
        self.client.force_login(self.regular_joe)
        response = self.query(
            self.get_delete_query(), input_data={"pk": self.res_unit_image.pk}
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).contains(
            "No permissions to perform delete."
        )

        assert_that(
            ReservationUnitImage.objects.filter(pk=self.res_unit_image.pk).exists()
        ).is_true()
