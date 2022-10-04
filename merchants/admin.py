from django import forms
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from merchants.models import PaymentMerchant
from verkkokauppa.merchants.requests import (
    create_merchant,
    get_merchant,
    update_merchant,
)
from verkkokauppa.merchants.types import CreateMerchantParams, UpdateMerchantParams


class PaymentMerchantForm(forms.ModelForm):
    # These fields are saved to / loaded from Merchant API so they are not part of the model
    business_id = forms.CharField(
        label=_("Business ID"),
        max_length=16,
        required=False,
    )
    street = forms.CharField(label=_("Street address"), max_length=128, required=False)
    zip = forms.CharField(label=_("ZIP code"), max_length=16, required=False)
    city = forms.CharField(label=_("City"), max_length=128, required=False)
    email = forms.CharField(label=_("Email address"), max_length=128, required=False)
    phone = forms.CharField(label=_("Phone number"), max_length=32, required=False)
    url = forms.CharField(label=_("URL"), max_length=256, required=False)
    tos_url = forms.CharField(
        label=_("Terms of service URL"), max_length=256, required=False
    )

    def __init__(self, *args, **kwargs):
        super(PaymentMerchantForm, self).__init__(*args, **kwargs)
        instance = kwargs.get("instance", None)
        if instance and instance.id:
            merchant_info = get_merchant(instance.id)
            if merchant_info is None:
                raise Exception(
                    f"Merchant info for {str(instance.id)} not found from Merchant API"
                )

            self.fields["name"].initial = merchant_info.name
            self.fields["street"].initial = merchant_info.street
            self.fields["zip"].initial = merchant_info.zip
            self.fields["city"].initial = merchant_info.city
            self.fields["email"].initial = merchant_info.email
            self.fields["phone"].initial = merchant_info.phone
            self.fields["url"].initial = merchant_info.url
            self.fields["tos_url"].initial = merchant_info.tos_url
            self.fields["business_id"].initial = merchant_info.business_id

    def save(self, commit=True):
        if self.instance is None or self.instance.id is None:
            params = CreateMerchantParams(
                name=self.cleaned_data.get("name", ""),
                street=self.cleaned_data.get("street", ""),
                zip=self.cleaned_data.get("zip", ""),
                city=self.cleaned_data.get("city", ""),
                email=self.cleaned_data.get("email", ""),
                phone=self.cleaned_data.get("phone", ""),
                url=self.cleaned_data.get("url", ""),
                tos_url=self.cleaned_data.get("tos_url", ""),
                business_id=self.cleaned_data.get("business_id", ""),
            )
            created_merchant = create_merchant(params)
            self.instance.id = created_merchant.id
        else:
            params = UpdateMerchantParams(
                name=self.cleaned_data.get("name", ""),
                street=self.cleaned_data.get("street", ""),
                zip=self.cleaned_data.get("zip", ""),
                city=self.cleaned_data.get("city", ""),
                email=self.cleaned_data.get("email", ""),
                phone=self.cleaned_data.get("phone", ""),
                url=self.cleaned_data.get("url", ""),
                tos_url=self.cleaned_data.get("tos_url", ""),
                business_id=self.cleaned_data.get("business_id", ""),
            )
            update_merchant(self.instance.id, params)

        return super(PaymentMerchantForm, self).save(commit=commit)


@admin.register(PaymentMerchant)
class PaymentMerchantAdmin(admin.ModelAdmin):
    form = PaymentMerchantForm
    model = PaymentMerchant
    readonly_fields = ["id"]
