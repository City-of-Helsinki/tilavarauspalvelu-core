from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from typing import TYPE_CHECKING
from unittest import mock

import pytest
from celery.app.task import Task
from django.apps import apps
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db.models.signals import post_save, pre_save
from PIL import Image

from tilavarauspalvelu import signals
from tilavarauspalvelu.enums import ReservationUnitImageType
from tilavarauspalvelu.models import (
    IntendedUse,
    PaymentAccounting,
    Reservation,
    ReservationUnit,
    ReservationUnitImage,
    Space,
    Unit,
)
from utils.model_signals import bulk_create_with_signals, bulk_update_with_signals

from tests.factories import (
    IntendedUseFactory,
    PaymentAccountingFactory,
    ReservationFactory,
    ReservationUnitFactory,
    SpaceFactory,
    UnitFactory,
    UserFactory,
)

if TYPE_CHECKING:
    from collections.abc import Callable, Sequence

    from django.db import models

pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ──────────────────────────────────────────────────────────────────


def create_image_file() -> SimpleUploadedFile:
    image_data = BytesIO()
    image = Image.new("RGB", (100, 100))
    image.save(fp=image_data, format="PNG")
    return SimpleUploadedFile("image.png", image_data.getvalue(), content_type="image/png")


def turn_on_receivers(settings) -> None:
    """
    Call this after the setup. A task batch from the setup never commits in a test.
    A call in the bulk write would join that batch and start no task.
    """
    settings.IMAGE_CACHE_ENABLED = True
    settings.REBUILD_SPACE_HIERARCHY = True
    settings.SAVE_RESERVATION_STATISTICS = True
    settings.UPDATE_ACCOUNTING = True
    settings.UPDATE_PRODUCT_MAPPING = True
    settings.UPDATE_RESERVATION_UNIT_HIERARCHY = True
    settings.UPDATE_RESERVATION_UNIT_THUMBNAILS = True
    settings.UPDATE_SEARCH_VECTORS = True


def get_models_with_save_receivers() -> set[type[models.Model]]:
    models_with_receivers: set[type[models.Model]] = set()

    for model in apps.get_models():
        for signal in (pre_save, post_save):
            # Third-party packages connect receivers to every model, so only the receivers in our module count.
            # '_live_receivers' is a Django internal. It returns the sync and the async receivers.
            sync_receivers, async_receivers = signal._live_receivers(model)
            receiver_modules = {receiver.__module__ for receiver in [*sync_receivers, *async_receivers]}
            if signals.__name__ in receiver_modules:
                models_with_receivers.add(model)

    return models_with_receivers


@dataclass(frozen=True, kw_only=True)
class RowFactory:
    build_rows: Callable[[int], Sequence[models.Model]]
    # Creates saved rows for 'bulk_update_with_signals', with the data that makes the receivers start tasks.
    create_rows: Callable[[int], Sequence[models.Model]]
    update_field: str


def build_intended_uses(count: int) -> Sequence[models.Model]:
    return [IntendedUseFactory.build(image=create_image_file()) for _ in range(count)]


def create_intended_uses(count: int) -> Sequence[models.Model]:
    return [IntendedUseFactory.create(image=create_image_file()) for _ in range(count)]


def build_payment_accountings(count: int) -> Sequence[models.Model]:
    return PaymentAccountingFactory.build_batch(count)


def create_payment_accountings(count: int) -> Sequence[models.Model]:
    payment_accountings = PaymentAccountingFactory.create_batch(count)
    for payment_accounting in payment_accountings:
        ReservationUnitFactory.create(payment_accounting=payment_accounting)
    return payment_accountings


def build_reservations(count: int) -> Sequence[models.Model]:
    reservation_unit = ReservationUnitFactory.create()
    user = UserFactory.create()
    return ReservationFactory.build_batch(count, reservation_unit=reservation_unit, user=user)


def create_reservations(count: int) -> Sequence[models.Model]:
    return ReservationFactory.create_batch(count)


def build_reservation_units(count: int) -> Sequence[models.Model]:
    unit = UnitFactory.create()
    return ReservationUnitFactory.build_batch(count, unit=unit, reservation_unit_type=None)


def create_reservation_units(count: int) -> Sequence[models.Model]:
    return ReservationUnitFactory.create_batch(count)


