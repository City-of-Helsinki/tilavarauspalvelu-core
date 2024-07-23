from django import forms
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from merchants.models import PaymentAccounting, PaymentMerchant, PaymentOrder
from merchants.verkkokauppa.merchants.exceptions import GetMerchantError
from merchants.verkkokauppa.merchants.types import CreateMerchantParams, UpdateMerchantParams
from merchants.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient


class PaymentMerchantForm(forms.ModelForm):
    # paytrail_merchant_id is only used when creating a merchant, later we use the ID returned from the Merchant API
    paytrail_merchant_id = forms.CharField(
        label=_("Paytrail merchant ID"),
        max_length=16,
        required=True,
        help_text=_("The Paytrail Merchant ID should be a six-digit number."),
    )

    # These fields are saved to / loaded from Merchant API, so they are not part of the model
    shop_id = forms.CharField(label=_("Shop ID"), max_length=256, required=True)
    business_id = forms.CharField(
        label=_("Business ID"),
        max_length=16,
        required=True,
    )
    street = forms.CharField(label=_("Street address"), max_length=128, required=True)
    zip = forms.CharField(label=_("ZIP code"), max_length=16, required=True)
    city = forms.CharField(label=_("City"), max_length=128, required=True)
    email = forms.CharField(label=_("Email address"), max_length=128, required=True)
    phone = forms.CharField(label=_("Phone number"), max_length=32, required=True)
    url = forms.CharField(label=_("URL"), max_length=256, required=True)
    tos_url = forms.CharField(label=_("Terms of service URL"), max_length=256, required=True)

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        instance: PaymentMerchant | None = kwargs.get("instance", None)
        if instance and instance.id:
            merchant_info = VerkkokauppaAPIClient.get_merchant(merchant_uuid=instance.id)
            if merchant_info is None:
                raise GetMerchantError(f"Merchant info for {instance.id!s} not found from Merchant API")

            self.fields["shop_id"].initial = merchant_info.shop_id
            self.fields["name"].initial = merchant_info.name
            self.fields["street"].initial = merchant_info.street
            self.fields["zip"].initial = merchant_info.zip
            self.fields["city"].initial = merchant_info.city
            self.fields["email"].initial = merchant_info.email
            self.fields["phone"].initial = merchant_info.phone
            self.fields["url"].initial = merchant_info.url
            self.fields["tos_url"].initial = merchant_info.tos_url
            self.fields["business_id"].initial = merchant_info.business_id

            # Hide paytrail_merchant_id field when editing an existing merchant
            self.fields["paytrail_merchant_id"].required = False
            self.fields["paytrail_merchant_id"].widget.input_type = "hidden"

    def save(self, commit=True):
        instance: PaymentMerchant | None = self.instance

        if instance:
            params = {
                "name": self.cleaned_data.get("name", ""),
                "street": self.cleaned_data.get("street", ""),
                "zip": self.cleaned_data.get("zip", ""),
                "city": self.cleaned_data.get("city", ""),
                "email": self.cleaned_data.get("email", ""),
                "phone": self.cleaned_data.get("phone", ""),
                "url": self.cleaned_data.get("url", ""),
                "tos_url": self.cleaned_data.get("tos_url", ""),
                "business_id": self.cleaned_data.get("business_id", ""),
                "shop_id": self.cleaned_data.get("shop_id", ""),
            }

            if instance.id is None:
                params = CreateMerchantParams(
                    **params,
                    paytrail_merchant_id=self.cleaned_data.get("shop_id", ""),
                )
                created_merchant = VerkkokauppaAPIClient.create_merchant(params=params)
                instance.id = created_merchant.id
            else:
                params = UpdateMerchantParams(**params)
                VerkkokauppaAPIClient.update_merchant(merchant_uuid=instance.id, params=params)

        return super().save(commit=commit)


@admin.register(PaymentMerchant)
class PaymentMerchantAdmin(admin.ModelAdmin):
    form = PaymentMerchantForm
    readonly_fields = ["id"]


class PaymentOrderForm(forms.ModelForm):
    class Meta:
        model = PaymentOrder
        fields = [
            "reservation",
            "remote_id",
            "payment_id",
            "refund_id",
            "payment_type",
            "status",
            "price_net",
            "price_vat",
            "price_total",
            "processed_at",
            "language",
            "reservation_user_uuid",
            "checkout_url",
            "receipt_url",
        ]

    def __init__(self, *args, **kwargs) -> None:
        """Add reservation and reservation unit to the reservation field help text."""
        super().__init__(*args, **kwargs)
        payment_order: PaymentOrder | None = kwargs.get("instance", None)
        if payment_order and payment_order.id and payment_order.reservation:
            self.fields["reservation"].help_text += (
                "<br>" + _("Reservation") + f": {payment_order.reservation.id}"
                "<br>" + _("Reservation unit") + f": {payment_order.reservation.reservation_unit.first()}"
            )


class PaymentOrderInline(admin.TabularInline):
    model = PaymentOrder
    extra = 0
    show_change_link = True
    can_delete = False
    fields = [
        "id",
        "payment_type",
        "status",
        "price_total",
    ]
    readonly_fields = fields


@admin.register(PaymentOrder)
class PaymentOrderAdmin(admin.ModelAdmin):
    form = PaymentOrderForm

    list_display = [
        "id",
        "reservation_id",
        "status",
        "price_total",
        "price_net",
        "payment_type",
        "processed_at",
        "reservation_unit",
    ]
    list_filter = [
        "status",
        "payment_type",
    ]

    search_fields = [
        "id__exact",
        "reservation__id__exact",
        "reservation__reservation_unit__name",
    ]
    search_help_text = _("Search by Payment order ID, Reservation ID or Reservation unit name")

    def reservation_unit(self, obj: PaymentOrder) -> str:
        return obj.reservation.reservation_unit.first() if obj.reservation else ""


@admin.register(PaymentAccounting)
class PaymentAccountingAdmin(admin.ModelAdmin):
    pass
