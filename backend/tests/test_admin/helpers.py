from __future__ import annotations

from contextlib import contextmanager
from typing import TYPE_CHECKING, Any
from unittest.mock import patch

from django.db import connection
from django.template.response import TemplateResponse
from django.test.utils import CaptureQueriesContext

from tilavarauspalvelu.enums import TermsOfUseTypeChoices

from tests.factories import ReservationPurposeFactory, TermsOfUseFactory

if TYPE_CHECKING:
    from collections.abc import Generator

    from django.test import Client

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
        "payment_terms": getattr(reservation_unit.payment_terms, "pk", ""),
        "cancellation_terms": getattr(reservation_unit.cancellation_terms, "pk", ""),
        "service_specific_terms": getattr(reservation_unit.service_specific_terms, "pk", ""),
        "pricing_terms": getattr(reservation_unit.pricing_terms, "pk", ""),
        #
        # Inline form metadata
        **management_form_data("images"),
        **management_form_data("reservation_unit_pricing_groups"),
        **management_form_data("application_round_time_slots"),
        **management_form_data("access_types"),
    }


def round_form_data(*, name: str, reservation_unit_pks: list[int]) -> dict[str, Any]:
    terms_of_use = TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.RECURRING)
    purpose = ReservationPurposeFactory.create()
    return {
        "name_fi": name,
        "name_en": "",
        "name_sv": "",
        "terms_of_use": terms_of_use.pk,
        "purposes": [purpose.pk],
        "reservation_units": reservation_unit_pks,
        "application_period_begins_at_0": "2027-01-01",
        "application_period_begins_at_1": "00:00:00",
        "application_period_ends_at_0": "2027-02-01",
        "application_period_ends_at_1": "00:00:00",
        "reservation_period_begin_date": "2027-05-01",
        "reservation_period_end_date": "2027-08-31",
        "public_display_begins_at_0": "2027-01-01",
        "public_display_begins_at_1": "00:00:00",
        "public_display_ends_at_0": "2027-09-01",
        "public_display_ends_at_1": "00:00:00",
        "criteria_fi": "",
        "criteria_en": "",
        "criteria_sv": "",
        "notes_when_applying_fi": "",
        "notes_when_applying_en": "",
        "notes_when_applying_sv": "",
    }


def count_queries(client: Client, url: str) -> int:
    """Count the queries of a GET request to the given admin page."""
    # The first request fills caches, such as the content type cache, so it runs more queries.
    client.get(url)

    with CaptureQueriesContext(connection) as context:
        response = client.get(url)

    assert response.status_code == 200, url
    return len(context.captured_queries)
