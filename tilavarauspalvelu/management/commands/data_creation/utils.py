from __future__ import annotations

import dataclasses
import datetime
import functools
import itertools
import operator
import random
from collections.abc import Callable
from enum import StrEnum
from functools import wraps
from typing import TYPE_CHECKING, Annotated, Any, Literal, NamedTuple, ParamSpec, TypeVar

from django.test import override_settings

from tilavarauspalvelu.models import AffectingTimeSpan, ReservationUnitHierarchy

if TYPE_CHECKING:
    from collections.abc import Callable, Generator, Iterable, Sequence, Sized
    from decimal import Decimal

    from tilavarauspalvelu.enums import (
        ApplicantTypeChoice,
        PaymentType,
        PriceUnit,
        ReservationKind,
        ReservationStartInterval,
        Weekday,
    )
    from tilavarauspalvelu.models import (
        Address,
        AllocatedTimeSlot,
        Application,
        ApplicationSection,
        Organisation,
        Person,
        ReservationUnitCancellationRule,
        ReservationUnitOption,
        SuitableTimeRange,
    )

T = TypeVar("T")
P = ParamSpec("P")


def random_subset(
    sequence: Sequence[T],
    *,
    min_size: int = 0,
    max_size: int = 0,
    counts: list[int] | None = None,
) -> list[T]:
    """Select a random subset of the given sequence."""
    if max_size < 1:
        max_size = len(sequence)
    size = random.randint(min_size, max_size)
    return random.sample(sequence, counts=counts, k=size)


def weighted_choice(choices: Sequence[T], weights: list[int]) -> T:
    """Select a random item from the given choices, favouring the items with higher weights."""
    return random.choices(choices, weights=weights)[0]


def with_logs(func: Callable[P, T]) -> Callable[P, T]:
    """Log when the function is entered and exited."""
    name = func.__name__.replace("_", " ").strip()
    prefix = "Running"
    postfix = "done"
    if name.startswith("create"):
        name = name.removeprefix("create").strip()
        prefix = "Creating"
        postfix = "created"

    text_entering = f"{prefix} {name}..."
    text_exiting = f"{name.capitalize()} {postfix}!"

    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        print(text_entering)  # noqa: T201, RUF100
        return_value = func(*args, **kwargs)
        print(text_exiting)  # noqa: T201, RUF100
        return return_value

    return wrapper


def refresh_materialized_views_at_the_end(func: Callable[P, None]) -> Callable[P, None]:
    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> None:
        with override_settings(
            UPDATE_AFFECTING_TIME_SPANS=False,
            UPDATE_RESERVATION_UNIT_HIERARCHY=False,
            SAVE_RESERVATION_STATISTICS=False,
        ):
            try:
                func(*args, **kwargs)
            finally:
                ReservationUnitHierarchy.refresh()
                AffectingTimeSpan.refresh()

    return wrapper


class SetName(StrEnum):
    set_1 = "Lomake 1"
    set_2 = "Lomake 2"
    set_3 = "Lomake 3"
    set_4 = "Lomake 4"
    set_5 = "Lomake 5"
    set_6 = "Lomake 6"
    set_all = "All Fields"

    value: str  # Override typing, since current inferred type is somehow wrong...

    @classmethod
    def applying_free_of_charge(cls) -> list[SetName]:
        return [cls.set_5, cls.set_6]

    @classmethod
    def non_free_of_charge_applying(cls) -> list[SetName]:
        return list(set(cls.__members__.values()) - set(cls.applying_free_of_charge()))


class FieldCombination(NamedTuple):
    supported: list[str]
    required: list[str]


def get_combinations(
    *,
    iterables: Iterable[Sized[Any]],
    output_type: type[T],
    limit: int = 300,
    multiplier: int = 1,
) -> Generator[T, None, None]:
    """
    Get all combinations of the given iterables.

    Note that the order of the iterables should be such that they output type can be created with positional arguments!

    Checks that the number of combinations does not exceed the given limit.
    If the limit is exceeded, raises a RuntimeError.
    """
    # Check that we won't accidentally create too many unit combinations when adding new ones.
    combinations = functools.reduce(operator.mul, (len(it) for it in iterables)) * multiplier
    if combinations > limit:
        msg = f"Calculated {combinations} combinations, which is more than the set limit of {limit}."
        raise RuntimeError(msg)

    for _ in range(multiplier):
        for product_item in itertools.product(*iterables):
            yield output_type(*product_item)


@dataclasses.dataclass(slots=True, frozen=True)
class BufferInfo:
    name: str
    before: datetime.timedelta
    after: datetime.timedelta


@dataclasses.dataclass(slots=True, frozen=True)
class DurationInfo:
    name: str
    minimum: datetime.timedelta
    maximum: datetime.timedelta


