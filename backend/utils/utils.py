from __future__ import annotations

import base64
import datetime
import hashlib
import hmac
import inspect
import json
import operator
import re
import sys
import unicodedata
import urllib.parse
from contextlib import contextmanager
from typing import TYPE_CHECKING, Any, NamedTuple

from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models.manager import BaseManager
from django.utils.module_loading import import_string
from django.utils.translation import get_language_from_path, get_language_from_request
from html2text import HTML2Text  # noqa: TID251
from rest_framework.exceptions import ValidationError
from rest_framework.fields import get_error_detail

from tilavarauspalvelu.enums import Language
from utils.date_utils import local_datetime

if TYPE_CHECKING:
    from collections.abc import Generator, Iterable
    from types import FrameType

    from django.db import models
    from django.db.models.manager import Manager
    from django.http import HttpRequest

    from tilavarauspalvelu.typing import AnyUser, Lang, TextSearchLang

__all__ = [
    "LazyModelAttribute",
    "LazyModelManager",
    "comma_sep_str",
    "get_text_search_language",
    "only_django_validation_errors",
    "only_drf_validation_errors",
    "to_ascii",
    "to_django_validation_error",
    "to_drf_validation_error",
    "update_query_params",
    "with_indices",
]


def to_ascii(string: str) -> str:
    """Convert all non-ASCII characters in the string to their ASCII equivalents."""
    return unicodedata.normalize("NFKD", string).encode("ascii", "ignore").decode("ascii")


def comma_sep_str(values: Iterable[Any], *, last_sep: str = "&", quote: bool = False) -> str:
    """
    Return a comma separated string of the given values,
    with the value of `last_sep` before the last value.
    Remove any empty values.

    >>> comma_sep_str(["foo", "bar", "baz"])
    "foo, bar & baz"

    >>> comma_sep_str(["foo", "bar", "baz"], last_sep="or", quote=True)
    "'foo', 'bar' or 'baz'"
    """
    string: str = ""
    previous_value: str = ""
    values_iter = iter(values)
    try:
        while value := str(next(values_iter)):
            if previous_value:
                if string:
                    string += ", "
                string += f"'{previous_value}'" if quote else previous_value
            previous_value = value
    except StopIteration:
        if string:
            string += f" {last_sep} "
        string += f"'{previous_value}'" if quote else previous_value

    return string


class with_indices[T]:  # noqa: N801, RUF100
    """
    Iterate list items with indexes in a way that is safe for deletion.
    This can be used as a deletion safe replacement for `enumerate()`.

    When deleting items, must set the `item_deleted` attribute to `True`.
    Only one item can be deleted per iteration.

    >>> items = [1, 2, 2, 3, 4, 5, 5, 6, 8, 7]
    >>> for i, item in (gen := with_indices(items)):
    ...     if item % 2 == 0:
    ...         del items[i]
    ...         # Set when item has been deleted.
    ...         gen.item_deleted = True
    ...     if item % 3 == 0:
    ...         # Added items will be handled at the end
    ...         items.append(10)
    >>> items
    [1, 3, 5, 5, 7]
    """

    def __init__(self, _seq: list[T], /) -> None:
        self.seq = _seq
        self.item_deleted: bool = False

    def __iter__(self) -> Generator[tuple[int, T]]:
        i: int = 0
        next_item: T = None
        gen = enumerate(self.seq)
        while True:
            if next_item is not None:
                item = next_item
                next_item = None
                yield i, item

            else:
                try:
                    i, item = next(gen)
                except StopIteration:
                    return

                yield i, item

            if self.item_deleted:
                self.item_deleted = False
                try:
                    next_item = self.seq[i]
                except IndexError:  # last item was deleted, exit
                    return

    def delete_item(self, i: int) -> None:
        del self.seq[i]
        self.item_deleted = True


