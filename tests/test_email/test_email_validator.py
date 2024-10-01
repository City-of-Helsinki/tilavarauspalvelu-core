import re

import pytest

from tilavarauspalvelu.exceptions import EmailTemplateValidationError
from tilavarauspalvelu.utils.email.email_builder_reservation import ReservationEmailContext
from tilavarauspalvelu.utils.email.email_validator import EmailTemplateValidator


def test_email_validator__raises__validation_error_on_unsupported_tag():
    string = "<html>{{invalid_tag}}</html>"

    msg = "Tag 'invalid_tag' is not supported"
    with pytest.raises(EmailTemplateValidationError, match=re.escape(msg)):
        EmailTemplateValidator(ReservationEmailContext.from_mock_data()).validate_string(string)


def test_email_validator__raises__validation_error_on_illegal_tag():
    string = "<html>{% invalid_tag %}</html>"

    msg = "Illegal tags found: tag was 'invalid_tag'"
    with pytest.raises(EmailTemplateValidationError, match=re.escape(msg)):
        EmailTemplateValidator(ReservationEmailContext.from_mock_data()).validate_string(string)


def valid_email_validator__file_raises_no_exceptions_with_supported_tag():
    string = "<html>{{supported_tag}}</html>"

    context = ReservationEmailContext.from_mock_data()
    validator = EmailTemplateValidator(context)
    validator.context_variables = ["supported_tag"]
    validator.validate_string(string)
