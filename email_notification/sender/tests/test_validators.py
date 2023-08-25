from unittest import mock

from assertpy import assert_that
from django.conf import settings
from django.core.exceptions import ValidationError
from django.test import override_settings
from django.test.testcases import TestCase
from pytest import raises

from ..email_notification_builder import EmailTemplateValidator


@override_settings(EMAIL_HTML_MAX_FILE_SIZE=150000)
class HTMLFileValidatorTestCase(TestCase):
    def setUp(self) -> None:
        self.validator = EmailTemplateValidator()

    def test_raises_validation_error_on_invalid_file_extension(self):
        mock_field_file = mock.MagicMock()
        mock_field_file.name = "/tmp/mock_template.jpg"
        mock_field_file.size = settings.EMAIL_HTML_MAX_FILE_SIZE

        with raises(ValidationError) as err:
            self.validator.validate_html_file(mock_field_file)
        assert_that(err.value.message).is_equal_to("Unsupported file extension .jpg. Only .html files are allowed")

    def test_raises_validation_error_on_zero_size_file(self):
        mock_field_file = mock.MagicMock()
        mock_field_file.name = "/tmp/mock_template.html"
        mock_field_file.size = 0

        with raises(ValidationError) as err:
            self.validator.validate_html_file(mock_field_file)
        assert_that(err.value.message).is_equal_to(
            f"Invalid HTML file size. Allowed file size: 1-{settings.EMAIL_HTML_MAX_FILE_SIZE} bytes"
        )

    def test_raises_validation_error_on_big_file(self):
        mock_field_file = mock.MagicMock()
        mock_field_file.name = "/tmp/mock_template.html"
        mock_field_file.size = settings.EMAIL_HTML_MAX_FILE_SIZE + 1

        with raises(ValidationError) as err:
            self.validator.validate_html_file(mock_field_file)
        assert_that(err.value.message).is_equal_to(
            f"Invalid HTML file size. Allowed file size: 1-{settings.EMAIL_HTML_MAX_FILE_SIZE} bytes"
        )

    def test_raises_validation_error_on_unsupported_tag(self):
        mock_file = mock.MagicMock()
        mock_file.read.return_value = b"<html>{{invalid_tag}}</html>"

        mock_field_file = mock.MagicMock()
        mock_field_file.name = "/tmp/mock_template.html"
        mock_field_file.size = settings.EMAIL_HTML_MAX_FILE_SIZE
        mock_field_file.open.return_value = mock_file

        with raises(ValidationError) as err:
            self.validator.validate_html_file(mock_field_file)
        assert_that(err.value.message).is_equal_to("Tag invalid_tag not supported")

    def valid_file_raises_no_exceptions(self):
        mock_file = mock.MagicMock()
        mock_file.read.return_value = b"<html></html>"

        mock_field_file = mock.MagicMock()
        mock_field_file.name = "/tmp/mock_template.html"
        mock_field_file.size = settings.EMAIL_HTML_MAX_FILE_SIZE
        mock_field_file.open.return_value = mock_file

        self.validator.validate_html_file(mock_field_file)
