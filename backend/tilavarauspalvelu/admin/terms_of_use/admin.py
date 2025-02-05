from __future__ import annotations

from typing import TYPE_CHECKING

from admin_extra_buttons.decorators import button
from admin_extra_buttons.mixins import ExtraButtonsMixin
from django.contrib import admin
from django.forms import ModelForm
from django.http import HttpResponseRedirect
from django.urls import reverse
from modeltranslation.admin import TranslationAdmin
from tinymce.widgets import TinyMCE

from tilavarauspalvelu.models import TermsOfUse

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import WSGIRequest


__all__ = [
    "TermsOfUseAdmin",
]


class TermsOfUseAdminForm(ModelForm):
    class Meta:
        model = TermsOfUse
        fields = [
            "id",
            "name",
            "text",
            "terms_type",
        ]
        widgets = {"text": TinyMCE()}


@admin.register(TermsOfUse)
class TermsOfUseAdmin(ExtraButtonsMixin, TranslationAdmin):
    # List
    list_display = [
        "id",
        "name",
        "terms_type",
    ]
    list_filter = ["terms_type"]

    # Form
    form = TermsOfUseAdminForm

    @button(label="Show PDF", change_form=True, visible=lambda self: self.original.id == "booking")
    def show_pdf(self, request: WSGIRequest) -> HttpResponseRedirect:
        url = reverse("terms_of_use_pdf") + "?as_attachment=False"
        return HttpResponseRedirect(url)
