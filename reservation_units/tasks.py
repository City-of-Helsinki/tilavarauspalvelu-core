from datetime import date
from logging import getLogger

from django.conf import settings
from easy_thumbnails.exceptions import InvalidImageFormatError

from merchants.models import PaymentProduct
from merchants.verkkokauppa.product.exceptions import CreateOrUpdateAccountingError
from merchants.verkkokauppa.product.types import CreateOrUpdateAccountingParams, CreateProductParams
from merchants.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from reservation_units.pricing_updates import update_reservation_unit_pricings
from reservation_units.utils.reservation_unit_payment_helper import ReservationUnitPaymentHelper
from tilavarauspalvelu.celery import app
from utils.image_cache import purge
from utils.sentry import SentryLogger

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
        SentryLogger.log_message(
            message=f"Unable to refresh reservation unit ({reservation_unit_pk}) product mapping.",
            details=f"Reservation unit ({reservation_unit_pk}) not found.",
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
        api_product = VerkkokauppaAPIClient.create_product(params=params)
        payment_product, _ = PaymentProduct.objects.update_or_create(
            id=api_product.product_id,
            defaults={"merchant": payment_merchant},
        )

        ReservationUnit.objects.filter(pk=reservation_unit_pk).update(payment_product=payment_product)

        refresh_reservation_unit_accounting.delay(reservation_unit_pk)

    # Remove product mapping if merchant is removed
    if reservation_unit.payment_product and not payment_merchant:
        ReservationUnit.objects.filter(pk=reservation_unit_pk).update(payment_product=None)


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
        SentryLogger.log_message(
            message=f"Unable to refresh reservation unit ({reservation_unit_pk}) accounting data.",
            details=f"Reservation unit ({reservation_unit_pk}) not found.",
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
            balance_profit_center=accounting.balance_profit_center,
        )
        try:
            VerkkokauppaAPIClient.create_or_update_accounting(
                product_uuid=reservation_unit.payment_product.id, params=params
            )
        except CreateOrUpdateAccountingError as err:
            SentryLogger.log_exception(
                err,
                details="Unable to refresh reservation unit accounting data",
                reservation_unit_id=reservation_unit_pk,
            )


@app.task(name="update_reservation_unit_image_urls")
def update_urls(pk: int | None = None):
    from reservation_units.models import ReservationUnitImage

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
            SentryLogger.log_exception(err, details="Unable to update image urls", reservation_unit_image_id=image.pk)


@app.task(name="purge_image_cache")
def purge_image_cache(image_path: str):
    purge(image_path)