def build_reservation_unit_images(count: int) -> Sequence[models.Model]:
    reservation_unit = ReservationUnitFactory.create()
    return [
        ReservationUnitImage(
            reservation_unit=reservation_unit,
            image_type=ReservationUnitImageType.OTHER,
            image=create_image_file(),
        )
        for _ in range(count)
    ]


def create_reservation_unit_images(count: int) -> Sequence[models.Model]:
    images = build_reservation_unit_images(count)
    for image in images:
        image.save()
    return images


def build_spaces(count: int) -> Sequence[models.Model]:
    unit = UnitFactory.create()
    return [SpaceFactory.build_for_bulk_create(unit=unit) for _ in range(count)]


def create_spaces(count: int) -> Sequence[models.Model]:
    return SpaceFactory.create_batch(count)


def build_units(count: int) -> Sequence[models.Model]:
    return UnitFactory.build_batch(count)


def create_units(count: int) -> Sequence[models.Model]:
    return UnitFactory.create_batch(count)


# Add a model here when it gets a save receiver in 'tilavarauspalvelu/signals.py'.
ROW_FACTORIES: dict[type[models.Model], RowFactory] = {
    IntendedUse: RowFactory(
        build_rows=build_intended_uses,
        create_rows=create_intended_uses,
        update_field="name",
    ),
    PaymentAccounting: RowFactory(
        build_rows=build_payment_accountings,
        create_rows=create_payment_accountings,
        update_field="name",
    ),
    Reservation: RowFactory(
        build_rows=build_reservations,
        create_rows=create_reservations,
        update_field="handling_details",
    ),
    ReservationUnit: RowFactory(
        build_rows=build_reservation_units,
        create_rows=create_reservation_units,
        update_field="name",
    ),
    ReservationUnitImage: RowFactory(
        build_rows=build_reservation_unit_images,
        create_rows=create_reservation_unit_images,
        update_field="image_type",
    ),
    Space: RowFactory(
        build_rows=build_spaces,
        create_rows=create_spaces,
        update_field="name",
    ),
    Unit: RowFactory(
        build_rows=build_units,
        create_rows=create_units,
        update_field="name",
    ),
}


# ── Models ───────────────────────────────────────────────────────────────────


def test_bulk_write_task_counts__every_model_with_save_receivers_is_tested():
    models_with_receivers = get_models_with_save_receivers()

    assert models_with_receivers == set(ROW_FACTORIES)


# ── Task counts ──────────────────────────────────────────────────────────────


@pytest.mark.parametrize("model", ROW_FACTORIES, ids=lambda model: model.__name__)
def test_bulk_write_task_counts__create__same_task_count_for_more_rows(
    model, settings, django_capture_on_commit_callbacks
):
    row_factory = ROW_FACTORIES[model]
    two_rows = row_factory.build_rows(2)
    three_rows = row_factory.build_rows(3)

    turn_on_receivers(settings)

    with mock.patch.object(Task, "apply_async") as mock_apply_async, django_capture_on_commit_callbacks(execute=True):
        bulk_create_with_signals(two_rows)

    task_count_for_two_rows = mock_apply_async.call_count

    with mock.patch.object(Task, "apply_async") as mock_apply_async, django_capture_on_commit_callbacks(execute=True):
        bulk_create_with_signals(three_rows)

    task_count_for_three_rows = mock_apply_async.call_count

    assert task_count_for_two_rows == task_count_for_three_rows


@pytest.mark.parametrize("model", ROW_FACTORIES, ids=lambda model: model.__name__)
def test_bulk_write_task_counts__update__same_task_count_for_more_rows(
    model, settings, django_capture_on_commit_callbacks
):
    row_factory = ROW_FACTORIES[model]
    two_rows = row_factory.create_rows(2)
    three_rows = row_factory.create_rows(3)

    turn_on_receivers(settings)

    with mock.patch.object(Task, "apply_async") as mock_apply_async, django_capture_on_commit_callbacks(execute=True):
        bulk_update_with_signals(two_rows, fields=[row_factory.update_field])

    task_count_for_two_rows = mock_apply_async.call_count

    with mock.patch.object(Task, "apply_async") as mock_apply_async, django_capture_on_commit_callbacks(execute=True):
        bulk_update_with_signals(three_rows, fields=[row_factory.update_field])

    task_count_for_three_rows = mock_apply_async.call_count

    assert task_count_for_two_rows == task_count_for_three_rows
    assert task_count_for_two_rows > 0
