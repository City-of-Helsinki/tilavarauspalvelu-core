from __future__ import annotations

import re
from contextlib import contextmanager
from functools import wraps
from types import SimpleNamespace
from typing import TYPE_CHECKING, Any, Self, cast
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
from graphene_django_extensions.testing.client import GQLResponse as BaseGQLResponse

if TYPE_CHECKING:
    from collections.abc import Callable, Generator
    from types import TracebackType
    from unittest.mock import NonCallableMock

    from django.http import HttpRequest

    from tilavarauspalvelu.enums import UserRoleChoice
    from tilavarauspalvelu.models import User
    from tilavarauspalvelu.typing import AnonymousUser, HTTPMethod, Lang

__all__ = [
    "GQLResponse",
    "GraphQLClient",
    "ResponseMock",
    "TranslationsFromPOFiles",
    "anonymous_user",
    "as_mock",
    "exact",
]


class GQLResponse(BaseGQLResponse):
    """
    GraphQL response where the JSON data has the type 'Any'.
    Tests know the shape of the data they ask for, so they can read it without type checks.
    """

    def __getitem__(self, item: str) -> Any:
        return super().__getitem__(item)

    @property
    def data(self) -> Any:
        return super().data

    @property
    def first_query_object(self) -> Any:
        return super().first_query_object


class GraphQLClient(BaseGraphQLClient):
    response_class = GQLResponse

    def __call__(
        self,
        query: str,
        input_data: dict[str, Any] | None = None,
        variables: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
        operation_name: str | None = None,
    ) -> GQLResponse:
        response = super().__call__(
            query,
            input_data=input_data,
            variables=variables,
            headers=headers,
            operation_name=operation_name,
        )
        assert isinstance(response, GQLResponse)
        return response

    def login_with_superuser(self, username: str = "admin", **kwargs: Any) -> User:
        from tilavarauspalvelu.models import User

        user = super().login_with_superuser(username, **kwargs)
        assert isinstance(user, User)
        return user

    def login_with_regular_user(self, username: str = "user", **kwargs: Any) -> User:
        from tilavarauspalvelu.models import User

        user = super().login_with_regular_user(username, **kwargs)
        assert isinstance(user, User)
        return user

    def login_user_with_role(self, role: UserRoleChoice) -> User:
        """Login with a user with the given role."""
        from .factories import UserFactory

        user = UserFactory.create_with_general_role(role=role)
        self.force_login(user)
        return user


class ResponseMock:
    def __init__(
        self,
        *,
        json_data: Any = None,
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

    def json(self) -> Any:
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
        method_path = method.__module__ + "." + method.__qualname__
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
    ) -> None:
        self.patch.__exit__(exc_type, exc_val, exc_tb)


class TranslationsFromPOFiles:
    """
    Mock django translations by fetching current uncompiled translations from .po files.
    This is useful, since translations aren't otherwise active during tests.

    >>> with TranslationsFromPOFiles():
    ...     # Do stuff with translations
    """

    translations: dict[Lang, polib.POFile]
    language_options: tuple[Lang, ...] = ("fi", "sv", "en")
    default_language: Lang = settings.LANGUAGE_CODE  # type: ignore[assignment]

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

    def __init__(self) -> None:
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

    def npgettext(self, context: str, singular: str, plural: str, number: int) -> str:
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

    def get_language_from_request(self, request: HttpRequest, check_path: bool = False) -> str:  # noqa: FBT002
        return trans_real.get_language_from_request(request, check_path)

    def get_language_from_path(self, path: str) -> str | None:
        return trans_real.get_language_from_path(path)

    def get_supported_language_variant(self, lang_code: Lang, strict: bool = False) -> str:  # noqa: FBT002
        if "fi" in lang_code:
            return "fi"
        if "sv" in lang_code:
            return "sv"
        if "en" in lang_code:
            return "en"

        msg = f"Language '{lang_code}' is not supported"
        raise LookupError(msg)


def as_mock(method: object) -> mock.Mock:
    """
    Return the mock that a patch has put in place of the given method or object.
    mypy sees the original type, so use this to read the attributes of the mock.

    >>> @patch_method(MyClass.my_method)
    >>> def test_something() -> None:
    >>>     ...
    >>>     assert as_mock(MyClass.my_method).call_count == 1
    """
    if not isinstance(method, mock.Mock):
        msg = f"'{method}' is not patched with a mock."
        pytest.fail(msg)
    return method


def anonymous_user() -> AnonymousUser:
    """
    Return an anonymous user with the type that the code expects.
    The user model module adds the 'permissions' attribute to the Django class at import time.
    """
    from django.contrib.auth.models import AnonymousUser as DjangoAnonymousUser

    return cast("AnonymousUser", DjangoAnonymousUser())


def exact(msg: str) -> str:
    """Use in `with pytest.raises(..., match=exact(msg))` to match the 'msg' string exactly."""
    return f"^{re.escape(msg)}$"


@contextmanager
def use_retries(attempts: int = 1) -> Generator[None]:
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
