from assertpy import assert_that
from django.contrib.admin import AdminSite
from django.test import RequestFactory, TestCase

from reservation_units.admin import ReservationUnitAdmin
from reservation_units.models import ReservationKind, ReservationUnit
from reservation_units.tests.factories import ReservationUnitFactory
from terms_of_use.models import TermsOfUse
from terms_of_use.tests.factories import TermsOfUseFactory


class ReservationUnitAdminApplicationRoundTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.include_these = ReservationUnitFactory.create_batch(5, reservation_kind=ReservationKind.DIRECT_AND_SEASON)
        cls.exclude_these = ReservationUnitFactory.create_batch(4, reservation_kind=ReservationKind.DIRECT)

        cls.queryset = ReservationUnit.objects.all()
        cls.req_factory = RequestFactory()

    def setUp(self):
        self.radmin = ReservationUnitAdmin(ReservationUnit, None)

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


class ReservationUnitAdminTermsValidationTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.reservation_unit = ReservationUnitFactory()

    def setUp(self):
        self.runit_admin = ReservationUnitAdmin(ReservationUnit, AdminSite())
        self.req_factory = RequestFactory()

    def get_valid_data(self):
        return {
            "name": "test",
            "description": "testing besthing",
            "reservation_start_interval": ReservationUnit.RESERVATION_START_INTERVAL_15_MINUTES,
            "authentication": "weak",
            "reservation_kind": ReservationKind.DIRECT_AND_SEASON,
        }

    def test_pricing_terms_accepts_type_pricing(self):
        pricing_terms = TermsOfUseFactory(terms_type=TermsOfUse.TERMS_TYPE_PRICING)

        request = self.req_factory.get(f"/admin/reservation_units/reservationunit/{self.reservation_unit.id}/change/")

        data = self.get_valid_data()
        data["pricing_terms"] = pricing_terms

        ReservationUnitModelForm = self.runit_admin.get_form(request, obj=self.reservation_unit)
        form = ReservationUnitModelForm(instance=self.reservation_unit, data=data)

        assert_that(form.is_valid()).is_true()

    def test_pricing_terms_errors_when_type_not_pricing(self):
        wrong_terms = TermsOfUseFactory(terms_type=TermsOfUse.TERMS_TYPE_GENERIC)

        request = self.req_factory.get(f"/admin/reservation_units/reservationunit/{self.reservation_unit.id}/change/")

        data = self.get_valid_data()
        data["pricing_terms"] = wrong_terms

        ReservationUnitModelForm = self.runit_admin.get_form(request, obj=self.reservation_unit)
        form = ReservationUnitModelForm(instance=self.reservation_unit, data=data)

        assert_that(form.is_valid()).is_false()

    def test_payment_terms_accepts_type_payment(self):
        payment_terms = TermsOfUseFactory(terms_type=TermsOfUse.TERMS_TYPE_PAYMENT)

        request = self.req_factory.get(f"/admin/reservation_units/reservationunit/{self.reservation_unit.id}/change/")

        data = self.get_valid_data()
        data["payment_terms"] = payment_terms

        ReservationUnitModelForm = self.runit_admin.get_form(request, obj=self.reservation_unit)
        form = ReservationUnitModelForm(instance=self.reservation_unit, data=data)

        assert_that(form.is_valid()).is_true()

    def test_payment_terms_errors_when_type_not_payment(self):
        wrong_terms = TermsOfUseFactory(terms_type=TermsOfUse.TERMS_TYPE_GENERIC)

        request = self.req_factory.get(f"/admin/reservation_units/reservationunit/{self.reservation_unit.id}/change/")

        data = self.get_valid_data()
        data["payment_terms"] = wrong_terms

        ReservationUnitModelForm = self.runit_admin.get_form(request, obj=self.reservation_unit)
        form = ReservationUnitModelForm(instance=self.reservation_unit, data=data)

        assert_that(form.is_valid()).is_false()

    def test_cancellation_terms_accepts_type_cancellation(self):
        cancellation_terms = TermsOfUseFactory(terms_type=TermsOfUse.TERMS_TYPE_CANCELLATION)

        request = self.req_factory.get(f"/admin/reservation_units/reservationunit/{self.reservation_unit.id}/change/")

        data = self.get_valid_data()
        data["cancellation_terms"] = cancellation_terms

        ReservationUnitModelForm = self.runit_admin.get_form(request, obj=self.reservation_unit)
        form = ReservationUnitModelForm(instance=self.reservation_unit, data=data)

        assert_that(form.is_valid()).is_true()

    def test_cancellation_terms_errors_when_type_not_cancellation(self):
        wrong_terms = TermsOfUseFactory(terms_type=TermsOfUse.TERMS_TYPE_GENERIC)

        request = self.req_factory.get(f"/admin/reservation_units/reservationunit/{self.reservation_unit.id}/change/")

        data = self.get_valid_data()
        data["cancellation_terms"] = wrong_terms

        ReservationUnitModelForm = self.runit_admin.get_form(request, obj=self.reservation_unit)
        form = ReservationUnitModelForm(instance=self.reservation_unit, data=data)

        assert_that(form.is_valid()).is_false()

    def test_service_specific_terms_accepts_type_service(self):
        service_specific_terms = TermsOfUseFactory(terms_type=TermsOfUse.TERMS_TYPE_SERVICE)

        request = self.req_factory.get(f"/admin/reservation_units/reservationunit/{self.reservation_unit.id}/change/")

        data = self.get_valid_data()
        data["service_specific_terms"] = service_specific_terms

        ReservationUnitModelForm = self.runit_admin.get_form(request, obj=self.reservation_unit)
        form = ReservationUnitModelForm(instance=self.reservation_unit, data=data)

        assert_that(form.is_valid()).is_true()

    def test_service_specific_terms_errors_when_type_not_service(self):
        wrong_terms = TermsOfUseFactory(terms_type=TermsOfUse.TERMS_TYPE_GENERIC)

        request = self.req_factory.get(f"/admin/reservation_units/reservationunit/{self.reservation_unit.id}/change/")

        data = self.get_valid_data()
        data["service_specific_terms"] = wrong_terms

        ReservationUnitModelForm = self.runit_admin.get_form(request, obj=self.reservation_unit)
        form = ReservationUnitModelForm(instance=self.reservation_unit, data=data)

        assert_that(form.is_valid()).is_false()
