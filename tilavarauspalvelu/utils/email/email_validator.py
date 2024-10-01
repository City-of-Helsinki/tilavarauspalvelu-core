from __future__ import annotations

import re
from dataclasses import asdict
from typing import TYPE_CHECKING

import mjml
from jinja2 import FileSystemLoader
from jinja2.exceptions import TemplateError
from jinja2.sandbox import SandboxedEnvironment

from tilavarauspalvelu.exceptions import EmailTemplateValidationError
from tilavarauspalvelu.templatetags import format_currency
from tilavarauspalvelu.utils.email.email_translations import EMAIL_TRANSLATIONS

if TYPE_CHECKING:
    from tilavarauspalvelu.utils.email.email_builder_base import BaseEmailContext


EMAIL_TEMPLATE_SUPPORTED_EXPRESSIONS = ["if", "elif", "else", "endif"]
FILTERS_MAP = {"currency": format_currency}


class EmailTemplateValidator:
    """Helper class used to validate and safely render email templates."""

    env: SandboxedEnvironment  # Jinja2 environment
    context: BaseEmailContext
    translations: dict[str, str]

    def __init__(self, context: BaseEmailContext) -> None:
        self.context = context

        # Create a sandboxed Jinja2 environment to safely render the email templates.
        self.env = SandboxedEnvironment(loader=FileSystemLoader("templates"))
        for fil, func in FILTERS_MAP.items():
            self.env.filters[fil] = func

        self.translations = self._load_translations()

    def _load_translations(self) -> dict[str, str]:
        """Load the translations for the current language into the Jinja2 environment."""
        translations = {}

        for key, t in EMAIL_TRANSLATIONS.items():
            # Extract the translation for the given language
            translation = t.get(self.context.language, "")

            # If the translation contains variable tags, pre-render them
            if "{{" in translation:
                translation = self.render_string(translation)

            translations[key] = translation

        return translations

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

    def render_template(self, template_path: str) -> str:
        """Render the given template with the given context in a safe, sandboxed environment."""
        markup = self.env.get_template(template_path).render(asdict(self.context) | self.translations)
        if markup.startswith("<mjml>"):
            return mjml.mjml2html(markup)
        return markup
