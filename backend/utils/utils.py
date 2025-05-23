from __future__ import annotations

import base64
import datetime
import hashlib
import hmac
import json
import operator
import re
import unicodedata
import urllib.parse
from contextlib import contextmanager
from typing import TYPE_CHECKING, Any

from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.translation import get_language_from_path, get_language_from_request
from html2text import HTML2Text  # noqa: TID251
from rest_framework.exceptions import ValidationError
from rest_framework.fields import get_error_detail

from tilavarauspalvelu.enums import Language
from utils.date_utils import local_datetime

if TYPE_CHECKING:
    from collections.abc import Generator, Iterable
    from pathlib import Path

    from django.http import HttpRequest

    from tilavarauspalvelu.typing import AnyUser, Lang, TextSearchLang

__all__ = [
    "comma_sep_str",
    "get_query_params",
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
        next_item = None
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


def get_query_params(url: str) -> dict[str, str]:
    """Get query params from the given URL."""
    url_parts = urllib.parse.urlparse(url)._asdict()
    return dict(urllib.parse.parse_qsl(url_parts["query"]))


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


def check_path(path: Path, *, should_be_file: bool = False, should_be_dir: bool = False) -> Path:
    if not path.exists():
        msg = f"{path} does not exist"
        raise FileNotFoundError(msg)

    if should_be_file and not path.is_file():
        msg = f"{path} is not a file"
        raise FileNotFoundError(msg)

    if should_be_dir and not path.is_dir():
        msg = f"{path} is not a directory"
        raise FileNotFoundError(msg)

    return path
