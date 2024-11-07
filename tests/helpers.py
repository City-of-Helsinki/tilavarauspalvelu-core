import uuid
from collections.abc import Callable
from functools import wraps
from typing import Any, NamedTuple, ParamSpec, Self, TypeVar
from unittest import mock
from unittest.mock import patch

import polib
import pytest
from django.conf import settings
from django.http import HttpRequest
from django.test import override_settings
from django.test.signals import root_urlconf_changed
from django.urls import NoReverseMatch, URLResolver, include, path, reverse
from django.utils import translation
from django.utils.functional import lazy
from django.utils.translation import trans_real
from graphene_django_extensions.testing import GraphQLClient as BaseGraphQLClient

from tilavarauspalvelu.enums import UserRoleChoice
from tilavarauspalvelu.models import User
from tilavarauspalvelu.typing import Lang

__all__ = [
    "GraphQLClient",
    "ResponseMock",
    "TranslationsFromPOFiles",
]


T = TypeVar("T")
P = ParamSpec("P")

TNamedTuple = TypeVar("TNamedTuple", bound=NamedTuple)


class GraphQLClient(BaseGraphQLClient):
    def login_user_with_role(self, role: UserRoleChoice) -> User | None:
        """Login with a user with the given role."""
        from .factories import UserFactory

        user = UserFactory.create_with_general_role(role=role)
        self.force_login(user)
        return user


class ResponseMock:
    def __init__(self, json_data: dict[str, Any], status_code: int = 200) -> None:
        self.json_data = json_data
        self.status_code = status_code

    def json(self) -> dict[str, Any]:
        return self.json_data


class patch_method:
    """
    Patch a method inside a class.

    Used in place of 'mock.patch' to have the 'method' argument as a function instead of a string.
    Does not work on functions declared outside of classes.

    >>> @patch_method(MyClass.my_method, return_value=...)
    >>> def test_something(...):
    >>>     ...

    or

    >>> @patch_method(MyClass.my_method)
    >>> def test_something(...):
    >>>     MyClass.my_method.return_value = ...
    >>>     ...

    or

    >>> def test_something(...):
    >>>     with patch_method(MyClass.my_method, return_value=...):
    >>>         ...
    """

    def __init__(self, method: Callable, return_value: Any = None, side_effect: Any = None) -> None:
        # Get the full path to the method, e.g., 'module.submodule.Class.method'
        method_path = method.__module__ + "." + method.__qualname__  # type: ignore[attr-defined]
        self.patch = mock.patch(method_path, return_value=return_value, side_effect=side_effect)

    def __call__(self, func: Callable[P, T]) -> Callable[P, T]:
        @wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            # Run the test with the method patched
            with self.patch:
                return func(*args, **kwargs)

        return wrapper

    def __enter__(self) -> Any:
        return self.patch.__enter__()

    def __exit__(self, *exc_info: object) -> Any:
        return self.patch.__exit__(*exc_info)


class TranslationsFromPOFiles:
    """
    Mock django translations by fetching current uncompiled translations from .po files.
    This is useful, since translations aren't otherwise active during tests.

    >>> with TranslationsFromPOFiles():
    ...     # Do stuff with translations
    """

    translations: dict[Lang, polib.POFile]
    language_options: tuple[Lang, ...] = ("fi", "sv", "en")
    default_language: Lang = settings.LANGUAGE_CODE

    def __new__(cls, *args: Any, **kwargs: Any) -> Any:
        # Load translations to the clas only once
        if not hasattr(cls, "contents"):
            from config.settings import Common

            cls.translations: dict[Lang, polib.POFile] = {}
            for lang in cls.language_options:
                # No explicit translations for English
                if lang == "en":
                    continue

                for locale_path in Common.LOCALE_PATHS:
                    path = str(locale_path / lang / "LC_MESSAGES" / "django.po")
                    file_contents = polib.pofile(path)

                    if lang not in cls.translations:
                        cls.translations[lang] = file_contents
                    else:
                        cls.translations[lang].merge(file_contents)

        return super().__new__(cls)

    def __init__(self):
        self.language: Lang = self.default_language

    def __enter__(self) -> Self:
        if not hasattr(translation, "_trans"):
            pytest.fail("Translations cannot be mocked. `_trans` not found in `django.utils.translation`.")

        self.patch = patch("django.utils.translation._trans", new=self)
        self.patch.start()
        return self

    def __exit__(self, *args: object, **kwargs: Any) -> None:
        if hasattr(self, "patch"):
            self.patch.stop()
            del self.patch

    # Django translation interface:

    def gettext_noop(self, message: str) -> str:
        return message

    def gettext(self, message: str) -> str:
        if self.language == "en":
            return message
        return self.translations[self.language].find(message, by="msgid").msgstr

    gettext_lazy = lazy(gettext, str)

    def pgettext(self, context: str, message: str) -> str:
        if self.language == "en":
            return message
        return self.translations[self.language].find(message, by="msgid", msgctxt=context).msgstr

    pgettext_lazy = lazy(pgettext, str)

    def ngettext(self, singular: str, plural: str, number: int) -> str:
        raise NotImplementedError

    def ngettext_lazy(self, singular: str, plural: str, number: int) -> str:
        raise NotImplementedError

    def npgettext(self, context, singular, plural, number):
        raise NotImplementedError

    def activate(self, language: Lang) -> None:
        assert language in self.language_options  # noqa: S101
        self.language = language

    def deactivate(self) -> None:
        self.language = self.default_language

    def deactivate_all(self) -> None:
        self.language = self.default_language

    def get_language(self) -> Lang:
        return self.language

    def get_language_bidi(self) -> bool:
        return self.language in settings.LANGUAGES_BIDI

    def check_for_language(self, language: Lang) -> bool:
        return language in self.language_options

    def get_language_from_request(self, request: HttpRequest, check_path: bool = False):
        return trans_real.get_language_from_request(request, check_path)

    def get_language_from_path(self, request: HttpRequest) -> None:
        return trans_real.get_language_from_path(request)

    def get_supported_language_variant(self, lang_code: Lang, strict: bool = False) -> str:
        if "fi" in lang_code:
            return "fi"
        if "sv" in lang_code:
            return "sv"
        if "en" in lang_code:
            return "en"

        msg = f"Language '{lang_code}' is not supported"
        raise LookupError(msg)


def with_mock_verkkokauppa(func: Callable[P, None]) -> Callable[P, None]:
    """Enables mock verkkokauppa API for the duration of the test."""

    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> None:
        from config.urls import urlpatterns

        urls: URLResolver = path(
            "mock_verkkokauppa/",
            include("tilavarauspalvelu.api.mock_verkkokauppa_api.urls", namespace="mock_verkkokauppa"),
        )

        missing = False

        # The mock verkkokauppa URLs are registered conditionally,
        # so we need to check it they exist and add them to 'urlpatterns' if they don't.
        try:
            reverse("mock_verkkokauppa:checkout", args=[str(uuid.uuid4())])
        except NoReverseMatch:
            missing = True
            urlpatterns.append(urls)
            root_urlconf_changed(setting="ROOT_URLCONF")

        try:
            with override_settings(MOCK_VERKKOKAUPPA_API_ENABLED=True):
                func(*args, **kwargs)
        finally:
            if missing:
                urlpatterns.remove(urls)
                root_urlconf_changed(setting="ROOT_URLCONF")

    return wrapper
