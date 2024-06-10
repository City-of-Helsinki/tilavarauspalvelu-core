from __future__ import annotations

import datetime
from dataclasses import asdict, dataclass
from typing import TYPE_CHECKING, Any
from urllib.parse import urlencode, urljoin

from django.conf import settings
from django.utils.timezone import get_default_timezone

from email_notification.exceptions import EmailBuilderConfigurationError
from email_notification.helpers.email_validator import EmailTemplateValidator

if TYPE_CHECKING:
    from django.db.models.fields.files import FieldFile

    from config.utils.commons import LanguageType
    from email_notification.models import EmailTemplate, EmailType


@dataclass
class BaseEmailContext:
    """
    Base class for the context used to render the email templates.

    This class holds all the data required to render the email templates, and nothing else.
    """

    language: LanguageType
    varaamo_ext_link: str
    feedback_ext_link: str
    current_year: int

    @property
    def fields(self) -> list[str]:
        return list(asdict(self).keys())

    # Builders
    @classmethod
    def from_mock_data(cls) -> BaseEmailContext:
        """Used to validate the email template content in Django Admin."""
        raise NotImplementedError

    # Helpers
    @classmethod
    def _get_common_kwargs(cls, language) -> dict[str, Any]:
        return {
            "language": language,
            "varaamo_ext_link": cls._get_varaamo_ext_link(language),
            "feedback_ext_link": cls._get_feedback_ext_link(language),
            "current_year": cls._get_current_year(),
        }

    @staticmethod
    def _get_varaamo_ext_link(language: LanguageType | None) -> str:
        url_base = settings.EMAIL_VARAAMO_EXT_LINK
        if language.lower() != "fi":
            return urljoin(url_base, language)
        return url_base

    @staticmethod
    def _get_feedback_ext_link(language: LanguageType | None) -> str:
        params = urlencode({"lang": language})
        return f"{settings.EMAIL_FEEDBACK_EXT_LINK}?{params}"

    @staticmethod
    def _get_current_year() -> int:
        return datetime.datetime.now(get_default_timezone()).year


class BaseEmailBuilder:
    """
    Base class for the email notification builders.

    This class is used to compose the email subject and content from an EmailTemplate and the context.
    """

    template: EmailTemplate
    context: BaseEmailContext
    validator: EmailTemplateValidator
    email_template_types: list[EmailType]

    # Init methods
    def __init__(self, *, template: EmailTemplate, context: BaseEmailContext) -> None:
        self.template = template
        self.context = context

        self.validator = EmailTemplateValidator(context=self.context)
        self._validate_template_type()
        self._validate_template_content()

    def _validate_template_type(self) -> None:
        """
        Validate that the template type is supported by this builder.
        This way we get an early error if trying to e.g. send a reservation email with an application email builder.
        """
        if self.template.type not in self.email_template_types:
            msg = f"Email template type '{self.template.type}' is not supported by this builder."
            raise EmailBuilderConfigurationError(msg)

    def _validate_template_content(self) -> None:
        html_content = self._get_html_content()
        if html_content:
            self.validator.validate_string(html_content)

        self.validator.validate_string(self.template.subject)
        self.validator.validate_string(self.template.content)

    # Helper methods
    def _get_field_by_language(self, instance: Any, field: str) -> str | FieldFile:
        """Get the field value for the given language. Default to Finnish if value is not found."""
        if field_value := getattr(instance, f"{field}_{self.context.language}", None):
            return field_value
        return getattr(instance, field, "")

    def _get_html_content(self) -> str:
        html_template_file = self._get_field_by_language(self.template, "html_content")
        if not html_template_file:
            return ""
        return html_template_file.open().read().decode("utf-8")

    # The important methods
    def get_subject(self) -> str:
        subject = self._get_field_by_language(self.template, "subject")
        return self.validator.render_string(string=subject)

    def get_content(self) -> str:
        content = self._get_field_by_language(self.template, "content")
        return self.validator.render_string(string=content)

    def get_html_content(self) -> str | None:
        content = self._get_html_content()
        if not content:
            return None
        return self.validator.render_string(string=content)
