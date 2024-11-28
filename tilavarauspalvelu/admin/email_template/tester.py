from __future__ import annotations

from typing import TYPE_CHECKING, Any

from admin_data_views.settings import admin_data_settings
from django import forms
from django.contrib import admin, messages
from django.http import HttpResponse, HttpResponseRedirect
from django.template.response import TemplateResponse
from django.urls import reverse
from django.utils.translation import gettext_lazy as _

from tilavarauspalvelu.enums import EmailType, Language
from tilavarauspalvelu.integrations.email.dataclasses import EmailData
from tilavarauspalvelu.integrations.email.sending import send_emails_in_batches_task
from tilavarauspalvelu.models import ReservationUnit
from utils.utils import safe_getattr

from .forms import select_tester_form

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import WSGIRequest


class TemplateSwitcherForm(forms.Form):
    """Allows switching between templates in the email tester."""

    email_type = forms.ChoiceField(
        choices=EmailType.choices,
        widget=forms.Select(attrs={"id": "test_email_template_select"}),
    )


class ReservationUnitSelectForm(forms.Form):
    """Allows pre-filling the email tester from a reservation unit."""

    reservation_unit = forms.ChoiceField(
        widget=forms.Select(attrs={"id": "test_email_reservation_unit_select"}),
    )

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        runit_choices = [(None, "-")] + [
            (runit.pk, f"{runit.name} - {safe_getattr(runit, 'unit.name')}")
            for runit in ReservationUnit.objects.select_related("unit").order_by("name_fi")
        ]
        self.fields["reservation_unit"].choices = runit_choices


def email_tester_admin_redirect_view(request: WSGIRequest, email_type: str | None = None) -> HttpResponseRedirect:
    # This view exists as a link to the email tester from the main page.
    return HttpResponseRedirect(
        reverse(
            "admin:email_tester",
            kwargs={"email_type": email_type or EmailType.RESERVATION_CONFIRMED.value},
            current_app=admin_data_settings.NAME,
        )
    )


def email_tester_admin_view(request: WSGIRequest, email_type: str) -> HttpResponse:
    new_email_type = request.GET.get("email_type", None)
    if new_email_type is not None:
        return email_tester_admin_redirect_view(request=request, email_type=new_email_type)

    try:
        email_type = EmailType(email_type)
    except ValueError:
        return HttpResponse(f"Invalid email type: {email_type}")

    tester_form_class = select_tester_form(email_type=email_type)
    if tester_form_class is None:
        return HttpResponse(f"No form defined for email type: {email_type}")

    reservation_unit_pk: str | None = request.GET.get("reservation_unit", None)

    reservation_unit_form = ReservationUnitSelectForm()
    template_switcher_form = TemplateSwitcherForm(initial={"email_type": email_type})

    if request.method == "POST":
        tester_form = tester_form_class(data=request.POST)
        if tester_form.is_valid():
            recipients = [tester_form.cleaned_data["send_to"]]
            context = tester_form.to_context()
            email = EmailData.build(recipients=recipients, context=context, email_type=email_type)
            send_emails_in_batches_task(email)

            messages.add_message(
                request=request,
                level=messages.INFO,
                message=_("Test email '%(email_type)s' successfully sent.") % {"email_type": email_type.label},
            )

    elif reservation_unit_pk:
        reservation_unit = ReservationUnit.objects.get(id=int(reservation_unit_pk))
        tester_form = tester_form_class.from_reservation_unit(reservation_unit, language=Language.FI.value)
        tester_form.initial["send_to"] = request.user.email or ""
        reservation_unit_form.initial["reservation_unit"] = reservation_unit.pk

    else:
        tester_form = tester_form_class()
        tester_form.initial["send_to"] = request.user.email or ""

    context = {
        **admin.site.each_context(request),
        "title": "Email Template Testing",
        "base_site_template": "admin/base_site.html",  # See: 'helusers.admin_site.AdminSite.each_context'
        "app_view_name": admin_data_settings.NAME,  # For breadcrumbs
        "form": tester_form,
        "reservation_unit_form": reservation_unit_form,
        "template_switcher_form": template_switcher_form,
    }

    return TemplateResponse(request, "email/email_tester.html", context=context)
