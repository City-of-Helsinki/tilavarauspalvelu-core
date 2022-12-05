from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _


class PaymentMerchant(models.Model):
    """
    ID is not auto-generated. It comes from the Merchant experience API. See admin.py.
    https://checkout-dev-api.test.hel.ninja/v1/merchant/docs/swagger-ui/#
    """

    id = models.UUIDField(
        verbose_name=_("Merchant ID"),
        help_text=_("Value comes from the Merchant Experience API"),
        primary_key=True,
        blank=False,
        null=False,
    )
    name = models.CharField(
        verbose_name=_("Merchant name"), blank=False, null=False, max_length=128
    )

    def save(
        self, force_insert=False, force_update=False, using=None, update_fields=None
    ):
        return super().save(force_insert, force_update, using, update_fields)

    def __str__(self) -> str:
        return self.name


class PaymentProduct(models.Model):
    id = models.UUIDField(
        verbose_name=_("Product ID"),
        help_text=_("Value comes from the Product Experience API"),
        primary_key=True,
        blank=False,
        null=False,
    )
    merchant = models.ForeignKey(
        PaymentMerchant,
        verbose_name=_("Payment merchant"),
        related_name="products",
        on_delete=models.PROTECT,
        null=True,
        help_text="Merchant used for payments",
    )

    def __str__(self) -> str:
        return str(self.id)


class PaymentType(models.TextChoices):
    ON_SITE = "ON_SITE", _("On site")
    ONLINE = "ONLINE", _("Online")
    INVOICE = "INVOICE", _("Invoice")


class OrderStatus(models.TextChoices):
    DRAFT = "DRAFT", _("Draft")
    EXPIRED = "EXPIRED", _("Expired")
    CANCELLED = "CANCELLED", _("Cancelled")
    PAID = "PAID", _("Paid")
    PAID_MANUALLY = "PAID_MANUALLY", _("Paid manually")
    REFUNDED = "REFUNDED", _("Refunded")


class Language(models.TextChoices):
    FI = "fi", _("Finnish")
    SV = "sv", _("Swedish")
    EN = "en", _("English")


class PaymentOrder(models.Model):
    reservation = models.ForeignKey(
        "reservations.Reservation",
        verbose_name=_("Reservation"),
        related_name="payment_order",
        on_delete=models.SET_NULL,
        null=True,
        help_text="Reservation this order is based on",
    )

    remote_id = models.UUIDField(
        verbose_name=_("Remote order ID"),
        help_text=_("eCommerce order ID"),
        blank=True,
        null=True,
    )
    payment_id = models.CharField(
        verbose_name=_("Payment ID"),
        help_text=_("eCommerce payment ID"),
        blank=True,
        null=True,
        max_length=128,
    )
    payment_type = models.CharField(
        verbose_name=_("Payment type"),
        blank=False,
        null=False,
        max_length=128,
        choices=PaymentType.choices,
    )
    status = models.CharField(
        verbose_name=_("Payment status"),
        blank=False,
        null=False,
        max_length=128,
        choices=OrderStatus.choices,
    )
    price_net = models.DecimalField(
        verbose_name=_("Net amount"),
        max_digits=10,
        decimal_places=2,
    )

    price_vat = models.DecimalField(
        verbose_name=_("VAT amount"),
        max_digits=10,
        decimal_places=2,
    )

    price_total = models.DecimalField(
        verbose_name=_("Total amount"),
        max_digits=10,
        decimal_places=2,
    )

    created_at = models.DateTimeField(
        verbose_name=_("Created at"), null=False, auto_now_add=True
    )

    processed_at = models.DateTimeField(
        verbose_name=_("Processed at"), null=True, blank=True
    )

    language = models.CharField(
        verbose_name=_("Language"),
        blank=False,
        null=False,
        max_length=8,
        choices=Language.choices,
    )
    reservation_user_uuid = models.UUIDField(
        verbose_name=_("Reservation user UUID"),
        blank=True,
        null=True,
    )
    checkout_url = models.CharField(
        verbose_name=_("Checkout URL"),
        blank=True,
        null=True,
        max_length=512,
    )
    receipt_url = models.CharField(
        verbose_name=_("Receipt URL"),
        blank=True,
        null=True,
        max_length=512,
    )

    def clean(self):
        validation_errors = {}

        failsafe_price_net = self.price_net or Decimal("0.0")
        failsafe_price_vat = self.price_vat or Decimal("0.0")

        if self.price_net is not None and self.price_net < 0.01:
            validation_errors.setdefault("price_net", []).append(
                _("Must be greater than 0.01")
            )
        if self.price_vat is not None and self.price_vat < 0:
            validation_errors.setdefault("price_vat", []).append(
                _("Must be greater than 0")
            )
        if (
            self.price_total is not None
            and self.price_total != failsafe_price_net + failsafe_price_vat
        ):
            validation_errors.setdefault("price_total", []).append(
                _("Must be the sum of net and vat amounts")
            )

        if validation_errors:
            raise ValidationError(validation_errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)
