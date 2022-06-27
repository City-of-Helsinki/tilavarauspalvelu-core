from django.contrib import admin
from django.forms import CharField, ModelForm
from tinymce.widgets import TinyMCE

from terms_of_use.models import TermsOfUse


class TermsOfUseAdminForm(ModelForm):
    text = CharField(widget=TinyMCE())

    class Meta:
        model = TermsOfUse
        fields = "__all__"


@admin.register(TermsOfUse)
class TermsOfUseAdmin(admin.ModelAdmin):
    model = TermsOfUse
    form = TermsOfUseAdminForm
