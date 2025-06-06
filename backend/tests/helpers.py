from __future__ import annotations

import re
from contextlib import contextmanager
from functools import wraps
from types import SimpleNamespace
from typing import TYPE_CHECKING, Any, Self
from unittest import mock
from unittest.mock import patch

import polib
import pytest
import stamina
from django.conf import settings
from django.utils import translation
from django.utils.functional import lazy
from django.utils.translation import trans_real
from graphene_django_extensions.testing import GraphQLClient as BaseGraphQLClient

if TYPE_CHECKING:
    from collections.abc import Callable
    from types import TracebackType
    from unittest.mock import NonCallableMock

    from django.http import HttpRequest

    from tilavarauspalvelu.enums import UserRoleChoice
    from tilavarauspalvelu.models import User
    from tilavarauspalvelu.typing import HTTPMethod, Lang

__all__ = [
    "GraphQLClient",
    "ResponseMock",
    "TranslationsFromPOFiles",
    "exact",
]


class GraphQLClient(BaseGraphQLClient):
    def login_user_with_role(self, role: UserRoleChoice) -> User | None:
        """Login with a user with the given role."""
        from .factories import UserFactory

        user = UserFactory.create_with_general_role(role=role)
        self.force_login(user)
        return user


class ResponseMock:
    def __init__(
        self,
        *,
        json_data: dict[str, Any] | None = None,
        text: str = "",
        status_code: int = 200,
        method: HTTPMethod = "GET",
        url: str = "http://example.com",
    ) -> None:
        self.json_data = json_data or {}
        self.status_code = status_code
        self.text = text
        self.request = SimpleNamespace(method=method)
        self.url = url

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

    def __call__[**P, T](self, func: Callable[P, T]) -> Callable[P, T]:
        @wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            # Run the test with the method patched
            with self.patch:
                return func(*args, **kwargs)

        return wrapper

    def __enter__(self) -> NonCallableMock:
        return self.patch.__enter__()

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None,
    ) -> bool | None:
        return self.patch.__exit__(exc_type, exc_val, exc_tb)


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
        entry = self.translations[self.language].find(message, by="msgid")
        if entry is None:
            return message
        return entry.msgstr

    gettext_lazy = lazy(gettext, str)

    def pgettext(self, context: str, message: str) -> str:
        if self.language == "en":
            return message
        entry = self.translations[self.language].find(message, by="msgid", msgctxt=context)
        if entry is None:
            return message
        return entry.msgstr

    pgettext_lazy = lazy(pgettext, str)

    def ngettext(self, singular: str, plural: str, number: int) -> str:
        raise NotImplementedError

    def ngettext_lazy(self, singular: str, plural: str, number: int) -> str:
        raise NotImplementedError

    def npgettext(self, context, singular, plural, number):
        raise NotImplementedError

    def activate(self, language: Lang) -> None:
        if language not in self.language_options:
            msg = f"Language '{language}' is not supported"
            raise LookupError(msg)
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

    def get_language_from_request(self, request: HttpRequest, check_path: bool = False):  # noqa: FBT002
        return trans_real.get_language_from_request(request, check_path)

    def get_language_from_path(self, request: HttpRequest) -> None:
        return trans_real.get_language_from_path(request)

    def get_supported_language_variant(self, lang_code: Lang, strict: bool = False) -> str:  # noqa: FBT002
        if "fi" in lang_code:
            return "fi"
        if "sv" in lang_code:
            return "sv"
        if "en" in lang_code:
            return "en"

        msg = f"Language '{lang_code}' is not supported"
        raise LookupError(msg)


def exact(msg: str) -> str:
    """Use in `with pytest.raises(..., match=exact(msg))` to match the 'msg' string exactly."""
    return f"^{re.escape(msg)}$"


@contextmanager
def use_retries(attempts: int = 1):
    """Enable given amount of retries for the duration of a test bu using the this manager."""
    is_active = stamina.is_active()
    is_testing = stamina.is_testing()
    try:
        stamina.set_active(True)
        stamina.set_testing(True, attempts=attempts)
        yield
    finally:
        stamina.set_active(is_active)
        stamina.set_testing(is_testing)
