from django.contrib import admin
from django.forms import ModelForm
from modeltranslation.admin import TranslationAdmin
from tinymce.widgets import TinyMCE

from terms_of_use.models import TermsOfUse

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
class TermsOfUseAdmin(TranslationAdmin):
    # List
    list_display = [
        "id",
        "name",
        "terms_type",
    ]
    list_filter = ["terms_type"]

    # Form
    form = TermsOfUseAdminForm
