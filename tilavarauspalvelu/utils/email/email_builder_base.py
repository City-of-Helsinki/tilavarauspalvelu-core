from __future__ import annotations

import datetime
from dataclasses import asdict, dataclass
from typing import TYPE_CHECKING, Any
from urllib.parse import urlencode, urljoin

from django.conf import settings
from django.utils.timezone import get_default_timezone

from tilavarauspalvelu.exceptions import EmailBuilderConfigurationError
from tilavarauspalvelu.utils.email.email_validator import EmailTemplateValidator

if TYPE_CHECKING:
    from django.db.models.fields.files import FieldFile

    from config.utils.commons import LanguageType
    from tilavarauspalvelu.enums import EmailType
    from tilavarauspalvelu.models import EmailTemplate


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
        self._validate_template()

    def _validate_template(self) -> None:
        """
        Validate that the template type is supported by this builder.
        This way we get an early error if trying to e.g. send a reservation email with an application email builder.
        """
        if self.template.type not in self.email_template_types:
            msg = f"Email template type '{self.template.type}' is not supported by this builder."
            raise EmailBuilderConfigurationError(msg)

        self.validator.validate_string(self.template.subject)

    # Helper methods
    def _get_field_by_language(self, instance: Any, field: str) -> str | FieldFile:
        """Get the field value for the given language. Default to Finnish if value is not found."""
        if field_value := getattr(instance, f"{field}_{self.context.language}", None):
            return field_value
        return getattr(instance, field, "")

    # The important methods
    def get_subject(self) -> str:
        subject = self._get_field_by_language(self.template, "subject")
        return self.validator.render_string(string=subject)

    def get_content(self) -> str:
        return self.validator.render_template(template_path=self.template.text_template_path)

    def get_html_content(self) -> str:
        return self.validator.render_template(template_path=self.template.html_template_path)
