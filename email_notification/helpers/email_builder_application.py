from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING
from urllib.parse import urljoin

from django.conf import settings

from applications.models import Application
from email_notification.helpers.email_builder_base import BaseEmailBuilder, BaseEmailContext
from email_notification.models import EmailTemplate, EmailType
from tilavarauspalvelu.utils.commons import LanguageType

if TYPE_CHECKING:
    from email_notification.admin.email_tester import EmailTemplateTesterForm


@dataclass
class ApplicationEmailContext(BaseEmailContext):
    my_applications_ext_link: str

    # Builders
    @classmethod
    def from_application(cls, application: Application) -> ApplicationEmailContext:
        language: LanguageType = getattr(application.user, "preferred_language", None)
        if not language:
            language = settings.LANGUAGE_CODE

        return ApplicationEmailContext(
            # Links
            my_applications_ext_link=cls._get_my_applications_ext_link(language),
            # Common
            **cls._get_common_kwargs(language),
        )

    @classmethod
    def from_form(cls, form: EmailTemplateTesterForm, language: LanguageType) -> ApplicationEmailContext:
        return ApplicationEmailContext(
            # Links
            my_applications_ext_link=cls._get_my_applications_ext_link(language),
            # Common
            **cls._get_common_kwargs(language),
        )

    @classmethod
    def from_mock_data(cls) -> ApplicationEmailContext:
        """Used to validate the email template content in Django Admin."""
        language = settings.LANGUAGE_CODE
        return ApplicationEmailContext(
            # Links
            my_applications_ext_link=cls._get_my_applications_ext_link(language),
            # Common
            **cls._get_common_kwargs(language),
        )

    # Helpers
    @staticmethod
    def _get_my_applications_ext_link(language: LanguageType) -> str:
        url_base = settings.EMAIL_VARAAMO_EXT_LINK
        if language.lower() != "fi":
            url_base = urljoin(url_base, language) + "/"
        return urljoin(url_base, "applications")


class ApplicationEmailBuilder(BaseEmailBuilder):
    context: ApplicationEmailContext

    email_template_types = [
        EmailType.APPLICATION_HANDLED,
        EmailType.APPLICATION_IN_HANDLING,
        EmailType.APPLICATION_RECEIVED,
    ]

    def __init__(self, template: EmailTemplate, context: ApplicationEmailContext):
        super().__init__(template=template, context=context)

    @classmethod
    def from_application(cls, *, template: EmailTemplate, application: Application) -> ApplicationEmailBuilder:
        return ApplicationEmailBuilder(
            template=template,
            context=ApplicationEmailContext.from_application(application),
        )

    @classmethod
    def from_form(
        cls, *, template: EmailTemplate, form: EmailTemplateTesterForm, language: LanguageType
    ) -> ApplicationEmailBuilder:
        return ApplicationEmailBuilder(
            template=template,
            context=ApplicationEmailContext.from_form(form, language),
        )
