from unittest import mock

from assertpy import assert_that
from django.conf import settings
from snapshottest.django import TestCase

from opening_hours.enums import ResourceType
from opening_hours.resources import (
    Resource,
    send_resource_to_hauki,
    update_hauki_resource,
)


class SendResourceToHaukiTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.resource = Resource(
            id=None,
            name="Test Resource",
            description="",
            address="",
            children=[],
            parents=[1],
            organization="1234",
            origin_id="4321",
            origin_data_source_name="DataSource",
            origin_data_source_id="dts",
        )

    def get_send_response(self):
        return {
            "id": 1,
            "name": self.resource.name,
            "description": "",
            "address": None,
            "resource_type": self.resource.resource_type.value,
            "children": self.resource.children,
            "parents": self.resource.parents,
            "organization": self.resource.organization,
            "origins": [
                {
                    "data_source": {
                        "id": self.resource.origin_data_source_id,
                        "name": self.resource.origin_data_source_name,
                    },
                    "origin_id": self.resource.origin_id,
                }
            ],
            "extra_data": {},
            "is_public": True,
            "timezone": "Europe/Helsinki",
        }

    @mock.patch("opening_hours.resources.make_hauki_post_request")
    def test_send(self, send_mock):
        send_mock.return_value = self.get_send_response()
        settings.HAUKI_API_URL = "themagicapiurl"
        settings.HAUKI_SECRET = "verysecretcode"
        data = send_resource_to_hauki(self.resource)
        assert_that(data).is_not_none()
        assert_that(data.id).is_not_none()

    @mock.patch("opening_hours.resources.make_hauki_put_request")
    def test_update(self, put_mock):
        data = self.resource.convert_to_request_data()
        resource = Resource(
            id=1,
            name=data["name"],
            description=data["description"],
            address=data["address"],
            resource_type=ResourceType.RESERVABLE,
            children=data["children"],
            parents=data["parents"],
            organization=data["organization"],
            origin_id=data["origins"][0]["origin_id"],
            origin_data_source_name=data["origins"][0]["data_source"]["name"],
            origin_data_source_id=data["origins"][0]["data_source"]["id"],
        )

        put_mock.return_value = self.get_send_response()
        settings.HAUKI_API_URL = "themagicapiurl"
        settings.HAUKI_SECRET = "verysecretcode"
        data = update_hauki_resource(resource)
        assert_that(data).is_not_none()
        assert_that(data.id).is_not_none()

    @mock.patch("opening_hours.resources.make_hauki_put_request")
    def test_update_raises_when_no_resource_id(self, put_mock):
        put_mock.return_value = self.get_send_response()
        settings.HAUKI_API_URL = "themagicapiurl"
        settings.HAUKI_SECRET = "verysecretcode"
        with self.assertRaises(ValueError):
            update_hauki_resource(self.resource)