@dataclasses.dataclass(slots=True, frozen=True)
class ReservableWindowInfo:
    name: str
    minimum: int
    maximum: int


@dataclasses.dataclass(slots=True, frozen=True)
class StartIntervalInfo:
    name: str
    value: ReservationStartInterval


@dataclasses.dataclass(slots=True, frozen=True)
class CancelInfo:
    name: str
    value: list[ReservationUnitCancellationRule | None]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationKindInfo:
    name: str
    value: ReservationKind


@dataclasses.dataclass(slots=True, frozen=True)
class HandlingInfo:
    name: str
    handling_required: bool


@dataclasses.dataclass(slots=True, frozen=True)
class TaxPercentageInfo:
    name: str
    value: Literal["0", "10", "14", "24", "25.5"]


@dataclasses.dataclass(slots=True, frozen=True)
class PaymentTypeInfo:
    name: str
    payment_type: PaymentType


@dataclasses.dataclass(slots=True, frozen=True)
class PriceInfo:
    name: str
    highest_price: Decimal
    lowest_price: Decimal
    price_unit: PriceUnit
    can_apply_free_of_charge: bool


@dataclasses.dataclass(slots=True, frozen=True)
class FreeReservationUnitData:
    buffer_info: BufferInfo
    duration_info: DurationInfo
    reservable_window_info: ReservableWindowInfo
    start_interval_info: StartIntervalInfo
    cancellation_rule_info: CancelInfo
    handling_info: HandlingInfo


@dataclasses.dataclass(slots=True, frozen=True)
class PaidReservationUnitData:
    duration_info: DurationInfo
    cancellation_rule_info: CancelInfo
    price_info: PriceInfo
    handling_info: HandlingInfo
    payment_type_info: PaymentTypeInfo
    tax_percentage_info: TaxPercentageInfo


@dataclasses.dataclass(slots=True, frozen=True)
class SeasonalReservationUnitData:
    duration_info: DurationInfo
    cancellation_rule_info: CancelInfo
    reservation_kind_info: ReservationKindInfo


@dataclasses.dataclass(frozen=True, slots=True)
class ApplicantTypeInfo:
    name: str
    applicant_type: ApplicantTypeChoice
    unregistered: bool = False
    different_billing_address: bool = False


@dataclasses.dataclass(slots=True)
class SuitableTimeInfo:
    name: str
    primary_applied_weekdays: list[Weekday] = dataclasses.field(default_factory=list)
    secondary_applied_weekdays: list[Weekday] = dataclasses.field(default_factory=list)
    applied_reservations_per_week: int = 0

    def __post_init__(self) -> None:
        maximum = len(set(self.primary_applied_weekdays) | set(self.secondary_applied_weekdays))
        if self.applied_reservations_per_week <= 0:
            self.applied_reservations_per_week = maximum
        self.applied_reservations_per_week = min(self.applied_reservations_per_week, maximum)


@dataclasses.dataclass(frozen=True, slots=True)
class SectionInfo:
    name: str
    number: int
    reservation_min_duration: datetime.timedelta = datetime.timedelta(hours=1)
    reservation_max_duration: datetime.timedelta = datetime.timedelta(hours=2)
    allocations: bool = False


@dataclasses.dataclass(frozen=True, slots=True)
class OptionInfo:
    name: str
    number: int


@dataclasses.dataclass(frozen=True, slots=True)
class ApplicationRoundData:
    applicant_type_info: ApplicantTypeInfo
    suitable_time_info: SuitableTimeInfo
    section_info: SectionInfo
    option_info: OptionInfo


@dataclasses.dataclass(frozen=True, slots=True)
class CreatedApplicationInfo:
    application: Application
    addresses: list[Address]
    contact_persons: list[Person]
    organisations: list[Organisation]
    application_sections: list[ApplicationSection]
    suitable_time_ranges: list[SuitableTimeRange]
    reservation_unit_options: list[ReservationUnitOption]
    allocated_time_slots: list[AllocatedTimeSlot]


@dataclasses.dataclass(frozen=True, slots=True)
class CreatedSectionInfo:
    application_sections: list[ApplicationSection]
    suitable_time_ranges: list[SuitableTimeRange]
    reservation_unit_options: list[ReservationUnitOption]
    allocated_time_slots: list[AllocatedTimeSlot]


@dataclasses.dataclass(frozen=True, slots=True)
class AllocationTime:
    begin_time: datetime.time
    end_time: datetime.time


@dataclasses.dataclass(slots=True)
class AllocationInfo:
    allocations: dict[Annotated[int, "Res Unit PK"], list[AllocationTime]] = dataclasses.field(default_factory=dict)
