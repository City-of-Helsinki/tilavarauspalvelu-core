from __future__ import annotations

import os
import re
from dataclasses import asdict
from typing import TYPE_CHECKING

from django.conf import settings
from django.core.exceptions import ValidationError
from jinja2.exceptions import TemplateError
from jinja2.sandbox import SandboxedEnvironment

from email_notification.exceptions import EmailTemplateValidationError
from email_notification.templatetags import format_currency

if TYPE_CHECKING:
    from django.core.files.uploadedfile import InMemoryUploadedFile

    from email_notification.helpers.email_builder_base import BaseEmailContext

EMAIL_TEMPLATE_SUPPORTED_EXPRESSIONS = ["if", "elif", "else", "endif"]
FILTERS_MAP = {"currency": format_currency}


class EmailTemplateValidator:
    """Helper class used to validate and safely render email templates."""

    _env: None | SandboxedEnvironment  # Jinja2 environment
    context: BaseEmailContext

    def __init__(self, context: BaseEmailContext) -> None:
        self._env = None
        self.context = context

    @property
    def env(self) -> SandboxedEnvironment:
        """Create a sandboxed Jinja2 environment to safely render the email templates."""
        if self._env:
            return self._env

        self._env = SandboxedEnvironment()
        for fil, func in FILTERS_MAP.items():
            self._env.filters[fil] = func

        return self._env

    def _validate_tags(self, string: str) -> None:
        """Validate that the given string does not contain tags that are not defined in the context"""
        # Matches "{{word}}", "{{ word }}", "{{word1 | word2}}" or "{{ word1 | word2 }}".
        # Note, this doesn't match the preferred format with spaces around the pipe: "{{word1|word2}}"
        bracket_lookup = re.compile(r"{{ *(\w+) \| *(\w+) *}}|{{ *(\w+) *}}")

        tags_inside_brackets = re.findall(bracket_lookup, string)
        variable_tags = []

        for strings in tags_inside_brackets:
            strings_list = [tag for tag in strings if tag and tag not in FILTERS_MAP]
            variable_tags.append(strings_list[0])

        for tag in variable_tags:
            if tag not in self.context.fields:
                raise EmailTemplateValidationError(f"Tag '{tag}' is not supported")

    @staticmethod
    def _validate_illegals(string: str) -> None:
        """Validate that the given string does not contain illegal tags."""
        # Matches "{% word %}".
        expression_lookup = re.compile(r"{% *(\w+) *")

        expressions = re.findall(expression_lookup, string)
        for expression in expressions:
            if expression not in EMAIL_TEMPLATE_SUPPORTED_EXPRESSIONS:
                raise EmailTemplateValidationError(f"Illegal tags found: tag was '{expression}'")

    def render_string(self, string: str) -> str:
        """Render the given string with the given context in a safe, sandboxed environment."""
        try:
            return self.env.from_string(string).render(asdict(self.context))
        except TemplateError as e:
            raise EmailTemplateValidationError(e) from e

    def validate_string(self, string: str) -> None:
        self._validate_illegals(string)
        self._validate_tags(string)
        self.render_string(string)

    def validate_html_file(self, value: InMemoryUploadedFile) -> None:
        # File extension
        file_extension = os.path.splitext(value.name)[1]
        if file_extension.lower() != ".html":
            raise ValidationError(f"Unsupported file extension {file_extension}. Only .html files are allowed")

        # File size
        if value.size <= 0 or value.size > settings.EMAIL_HTML_MAX_FILE_SIZE:
            msg = f"Invalid HTML file size. Allowed file size: 1-{settings.EMAIL_HTML_MAX_FILE_SIZE} bytes."
            raise ValidationError(msg)

        # File content
        try:
            file = value.open()
            content = file.read().decode("utf-8")
            self.validate_string(content)
        except EmailTemplateValidationError as err:
            raise ValidationError(err.message) from err
        except Exception as err:
            raise ValidationError(f"Unable to read the HTML file: {err!s}") from err
