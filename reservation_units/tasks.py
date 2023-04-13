from datetime import date
from logging import getLogger

from django.conf import settings
from easy_thumbnails.exceptions import InvalidImageFormatError
from sentry_sdk import capture_exception, capture_message, push_scope

from merchants.models import PaymentProduct
from merchants.verkkokauppa.product.exceptions import CreateOrUpdateAccountingError
from merchants.verkkokauppa.product.requests import (
    create_or_update_accounting,
    create_product,
)
from merchants.verkkokauppa.product.types import (
    CreateOrUpdateAccountingParams,
    CreateProductParams,
)
from tilavarauspalvelu.celery import app

from .pricing_updates import update_reservation_unit_pricings
from .utils.reservation_unit_payment_helper import ReservationUnitPaymentHelper

logger = getLogger(__name__)


@app.task(name="update_reservation_unit_pricings")
def _update_reservation_unit_pricings() -> None:
    today = date.today()

    logger.info(f"Updating reservation unit pricing with date {today}")
    num_updated = update_reservation_unit_pricings(today)
    logger.info(f"Updated {num_updated} reservation units with date {today}")


@app.task(
    name="refresh_reservation_unit_product_mapping",
    autoretry_for=(TypeError,),
    max_retries=5,
    retry_backoff=True,
)
def refresh_reservation_unit_product_mapping(reservation_unit_pk) -> None:
    from reservation_units.models import ReservationUnit

    reservation_unit = ReservationUnit.objects.filter(pk=reservation_unit_pk).first()
    if reservation_unit is None:
        capture_message(
            f"Unable to refresh reservation unit product mapping. Reservation unit not found: {reservation_unit_pk}",
            level="warning",
        )
        return

    payment_merchant = ReservationUnitPaymentHelper.get_merchant(reservation_unit)

    if ReservationUnitPaymentHelper.requires_product_mapping_update(reservation_unit):
        params = CreateProductParams(
            namespace=settings.VERKKOKAUPPA_NAMESPACE,
            namespace_entity_id=reservation_unit.pk,
            merchant_id=payment_merchant.id,
        )
        api_product = create_product(params)
        payment_product, _ = PaymentProduct.objects.update_or_create(
            id=api_product.product_id, defaults={"merchant": payment_merchant}
        )

        ReservationUnit.objects.filter(pk=reservation_unit_pk).update(
            payment_product=payment_product
        )

        refresh_reservation_unit_accounting.delay(reservation_unit_pk)

    # Remove product mapping if merchant is removed
    if reservation_unit.payment_product and not payment_merchant:
        ReservationUnit.objects.filter(pk=reservation_unit_pk).update(
            payment_product=None
        )


@app.task(
    name="refresh_reservation_unit_accounting",
    autoretry_for=(TypeError,),
    max_retries=5,
    retry_backoff=True,
)
def refresh_reservation_unit_accounting(reservation_unit_pk) -> None:
    from reservation_units.models import ReservationUnit

    reservation_unit = ReservationUnit.objects.filter(pk=reservation_unit_pk).first()
    if reservation_unit is None:
        capture_message(
            f"Unable to refresh reservation unit accounting data. Reservation unit not found: {reservation_unit_pk}",
            level="warning",
        )
        return

    accounting = ReservationUnitPaymentHelper.get_accounting(reservation_unit)

    if reservation_unit.payment_product and accounting:
        params = CreateOrUpdateAccountingParams(
            vat_code=accounting.vat_code,
            internal_order=accounting.internal_order,
            profit_center=accounting.profit_center,
            project=accounting.project,
            operation_area=accounting.operation_area,
            company_code=accounting.company_code,
            main_ledger_account=accounting.main_ledger_account,
        )
        try:
            accounting = create_or_update_accounting(
                reservation_unit.payment_product.id, params
            )
        except CreateOrUpdateAccountingError as err:
            with push_scope() as scope:
                scope.set_extra(
                    "details", "Unable to refresh reservation unit accounting data"
                )
                scope.set_extra("reservation-unit-id", reservation_unit_pk)
                capture_exception(err)


@app.task(name="update_reservation_unit_image_urls")
def update_urls(pk: int = None):
    from .models import ReservationUnitImage

    images = ReservationUnitImage.objects.filter(image__isnull=False)

    if pk:
        images = images.filter(pk=pk)

    for image in images:
        try:
            image.large_url = image.image["large"].url
            image.medium_url = image.image["medium"].url
            image.small_url = image.image["small"].url
            image.save(update_urls=False)

        except InvalidImageFormatError as err:
            capture_exception(err)
