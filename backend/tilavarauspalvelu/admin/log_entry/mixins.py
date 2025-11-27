from __future__ import annotations

from typing import TYPE_CHECKING

from admin_extra_buttons.decorators import button
from admin_extra_buttons.mixins import ExtraButtonsMixin
from auditlog.mixins import AuditlogHistoryAdminMixin
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.utils.translation import gettext_lazy as _

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import WSGIRequest


class TVPAuditlogHistoryAdminMixin(AuditlogHistoryAdminMixin, ExtraButtonsMixin):
    @button(label=_("Audit logs"), change_form=True)
    def link_to_object_auditlog_view(self, request: WSGIRequest, pk: int) -> HttpResponseRedirect | None:
        for url in self.get_urls():
            if url.name.endswith("_auditlog"):
                return HttpResponseRedirect(reverse(f"admin:{url.name}", args=[pk]))
        return None
