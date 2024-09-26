from django.contrib import admin
from django.db.models import QuerySet
from lookup_property import L

from common.typing import WSGIRequest
from tilavarauspalvelu.admin.application_section.form import SuitableTimeRangeInlineAdminForm
from tilavarauspalvelu.models import SuitableTimeRange


class SuitableTimeRangeInline(admin.TabularInline):
    model = SuitableTimeRange
    form = SuitableTimeRangeInlineAdminForm
    extra = 0

    def get_queryset(self, request: WSGIRequest) -> QuerySet:
        return super().get_queryset(request).annotate(fulfilled=L("fulfilled"))
