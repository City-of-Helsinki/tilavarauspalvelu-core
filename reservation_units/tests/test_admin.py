from assertpy import assert_that
from django.test import RequestFactory, TestCase

from reservation_units.admin import ReservationUnitAdmin
from reservation_units.models import ReservationKind, ReservationUnit
from reservation_units.tests.factories import ReservationUnitFactory


class ReservationUnitAdminApplicationRoundTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.include_these = ReservationUnitFactory.create_batch(
            5, reservation_kind=ReservationKind.DIRECT_AND_SEASON
        )
        cls.exclude_these = ReservationUnitFactory.create_batch(
            4, reservation_kind=ReservationKind.DIRECT
        )

        cls.radmin = ReservationUnitAdmin(ReservationUnit, None)
        cls.queryset = ReservationUnit.objects.all()
        cls.req_factory = RequestFactory()

    def test_reservation_kind_is_direct_are_excluded_from_queryset(self):
        get_request = self.req_factory.get(
            "/admin/autocomplete/?app_label=applications&model_name=applicationround&field_name=reservation_units",
            data={
                "app_label": "applications",
                "model_name": "applicationround",
                "field_name": "reservation_units",
            },
        )

        queryset, _ = self.radmin.get_search_results(get_request, self.queryset, "")

        assert_that(queryset.count()).is_equal_to(5)

        for r in self.include_these:
            assert_that(queryset.filter(pk=r.pk).exists()).is_true()

        for r in self.exclude_these:
            assert_that(queryset.filter(pk=r.pk).exists()).is_false()

    def test_requests_from_not_application_round_results_all(self):
        get_request = self.req_factory.get(
            "/admin/autocomplete/?app_label=reservations&model_name=reservation&field_name=reservation_unit",
            data={
                "app_label": "reservations",
                "model_name": "reservation",
                "field_name": "reservation_unit",
            },
        )

        queryset, _ = self.radmin.get_search_results(get_request, self.queryset, "")

        assert_that(queryset.count()).is_equal_to(9)

        for r in self.include_these + self.exclude_these:
            assert_that(queryset.filter(pk=r.pk).exists()).is_true()
