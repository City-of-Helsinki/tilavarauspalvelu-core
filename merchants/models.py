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