def get_text_search_language(request: HttpRequest) -> TextSearchLang:
    """
    Get appropriate text search language for the given request.
    Use preferred language if user is authenticated, otherwise use the language from the request.
    """
    lang_code = get_request_language(request)
    return "swedish" if lang_code == "sv" else "english" if lang_code == "en" else "finnish"


def get_request_language(request: HttpRequest) -> Lang:
    referer = request.META.get("HTTP_REFERER")
    user: AnyUser = request.user

    if user.is_authenticated:
        return user.get_preferred_language()

    if referer:
        path = urllib.parse.urlparse(referer).path
        lang_code = get_language_from_path(path)
    else:
        lang_code = get_language_from_request(request, check_path=True)

    if lang_code in Language.values:
        return lang_code  # type: ignore[return-value]
    return Language.FI.value  # type: ignore[return-value]


def safe_getattr(obj: object, dotted_path: str, default: Any = None) -> Any:
    """
    Examples:
        >>> safe_getattr(object, "__class__.__name__.__class__.__name__")
        'str'
        >>> safe_getattr(object, "foo.bar.baz") is None
        True
        >>> safe_getattr(object, "foo.bar.baz", default="")
        ''
    """
    try:
        return operator.attrgetter(dotted_path)(obj)
    except AttributeError:
        return default


def log_text_search(where: str, text: str) -> None:
    """
    Log text search to the cache for the next 4 weeks.
    This is used for analysis of the text search performance.

    :param where: Where the text search was performed.
    :param text: Text search query.
    """
    key = f"text_search:{where}:{local_datetime().isoformat()}"
    cache_time_seconds = int(datetime.timedelta(days=settings.TEXT_SEARCH_CACHE_TIME_DAYS).total_seconds())
    cache.set(key, text, timeout=cache_time_seconds)


