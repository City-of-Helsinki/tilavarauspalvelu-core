from django.contrib import admin
from django.forms import CharField, ModelForm
from tinymce.widgets import TinyMCE

from terms_of_use.models import TermsOfUse


class TermsOfUseAdminForm(ModelForm):
    text = CharField(widget=TinyMCE())

    class Meta:
        model = TermsOfUse
        fields = [
            "id",
            "name",
            "name_fi",
            "name_en",
            "name_sv",
            "text",
            "text_fi",
            "text_en",
            "text_sv",
            "terms_type",
        ]


@admin.register(TermsOfUse)
class TermsOfUseAdmin(admin.ModelAdmin):
    model = TermsOfUse
    form = TermsOfUseAdminForm
    list_display = ("__str__", "terms_type")
    list_filter = ("terms_type",)
