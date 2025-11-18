from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from lookup_property import L

if TYPE_CHECKING:
    from django.db.models import QuerySet

    from tilavarauspalvelu.typing import WSGIRequest


class ShouldHaveActiveAccessCodeFilter(admin.SimpleListFilter):
    title = _("Should have active door code")
    parameter_name = "should_have_active_access_code"

    def lookups(self, *args: Any) -> list[tuple[str, str]]:
        return [
            ("1", _("Yes")),
            ("0", _("No")),
        ]

    def queryset(self, request: WSGIRequest, queryset: QuerySet) -> QuerySet:
        if self.value() == "1":
            return queryset.filter(L(should_have_active_access_code=True))
        if self.value() == "0":
            return queryset.filter(L(should_have_active_access_code=False))
        return queryset
