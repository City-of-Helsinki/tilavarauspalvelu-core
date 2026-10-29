from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django import forms
from django.contrib import admin, messages
from django.utils.translation import gettext_lazy as _

from tilavarauspalvelu.admin.log_entry.mixins import TVPAuditlogHistoryAdminMixin
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.integrations.verkkokauppa.merchants.exceptions import GetMerchantError
from tilavarauspalvelu.integrations.verkkokauppa.merchants.types import CreateMerchantParams, UpdateMerchantParams
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from tilavarauspalvelu.models import PaymentMerchant

if TYPE_CHECKING:
    from django.http import HttpResponse

    from tilavarauspalvelu.typing import WSGIRequest

__all__ = [
    "PaymentMerchantAdmin",
]

MERCHANT_INFO_MISSING_MESSAGE = _(
    "The merchant could not be loaded from the Merchant API. You cannot save changes to this merchant."
)


class PaymentMerchantForm(forms.ModelForm):
    # paytrail_merchant_id is only used when creating a merchant, later we use the ID returned from the Merchant API
    paytrail_merchant_id = forms.CharField(
        label="Paytrail merchant ID",  # Label is intentionally left untranslated (TILA-3425)
        max_length=16,
        required=True,
        help_text=_("The Paytrail Merchant ID should be a six-digit number."),
    )

    # These fields are saved to / loaded from Merchant API, so they are not part of the model
    shop_id = forms.CharField(label=_("Shop ID"), max_length=256, required=True)
    business_id = forms.CharField(label=_("Business ID"), max_length=16, required=True)
    street = forms.CharField(label=_("Street address"), max_length=128, required=True)
    zip = forms.CharField(label=_("ZIP code"), max_length=16, required=True)
    city = forms.CharField(label=_("City"), max_length=128, required=True)
    email = forms.CharField(label=_("Email address"), max_length=128, required=True)
    phone = forms.CharField(label=_("Phone number"), max_length=32, required=True)
    url = forms.CharField(label=_("URL"), max_length=256, required=True)
    tos_url = forms.CharField(label=_("Terms of service URL"), max_length=256, required=True)

    class Meta:
        model = PaymentMerchant
        fields = [
            "id",
            "name",
            "paytrail_merchant_id",
            "shop_id",
            "business_id",
            "street",
            "zip",
            "city",
            "email",
            "phone",
            "url",
            "tos_url",
        ]
        labels = {
            "id": _("Merchant ID"),
            "name": _("Merchant name"),
        }
        help_texts = {
            "id": _("Value comes from the Merchant Experience API"),
        }

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.merchant_info_missing = False

        instance: PaymentMerchant | None = kwargs.get("instance")
        if instance is None or instance.id is None:
            return

        # Hide paytrail_merchant_id field when editing an existing merchant
        self.fields["paytrail_merchant_id"].required = False
        self.fields["paytrail_merchant_id"].widget.input_type = "hidden"

        try:
            merchant_info = VerkkokauppaAPIClient.get_merchant(merchant_uuid=instance.id)
        except GetMerchantError as error:
            SentryLogger.log_exception(error, details=f"Could not load merchant '{instance.id}' for the admin")
            merchant_info = None
        else:
            if merchant_info is None:
                SentryLogger.log_message(f"Merchant '{instance.id}' not found from the Merchant API", level="warning")

        # Saving would send empty values to the Merchant API, so disable the fields and block saving.
        if merchant_info is None:
            self.merchant_info_missing = True
            for field in self.fields.values():
                field.disabled = True
                field.required = False
            return

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

    def clean(self) -> dict[str, Any]:
        cleaned_data = super().clean()
        if self.merchant_info_missing:
            raise forms.ValidationError(MERCHANT_INFO_MISSING_MESSAGE)
        return cleaned_data

    def save(self, commit: bool = True) -> PaymentMerchant:  # noqa: FBT001 FBT002
        instance: PaymentMerchant | None = self.instance

        if instance:
            if instance.id is None:
                create_params = CreateMerchantParams(
                    name=self.cleaned_data.get("name", ""),
                    street=self.cleaned_data.get("street", ""),
                    zip=self.cleaned_data.get("zip", ""),
                    city=self.cleaned_data.get("city", ""),
                    email=self.cleaned_data.get("email", ""),
                    phone=self.cleaned_data.get("phone", ""),
                    url=self.cleaned_data.get("url", ""),
                    tos_url=self.cleaned_data.get("tos_url", ""),
                    business_id=self.cleaned_data.get("business_id", ""),
                    shop_id=self.cleaned_data.get("shop_id", ""),
                    paytrail_merchant_id=self.cleaned_data.get("shop_id", ""),
                )
                created_merchant = VerkkokauppaAPIClient.create_merchant(params=create_params)
                instance.id = created_merchant.id
            else:
                update_params = UpdateMerchantParams(
                    name=self.cleaned_data.get("name", ""),
                    street=self.cleaned_data.get("street", ""),
                    zip=self.cleaned_data.get("zip", ""),
                    city=self.cleaned_data.get("city", ""),
                    email=self.cleaned_data.get("email", ""),
                    phone=self.cleaned_data.get("phone", ""),
                    url=self.cleaned_data.get("url", ""),
                    tos_url=self.cleaned_data.get("tos_url", ""),
                    business_id=self.cleaned_data.get("business_id", ""),
                    shop_id=self.cleaned_data.get("shop_id", ""),
                )
                VerkkokauppaAPIClient.update_merchant(merchant_uuid=instance.id, params=update_params)

        return super().save(commit=commit)


@admin.register(PaymentMerchant)
class PaymentMerchantAdmin(TVPAuditlogHistoryAdminMixin, admin.ModelAdmin):
    # Form
    form = PaymentMerchantForm
    readonly_fields = ["id"]

    def render_change_form(
        self,
        request: WSGIRequest,
        context: dict[str, Any],
        add: bool = False,  # noqa: FBT001 FBT002
        change: bool = False,  # noqa: FBT001 FBT002
        form_url: str = "",
        obj: PaymentMerchant | None = None,
    ) -> HttpResponse:
        form: PaymentMerchantForm = context["adminform"].form
        if form.merchant_info_missing and request.method == "GET":
            self.message_user(request, MERCHANT_INFO_MISSING_MESSAGE, level=messages.WARNING)

        return super().render_change_form(request, context, add=add, change=change, form_url=form_url, obj=obj)
