import random
from collections.abc import Callable, Generator, Sequence
from enum import Enum
from functools import wraps
from types import DynamicClassAttribute
from typing import Any, NamedTuple, ParamSpec, TypeVar

from faker import Faker

T = TypeVar("T")
P = ParamSpec("P")

faker_fi = Faker(locale="fi_FI")
faker_sv = Faker(locale="sv_SE")
faker_en = Faker(locale="en_US")


class Paragraphs(NamedTuple):
    fi: str
    sv: str
    en: str


def pascal_case_to_snake_case(string: str) -> str:
    return "".join("_" + char.lower() if char.isupper() else char for char in string).lstrip("_")


def as_p_tags(texts: list[str]) -> str:
    return "".join(f"<p>{p}</p>" for p in texts)


def get_paragraphs() -> Paragraphs:
    return Paragraphs(
        fi=as_p_tags(faker_fi.paragraphs()),
        sv=as_p_tags(faker_sv.paragraphs()),
        en=as_p_tags(faker_en.paragraphs()),
    )


def batched(iterable: list[T], *, batch_size: int) -> Generator[list[T], Any, None]:
    if batch_size <= 0:
        raise ValueError("Batch size must be positive.")

    while iterable:
        iterable, batch = iterable[batch_size:], iterable[:batch_size]
        yield batch


def random_subset(
    sequence: Sequence[T],
    *,
    min_size: int = 0,
    max_size: int = 0,
    counts: list[int] | None = None,
) -> list[T]:
    if max_size < 1:
        max_size = len(sequence)
    size = random.randint(min_size, max_size)
    return random.sample(sequence, counts=counts, k=size)


def weighted_choice(choices: Sequence[T], weights: list[int]) -> T:
    return random.choices(choices, weights=weights)[0]


def with_logs(
    text_entering: str,
    text_exiting: str,
) -> Callable[[Callable[P, T]], Callable[P, T]]:
    def decorator(func: Callable[P, T]) -> Callable[P, T]:
        @wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            print(text_entering)  # noqa: T201, RUF100
            return_value = func(*args, **kwargs)
            print(text_exiting)  # noqa: T201, RUF100
            return return_value

        return wrapper

    return decorator


class SetName(str, Enum):
    set_1 = "Lomake 1"
    set_2 = "Lomake 2"
    set_3 = "Lomake 3"
    set_4 = "Lomake 4"
    set_5 = "Lomake 5"
    set_6 = "Lomake 6"
    set_all = "All Fields"

    @classmethod
    def applying_free_of_charge(cls) -> list["SetName"]:
        return [cls.set_5, cls.set_6]

    @DynamicClassAttribute
    def for_applying_free_of_charge(self) -> bool:
        return self in self.applying_free_of_charge()
