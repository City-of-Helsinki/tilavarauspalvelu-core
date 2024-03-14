from unittest import mock

import pytest
from django.conf import settings
from django.core.exceptions import ValidationError
from django.test import override_settings

from email_notification.sender.email_notification_validator import EmailTemplateValidator


@override_settings(EMAIL_HTML_MAX_FILE_SIZE=150000)
def test_raises_validation_error_on_invalid_file_extension():
    mock_field_file = mock.MagicMock()
    mock_field_file.name = "/tmp/mock_template.jpg"
    mock_field_file.size = settings.EMAIL_HTML_MAX_FILE_SIZE

    msg = "Unsupported file extension .jpg. Only .html files are allowed"
    with pytest.raises(ValidationError, match=msg):
        EmailTemplateValidator().validate_html_file(mock_field_file)


@override_settings(EMAIL_HTML_MAX_FILE_SIZE=150000)
def test_raises_validation_error_on_zero_size_file():
    mock_field_file = mock.MagicMock()
    mock_field_file.name = "/tmp/mock_template.html"
    mock_field_file.size = 0

    msg = f"Invalid HTML file size. Allowed file size: 1-{settings.EMAIL_HTML_MAX_FILE_SIZE} bytes"
    with pytest.raises(ValidationError, match=msg):
        EmailTemplateValidator().validate_html_file(mock_field_file)


@override_settings(EMAIL_HTML_MAX_FILE_SIZE=150000)
def test_raises_validation_error_on_big_file():
    mock_field_file = mock.MagicMock()
    mock_field_file.name = "/tmp/mock_template.html"
    mock_field_file.size = settings.EMAIL_HTML_MAX_FILE_SIZE + 1

    msg = f"Invalid HTML file size. Allowed file size: 1-{settings.EMAIL_HTML_MAX_FILE_SIZE} bytes"
    with pytest.raises(ValidationError, match=msg):
        EmailTemplateValidator().validate_html_file(mock_field_file)


@override_settings(EMAIL_HTML_MAX_FILE_SIZE=150000)
def test_raises_validation_error_on_unsupported_tag():
    mock_file = mock.MagicMock()
    mock_file.read.return_value = b"<html>{{invalid_tag}}</html>"

    mock_field_file = mock.MagicMock()
    mock_field_file.name = "/tmp/mock_template.html"
    mock_field_file.size = settings.EMAIL_HTML_MAX_FILE_SIZE
    mock_field_file.open.return_value = mock_file

    msg = "Tag 'invalid_tag' is not supported"
    with pytest.raises(ValidationError, match=msg):
        EmailTemplateValidator().validate_html_file(mock_field_file)


@override_settings(EMAIL_HTML_MAX_FILE_SIZE=150000)
def valid_file_raises_no_exceptions():
    mock_file = mock.MagicMock()
    mock_file.read.return_value = b"<html></html>"

    mock_field_file = mock.MagicMock()
    mock_field_file.name = "/tmp/mock_template.html"
    mock_field_file.size = settings.EMAIL_HTML_MAX_FILE_SIZE
    mock_field_file.open.return_value = mock_file

    EmailTemplateValidator().validate_html_file(mock_field_file)
