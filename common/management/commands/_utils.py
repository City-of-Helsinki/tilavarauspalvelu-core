import random
from functools import wraps
from typing import Any, Callable, Generator, NamedTuple, ParamSpec, Sequence, TypeVar

from faker import Faker

T = TypeVar("T")
P = ParamSpec("P")

TList = TypeVar("TList", bound=list)

faker_fi = Faker(locale="fi_FI")
faker_sv = Faker(locale="sv_SE")
faker_en = Faker(locale="en_US")


class Paragraphs(NamedTuple):
    fi: str
    sv: str
    en: str


def pascal_case_to_snake_case(string: str) -> str:
    return "".join(("_" + char.lower() if char.isupper() else char for char in string)).lstrip("_")


def as_p_tags(texts: list[str]) -> str:
    return "".join(f"<p>{p}</p>" for p in texts)


def get_paragraphs() -> Paragraphs:
    return Paragraphs(
        fi=as_p_tags(faker_fi.paragraphs()),
        sv=as_p_tags(faker_sv.paragraphs()),
        en=as_p_tags(faker_en.paragraphs()),
    )


def batched(iterable: TList, *, batch_size: int) -> Generator[TList, Any, None]:
    if batch_size <= 0:
        raise ValueError("Batch size must be positive.")

    while iterable:
        iterable, batch = iterable[batch_size:], iterable[:batch_size]
        yield batch


def random_subset(
    iterable: TList,
    *,
    max_size: int = 0,
    counts: list[int] | None = None,
) -> TList:
    if max_size < 1:
        max_size = len(iterable)
    size = random.randint(0, max_size)
    return random.sample(iterable, counts=counts, k=size)


def weighted_choice(choices: Sequence[T], weights: list[int]) -> T:
    return random.choices(choices, weights=weights)[0]


def with_logs(
    text_entering: str,
    text_exiting: str,
) -> Callable[[Callable[P, T]], Callable[P, T]]:
    def decorator(func: Callable[P, T]) -> Callable[P, T]:
        @wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            print(text_entering)  # noqa: T201
            return_value = func(*args, **kwargs)
            print(text_exiting)  # noqa: T201
            return return_value

        return wrapper

    return decorator
