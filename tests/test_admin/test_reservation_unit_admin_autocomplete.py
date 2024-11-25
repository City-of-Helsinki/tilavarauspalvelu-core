import pytest
from django.test import RequestFactory

from tilavarauspalvelu.admin.reservation_unit.admin import ReservationUnitAdmin
from tilavarauspalvelu.enums import ReservationKind
from tilavarauspalvelu.models import ReservationUnit

from tests.factories import ReservationUnitFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit_admin__autocomplete__reservation_kind_is_direct_are_excluded_from_queryset():
    include_these = ReservationUnitFactory.create_batch(5, reservation_kind=ReservationKind.DIRECT_AND_SEASON)
    exclude_these = ReservationUnitFactory.create_batch(4, reservation_kind=ReservationKind.DIRECT)

    reservation_unit_admin = ReservationUnitAdmin(ReservationUnit, None)
    get_request = RequestFactory().get(
        "/admin/autocomplete/?app_label=application&model_name=applicationround&field_name=reservation_units",
        data={
            "app_label": "application",
            "model_name": "applicationround",
            "field_name": "reservation_units",
        },
    )

    queryset, _ = reservation_unit_admin.get_search_results(get_request, ReservationUnit.objects.all(), "")

    assert queryset.count() == 5

    for r in include_these:
        assert queryset.filter(pk=r.pk).exists()

    for r in exclude_these:
        assert not queryset.filter(pk=r.pk).exists()


def test_reservation_unit_admin__autocomplete__requests_from_not_application_round_results_all():
    include_these = ReservationUnitFactory.create_batch(5, reservation_kind=ReservationKind.DIRECT_AND_SEASON)
    exclude_these = ReservationUnitFactory.create_batch(4, reservation_kind=ReservationKind.DIRECT)

    reservation_unit_admin = ReservationUnitAdmin(ReservationUnit, None)
    get_request = RequestFactory().get(
        "/admin/autocomplete/?app_label=reservations&model_name=reservation&field_name=reservation_unit",
        data={
            "app_label": "reservations",
            "model_name": "reservation",
            "field_name": "reservation_unit",
        },
    )

    queryset, _ = reservation_unit_admin.get_search_results(get_request, ReservationUnit.objects.all(), "")

    assert queryset.count() == 9

    for r in include_these + exclude_these:
        assert queryset.filter(pk=r.pk).exists()
