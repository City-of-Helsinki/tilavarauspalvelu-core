import logging
from collections.abc import Collection
from datetime import date
from decimal import Decimal

from django.conf import settings
from django.db.models import Q
from easy_thumbnails.exceptions import InvalidImageFormatError

from config.celery import app
from merchants.models import PaymentProduct
from merchants.verkkokauppa.product.exceptions import CreateOrUpdateAccountingError
from merchants.verkkokauppa.product.types import CreateOrUpdateAccountingParams, CreateProductParams
from merchants.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from reservation_units.enums import PricingStatus, PricingType
from reservation_units.pricing_updates import update_reservation_unit_pricings
from reservation_units.utils.reservation_unit_payment_helper import ReservationUnitPaymentHelper
from utils.image_cache import purge
from utils.sentry import SentryLogger

logger = logging.getLogger(__name__)


@app.task(name="update_reservation_unit_pricings")
def _update_reservation_unit_pricings() -> None:
    today = date.today()

    logger.info(f"Updating reservation unit pricing with date {today}")
    num_updated = update_reservation_unit_pricings(today)
    logger.info(f"Updated {num_updated} reservation units with date {today}")


@app.task(name="update_reservation_unit_pricings_tax_percentage")
def update_reservation_unit_pricings_tax_percentage(
    change_date: str,
    current_tax: str,
    future_tax: str,
    ignored_company_codes: Collection[str] = (),
) -> None:
    from reservation_units.models import ReservationUnitPricing, TaxPercentage

    SentryLogger.log_message(
        message="Task `update_reservation_unit_pricings_tax_percentage` started",
        details=(
            f"Task was run with "
            f"change_date: {change_date}, "
            f"current_tax: {current_tax}, "
            f"future_tax: {future_tax}, "
            f"ignored_company_codes: {ignored_company_codes}"
        ),
        level="info",
    )

    change_date = date.fromisoformat(change_date)  # e.g. "2024-09-01"
    current_tax_percentage, _ = TaxPercentage.objects.get_or_create(value=Decimal(current_tax))
    future_tax_percentage, _ = TaxPercentage.objects.get_or_create(value=Decimal(future_tax))

    # Last pricing for each reservation unit before the change date
    latest_pricings = (
        ReservationUnitPricing.objects.filter(
            Q(begins__lte=change_date, pricing_type=PricingType.FREE)  # Ignore FREE pricings after the change date
            | Q(pricing_type=PricingType.PAID)
        )
        .filter(status__in=(PricingStatus.PRICING_STATUS_ACTIVE, PricingStatus.PRICING_STATUS_FUTURE))
        .exclude(reservation_unit__payment_accounting__company_code__in=ignored_company_codes)
        .order_by("reservation_unit_id", "-begins")
        .distinct("reservation_unit_id")
    )
    for pricing in latest_pricings:
        # Skip pricings that are FREE or have a different tax percentage
        # We don't want to filter these away in the queryset, as that might cause us to incorrectly create new pricings
        # in some cases. e.g. Current pricing is PAID, but the future pricing is FREE or has a different tax percentage.
        if (
            pricing.pricing_type == PricingType.PAID
            and pricing.highest_price > 0
            and pricing.tax_percentage == current_tax_percentage
            # Don't create a new pricing if the reservation unit has a future pricing after the change date
            and pricing.begins < change_date
        ):
            ReservationUnitPricing(
                begins=change_date,
                tax_percentage=future_tax_percentage,
                status=PricingStatus.PRICING_STATUS_FUTURE,
                pricing_type=pricing.pricing_type,
                price_unit=pricing.price_unit,
                lowest_price=pricing.lowest_price,
                highest_price=pricing.highest_price,
                reservation_unit=pricing.reservation_unit,
            ).save()

    # Log any unhandled future pricings
    # PAID Pricings that begin on or after the change date
    unhandled_future_pricings = ReservationUnitPricing.objects.filter(
        begins__gte=change_date,
        tax_percentage=current_tax_percentage,
        pricing_type=PricingType.PAID,
        highest_price__gte=0,
        status__in=(PricingStatus.PRICING_STATUS_ACTIVE, PricingStatus.PRICING_STATUS_FUTURE),
    )

    if not unhandled_future_pricings:
        return

    for pricing in unhandled_future_pricings:
        logger.info(f"Pricing should be handled manually: {pricing.id} {pricing.reservation_unit.name} {pricing}")

    unhandled_future_pricings_str = ", ".join(
        [f"<{pricing.id}: {pricing.reservation_unit}: {pricing}>" for pricing in unhandled_future_pricings]
    )
    SentryLogger.log_message(
        message="Task `update_reservation_unit_pricings_tax_percentage` has unhandled future pricings",
        details=f"Task found the following unhandled future pricings: {unhandled_future_pricings_str}",
        level="info",
    )


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
def update_urls(pk: int | None = None) -> None:
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
def purge_image_cache(image_path: str) -> None:
    purge(image_path)
