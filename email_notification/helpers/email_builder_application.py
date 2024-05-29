from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING
from urllib.parse import urljoin

from django.conf import settings

from common.utils import safe_getattr
from email_notification.helpers.email_builder_base import BaseEmailBuilder, BaseEmailContext
from email_notification.models import EmailTemplate, EmailType

if TYPE_CHECKING:
    from applications.models import Application
    from tilavarauspalvelu.utils.commons import LanguageType


@dataclass
class ApplicationEmailContext(BaseEmailContext):
    my_applications_ext_link: str

    # Builders
    @classmethod
    def build(cls, language: LanguageType) -> ApplicationEmailContext:
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
        EmailType.APPLICATION_IN_ALLOCATION,
        EmailType.APPLICATION_RECEIVED,
    ]

    def __init__(self, template: EmailTemplate, context: ApplicationEmailContext):
        super().__init__(template=template, context=context)

    @classmethod
    def from_application(
        cls,
        *,
        template: EmailTemplate,
        application: Application,
        forced_language: LanguageType | None = None,
    ) -> ApplicationEmailBuilder:
        """Build an email for only a single application"""
        language = settings.LANGUAGE_CODE
        if forced_language:
            language = forced_language
        elif user_language := safe_getattr(application.user, "preferred_language"):
            language = user_language

        return cls.build(template=template, language=language)

    @classmethod
    def build(cls, *, template: EmailTemplate, language: LanguageType) -> ApplicationEmailBuilder:
        """Build an email for multiple applications in a single language"""
        return ApplicationEmailBuilder(
            template=template,
            context=ApplicationEmailContext.build(language),
        )