def ical_hmac_signature(value: str) -> str:
    """Hmac signature for ical files"""
    return hmac.new(
        key=settings.ICAL_HASH_SECRET.encode("utf-8"),
        msg=value.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()


def update_query_params(url: str, **params: str) -> str:
    """
    Add query params to the given URL. If the URL already has query params,
    the params will be updated.

    :param url: URL to add query params to.
    :param params: Query params to add.
    :return: URL with query params added.
    """
    url_parts = urllib.parse.urlparse(url)._asdict()
    query_params = dict(urllib.parse.parse_qsl(url_parts["query"]))
    query_params.update(params)
    url_parts["query"] = urllib.parse.urlencode(query_params)
    return urllib.parse.urlunparse(url_parts.values())  # type: ignore[return-value]


def as_p_tags(texts: Iterable[str]) -> str:
    return "".join(f"<p>{p}</p>" for p in texts)


class VaraamoHTML2Text(HTML2Text):
    def handle(self, data: str) -> str:
        # Replace &section with $section and then back to prevent html2text from converting it to a section symbol (§)
        data = data.replace("&section", "$section")
        output = super().handle(data)
        return output.replace("$section", "&section")


def html_2_text(html_text: str) -> str:
    """Used as a replacement for html2text.html2text"""
    h = VaraamoHTML2Text(baseurl="", bodywidth=0)
    return h.handle(html_text)


def convert_html_to_text(html_text: str) -> str:
    """Convert HTML text to plain text, with our formatting rules for links."""
    text = html_2_text(html_text)

    # Link text and url are the same:
    # Remove angle-brackets from links `<url>` -> `url`
    # If there is a dot after the link, add a space between the link and the dot.

    # fmt: off
    pattern = (
        r"<"                            # begins with opening bracket
        r"(?P<link>(https?://)?[^>]+)"  # link, with optional protocol
        r">"                            # followed by closing bracket
        r"(?P<dot>\.?)"                 # with optional dot
    )
    # fmt: on
    text = re.sub(pattern, r"\g<link> \g<dot>", text)

    # Link text and url are different:
    # Replace markdown-style links `[text](url)` with `text <url>`
    # fmt: off
    pattern = (
        r"\["                            # begins with "["
        r"(?P<text>[^\]]+)"              # any text that is not "]"
        r"\]"                            # followed by "]"
        r"\("                            # followed by "("
        r"(?P<link>(https?://)?[^\)]+)"  # any link, with optional protocol
        r"\)"                            # followed by ")"
    )
    # fmt: on

    text = re.sub(pattern, r"\g<text> <\g<link>>", text)

    # Remove any spaces between newline and the last newline, which is added by html2text
    return text.replace(" \n", "\n").removesuffix("\n")


def get_jwt_payload(json_web_token: str) -> dict[str, Any]:
    payload_part: str = json_web_token.split(".")[1]  # Get the payload part of the id token
    payload_part += "=" * divmod(len(payload_part), 4)[1]  # Add padding to the payload if needed
    payload: str = base64.urlsafe_b64decode(payload_part).decode()  # Decode the payload
    return json.loads(payload)  # Return the payload as a dict


def to_django_validation_error(error: ValidationError) -> DjangoValidationError:
    """Given a django-rest-framework ValidationError, return a Django ValidationError."""
    return DjangoValidationError(message=str(error.detail[0]), code=error.detail[0].code)


def to_drf_validation_error(error: DjangoValidationError) -> ValidationError:
    """Given a Django ValidationError, return a django-rest-framework ValidationError."""
    return ValidationError(get_error_detail(exc_info=error))


@contextmanager
def only_django_validation_errors() -> Generator[None]:
    """Converts all raised errors in the context to Django ValidationErrors."""
    try:
        yield
    except DjangoValidationError:
        raise
    except ValidationError as error:
        raise to_django_validation_error(error) from error
    except Exception as error:
        raise DjangoValidationError(message=str(error)) from error


@contextmanager
def only_drf_validation_errors() -> Generator[None]:
    """Converts all raised errors in the context to django-rest-framework ValidationErrors."""
    try:
        yield
    except ValidationError:
        raise
    except DjangoValidationError as error:
        raise to_drf_validation_error(error) from error
    except Exception as error:
        raise ValidationError(detail=str(error)) from error


class LazyModelAttribute:
    """
    Descriptor for accessing an attribute on a Model lazily based on a type hint.
    Should always be used using `LazyModelAttribute.new()`.
    """

    @classmethod
    def new(cls) -> LazyModelAttribute:
        """
        Create a new lazy loaded model attribute for a model.

        Example:

        >>> from typing import TYPE_CHECKING
        >>>
        >>> from django.db import models
        >>>
        >>> if TYPE_CHECKING:
        ...     from .validators import MyModelValidator  # type: ignore
        >>>
        >>> class MyModel(models.Model):
        ...     validators: MyModelValidator = LazyModelAttribute.new()

        Here 'MyModelValidator' is a class that includes validation logic for the model.
        It takes a single argument, which is the model instance begin validated,
        which is the interface required for this descriptor.

        This descriptor is needed because 'MyModelValidator' contains imports from
        other models, so importing it directly to the module might cause cyclical imports.
        That's why it is imported in a 'TYPE_CHECKING' block and only added as a type hint
        for the 'LazyModelAttribute', which can then lazily import the validator when it is first accessed.

        'LazyModelAttribute' differs from properties by also allowing class-level access. Accessing the
        attribute on the class level will return the hinted class itself, which in the validator example will
        allow create validation using classmethods.

        Due to limitations of the Python typing system, the returned type on the class-level will be
        an instance of the typed class, but the actual return value is the hinted class itself.

        This approach is used instead of a more conventional 'decorator-descriptor' approach because
        some type checkers (PyCharm in particular) do not infer types from 'decorator-descriptors'
        correctly (at least when this was written).
        """
        path = _find_attribute_type_hint_path(depth=1)

        # Create a new subclass so that '__import_path__' is unique per lazy-loaded manager.
        class LazyAttribute(cls, __import_path__=path): ...

        return LazyAttribute()

    def __init_subclass__(cls, **kwargs: Any) -> None:
        # '__import_path__' should always be given.
        cls.__import_path__: str = kwargs["__import_path__"]
        """Import path to the type hint."""

        cls.__attribute_class__: type | None = None
        """Type hinted class imported from `__import_path__`."""

    def __get__(self, instance: Any | None, owner: type[Any]) -> Any:
        attribute_class = self.__load_class()
        if instance is None:
            return attribute_class
        return attribute_class(instance)

    def __load_class(self) -> type:
        """Get the lazy-loaded class."""
        cls = type(self)

        # Import the type hint class if it hasn't been imported yet.
        if cls.__attribute_class__ is None:
            cls.__attribute_class__ = import_string(cls.__import_path__)

        return cls.__attribute_class__


class ManagerDeconstructArgs(NamedTuple):
    """Arguments for `BaseManager.deconstruct`."""

    as_manager: bool
    manager_class: str
    qs_class: type[models.QuerySet] | None
    args: tuple[Any, ...]
    kwargs: dict[str, Any]


class LazyModelManager(BaseManager):
    """
    Descriptor for lazily loading a model manager.
    Should always be used using `LazyModelManager.new()`.
    """

    @classmethod
    def new(cls) -> LazyModelManager:
        """
        Create a new lazy loaded model manager for a model.

        Example:

        >>> from typing import TYPE_CHECKING, ClassVar
        >>>
        >>> from django.db import models
        >>>
        >>> if TYPE_CHECKING:
        ...     from .queryset import MyModelManager  # type: ignore
        >>>
        >>> class MyModel(models.Model):
        ...     objects: ClassVar[MyModelManager] = LazyModelManager.new()

        Similarly to `LazyModelAttribute`, this descriptor is needed if 'MyModelManager' (or its queryset)
        contain imports from other models, so that importing it directly to the module might cause cyclical imports.

        Additionally, this class mockey-patches the model's managers, as well as the class attribute for the manager
        after the lazy loading is done, so that the lazy-loaded manager is used directly after it's loaded.
        """
        path = _find_attribute_type_hint_path(depth=1)

        # Create a new subclass so that '__import_path__' is unique per lazy-loaded manager.
        class LazyManager(cls, __import_path__=path): ...

        return LazyManager()

    def __init_subclass__(cls, **kwargs: Any) -> None:
        # '__import_path__' should be given to the initial subclass, but can be omitted if subclassed further.
        # (This is required for django-modeltranslation to work.)
        cls.__import_path__: str = kwargs.get("__import_path__") or cls.__import_path__
        """Import path to the type hint."""

        cls.__attribute_class__: type[Manager] | None = None
        """Type hinted Manager class imported from `__import_path__`."""

    def contribute_to_class(self, cls: type[models.Model], name: str) -> None:
        # Mirror the 'BaseManager.contribute_to_class' method,
        # but use our own '__get__' instead of 'ManagerDescriptor'.
        self.name = self.name or name
        self.model = cls
        setattr(cls, name, self)
        cls._meta.add_manager(self)  # type: ignore[arg-type]

    def deconstruct(self) -> ManagerDeconstructArgs:
        # Replace the 'manager_class' argument so the actual manager class is loaded.
        # Skip some of the validation logic in the original method, as we don't need it here.
        return ManagerDeconstructArgs(
            as_manager=False,
            manager_class=self.__import_path__,
            qs_class=None,
            args=self._constructor_args[0],
            kwargs=self._constructor_args[1],
        )

    def __getattr__(self, item: str) -> None:
        """Called if an attribute is not found in the class."""
        # Manager cannot be loaded until the module containing the model is loaded
        # 'model' exists if 'contribute_to_class' is called after the model is instantiated,
        # although this doesn't guarantee the module is loaded.
        if "model" not in self.__dict__:
            msg = f"{type(self).__name__} has no attribute {item!r}"
            raise AttributeError(msg)

        manager = self.__load_manager()

        # If name doesn't exits, this is a call from a related manager.
        # This means we cannot replace the manager in the related model, as we don't know its name.
        # We should still add the model to the manager if missing so that all methods work as expected.
        if self.name is not None:
            self.__replace_manager(manager, self.model)
        elif manager.model is None:
            manager.model = self.model

        # Now check if the attribute exists.
        return getattr(manager, item)

    def __get__(self, instance: models.Model | None, model: type[models.Model]) -> Any:
        """Called if accessed from Model class."""
        manager = self.__load_manager()
        self.__replace_manager(manager, model)
        return getattr(model, self.name)

    def __load_manager(self) -> Manager:
        """Get the lazy-loaded manager."""
        cls = type(self)

        # Import the manager class if it hasn't been imported yet.
        if cls.__attribute_class__ is None:
            cls.__attribute_class__ = import_string(cls.__import_path__)

        return cls.__attribute_class__()

    def __replace_manager(self, manager: Manager, model: type[models.Model]) -> None:
        """Replace this lazy manager with the actual manager in the model options manager list."""
        # Managers are immutable (due to 'django-modeltranslation'), so we need to recreate them.
        local_managers = list(model._meta.local_managers)
        model._meta.local_managers = []

        # Only replace this manager with its lazy-loaded version, leave the rest as they are.
        for local_manager in local_managers:
            if self.name == local_manager.name:
                manager.contribute_to_class(model, self.name)
            else:
                model._meta.local_managers.append(local_manager)

        # Make managers immutable again.
        model._meta.local_managers = model._meta.managers  # type: ignore[assignment]


def _find_attribute_type_hint_path(*, depth: int) -> str:
    """
    Perform some python black magic to find the dotted import path to where a class for an attribute's
    type hint is defined. This can be useful if class for the type hint cannot be imported directly to
    the module the attribute definition is, so its defined inside a 'TYPE_CHECKING' block.
    This function will find that import in the module's code, and determine the import path from it.

    Note that the class attribute and the import should both be defined on a single line for this to work.

    :param depth: How many frames to go back from the caller frame to find the attribute definition.
    """
    frame: FrameType = sys._getframe(depth + 1)  # noqa: SLF001
    source_code = inspect.findsource(frame)[0]
    type_hint = _get_type_hint(frame, source_code)
    module_name = _get_type_hint_module_name(type_hint, frame, source_code)
    return f"{module_name}.{type_hint}"


_WRAPPER_PATTERN = re.compile(r".+\[(?P<type_hint>.+)]$")


def _get_type_hint(frame: FrameType, source_code: list[str]) -> str:
    """Get the type hint for the attribute this descriptor defined for."""
    current_line = source_code[frame.f_lineno - 1]
    definition = current_line.split("=", maxsplit=1)[0]
    def_and_type_hint = definition.split(":", maxsplit=1)
    type_hint = def_and_type_hint[1].strip()
    match = _WRAPPER_PATTERN.match(type_hint)
    if match is not None:
        type_hint = match.group("type_hint")
    return type_hint


def _get_type_hint_module_name(type_hint: str, frame: FrameType, source_code: list[str]) -> str:
    """
    Go through the source code for the caller frame to find the line where the type hint
    is imported. Note that the import should be defined on a single line for this to work.
    """
    module_name: str | None = None
    for line in source_code:
        if type_hint in line and "import" in line:
            module_name = line.strip().removeprefix("from").split("import")[0].strip()
            break

    if module_name is None:
        msg = (
            f"Unable to find import path for {type_hint!r}. "
            f"Make sure import for the attribute's type hint is defined on a single line."
        )
        raise RuntimeError(msg)

    # Handle relative imports
    if module_name.startswith("."):
        caller_module: str = frame.f_locals["__module__"]

        # Remove number parts in the caller module equal to the number of relative "dots" in the import
        module_parts = caller_module.split(".")
        for part in module_name.split("."):
            if part:
                break
            module_parts.pop()

        module_name = ".".join(module_parts) + module_name

    return module_name
