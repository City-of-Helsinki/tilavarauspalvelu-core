from datetime import date
from logging import getLogger

from django.conf import settings
from sentry_sdk import capture_message

from merchants.models import PaymentProduct
from merchants.verkkokauppa.product.requests import create_product
from merchants.verkkokauppa.product.types import CreateProductParams
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

    # Remove product mapping if merchant is removed
    if reservation_unit.payment_product and not payment_merchant:
        ReservationUnit.objects.filter(pk=reservation_unit_pk).update(
            payment_product=None
        )
