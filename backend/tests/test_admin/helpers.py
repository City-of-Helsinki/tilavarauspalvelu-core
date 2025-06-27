from __future__ import annotations

from contextlib import contextmanager
from typing import TYPE_CHECKING, Any
from unittest.mock import patch

from django.template.response import TemplateResponse

if TYPE_CHECKING:
    from collections.abc import Generator

    from tilavarauspalvelu.models import ReservationUnit
    from tilavarauspalvelu.typing import WSGIRequest


@contextmanager
def collect_admin_form_errors(errors: list[dict[str, Any]]) -> Generator[None, Any]:
    """Collect errors from the admin form to the given list of errors."""

    def hook(request: WSGIRequest, template: list[str], context: dict[str, Any], *args, **kwargs) -> TemplateResponse:
        errors.extend(context["errors"].get_json_data())
        return TemplateResponse(request, template, context, *args, **kwargs)

    path = "django.contrib.admin.options.TemplateResponse"
    with patch(path, side_effect=hook):
        yield


def management_form_data(name: str, *, total_forms: int = 0, initial_forms: int = 0) -> dict[str, Any]:
    """
    Required formset "management form" data for inline forms.

    :params name: Name of the one-to-many or many-to-many relationship the inline form is for.
    :params total_forms: Number of forms in the formset after the form has been submitted.
    :params initial_forms: Number of forms in the formset before the form has been submitted.
    """
    return {
        f"{name}-TOTAL_FORMS": total_forms,
        f"{name}-INITIAL_FORMS": initial_forms,
        f"{name}-MIN_NUM_FORMS": 0,
        f"{name}-MAX_NUM_FORMS": 1000,
    }


def required_reservation_unit_form_data(reservation_unit: ReservationUnit) -> dict[str, Any]:
    """Required fields for a new reservation unit."""
    return {
        #
        # Required fields
        "unit": reservation_unit.unit.pk,
        "name": reservation_unit.name,
        "name_fi": reservation_unit.name_fi,
        "reservation_kind": reservation_unit.reservation_kind,
        "authentication": reservation_unit.authentication,
        "reservation_start_interval": reservation_unit.reservation_start_interval,
        "reservation_form": reservation_unit.reservation_form,
        #
        # Inline form metadata
        **management_form_data("images"),
        **management_form_data("pricings"),
        **management_form_data("application_round_time_slots"),
        **management_form_data("access_types"),
    }
