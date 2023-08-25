import datetime
import json

import freezegun
from assertpy import assert_that
from django.utils.timezone import get_default_timezone

from api.graphql.tests.test_reservations.base import ReservationTestCaseBase
from reservation_units.models import ReservationUnit
from reservation_units.tests.factories import (
    ReservationUnitFactory,
    ReservationUnitTypeFactory,
)
from reservations.tests.factories import RecurringReservationFactory, ReservationFactory
from spaces.tests.factories import UnitFactory


@freezegun.freeze_time("2021-10-12T12:00:00Z")
class ReservationQueryTestCase(ReservationTestCaseBase):
    def create_recurring_by_admin(self):
        reservation_begin = datetime.datetime.now(tz=get_default_timezone())
        reservation_end = datetime.datetime.now(tz=get_default_timezone()) + datetime.timedelta(hours=1)
        RecurringReservationFactory(
            name="admin movies",
            reservation_unit=self.reservation_unit,
            begin_time=reservation_begin.time(),
            end_time=reservation_end.time(),
            begin_date=reservation_begin.date(),
            end_date=reservation_end.date(),
            user=self.general_admin,
        )

    def get_query_with_personal_fields(self, query_type: str):
        return (
            "query { %s {" % query_type
            + """
                    totalCount
                    edges {
                        node {
                            user
                            applicationPk
                            applicationEventPk
                            name
                        }
                    }
                }
            }
            """
        )

    def setUp(self):
        super().setUp()
        reservation_begin = datetime.datetime.now(tz=get_default_timezone())
        reservation_end = datetime.datetime.now(tz=get_default_timezone()) + datetime.timedelta(hours=1)
        self.recurring = RecurringReservationFactory(
            name="movies",
            description="good movies",
            reservation_unit=self.reservation_unit,
            begin_time=reservation_begin.time(),
            end_time=reservation_end.time(),
            begin_date=reservation_begin.date(),
            end_date=reservation_end.date(),
            user=self.regular_joe,
        )

    def test_recurring_reservation_query(self):
        self.maxDiff = None
        self.client.force_login(self.regular_joe)
        response = self.query(
            """
            query {
                recurringReservations {
                    edges {
                        node {
                            user
                            applicationPk
                            applicationEventPk
                            ageGroup {minimum maximum}
                            abilityGroup {name}
                            reservationUnit {nameFi}
                            beginTime
                            endTime
                            beginDate
                            endDate
                            recurrenceInDays
                            weekdays
                            created
                            name
                            description
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_recurring_reservation_total_count(self):
        self.client.force_login(self.regular_joe)
        response = self.query(
            """
            query {
                recurringReservations {
                    totalCount
                    edges {
                        node {
                            name
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_regular_user_cannot_see_other_than_own(self):
        self.create_recurring_by_admin()
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_query_with_personal_fields("""recurringReservations(orderBy:"name")"""))
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_general_admin_can_see_all(self):
        self.create_recurring_by_admin()
        self.client.force_login(self.general_admin)
        response = self.query(self.get_query_with_personal_fields("""recurringReservations(orderBy:"name")"""))
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_unit_admin_can_see_unit_recurrings(self):
        self.create_recurring_by_admin()
        self.client.force_login(self.create_unit_admin(unit=self.unit))
        response = self.query(self.get_query_with_personal_fields("""recurringReservations(orderBy:"name")"""))
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_service_sector_admin_can_see_recurring_reservations(self):
        self.create_recurring_by_admin()

        self.client.force_login(self.create_service_sector_admin(self.service_sector))
        response = self.query(self.get_query_with_personal_fields("""recurringReservations(orderBy:"name")"""))
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filter_by_user(self):
        self.create_recurring_by_admin()
        self.client.force_login(self.general_admin)
        response = self.query(
            """
            query {
                recurringReservations(user:%s) {
                    totalCount
                    edges {
                        node {
                            user
                        }
                    }
                }
            }
            """
            % self.regular_joe.pk
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filter_by_reservation_unit_name(self):
        self.reservation_unit.name_fi = "koirankoppi"
        self.reservation_unit.name_en = "doghouse"
        self.reservation_unit.name_sv = "hundkoja"
        self.reservation_unit.save()

        self.client.force_login(self.general_admin)

        test_cases = [
            ("reservationUnitNameFi", "koi", "nameFi"),
            ("reservationUnitNameEn", "dog", "nameEn"),
            ("reservationUnitNameSv", "hun", "nameSv"),
        ]
        for filter_name, filter_value, field_name in test_cases:
            response = self.query(
                """
                query {
                    recurringReservations(%s: "%s") {
                        totalCount
                        edges {
                            node {
                                name
                                reservationUnit {
                                    %s
                                }
                            }
                        }
                    }
                }
                """
                % (filter_name, filter_value, field_name)
            )
            content = json.loads(response.content)
            assert_that(content.get("errors")).is_none()
            self.assertMatchSnapshot(content)

    def test_filter_by_reservation_unit_name_multiple_values(self):
        self.reservation_unit.name_fi = "koirankoppi"
        self.reservation_unit.name_en = "doghouse"
        self.reservation_unit.name_sv = "hundkoja"
        self.reservation_unit.save()

        reservation_unit = ReservationUnitFactory(
            name_fi="norsutarha", name_en="elephant park", name_sv="elefantparken"
        )
        ReservationFactory(
            name="second test",
            user=self.general_admin,
            reservation_unit=[reservation_unit],
        )

        self.client.force_login(self.general_admin)

        test_cases = [
            ("reservationUnitNameFi", "koi, nors", "nameFi"),
            ("reservationUnitNameEn", "dog, elep", "nameEn"),
            ("reservationUnitNameSv", "hun, elef", "nameSv"),
        ]
        for filter_name, filter_value, field_name in test_cases:
            response = self.query(
                """
                query {
                    recurringReservations(%s: "%s", orderBy:"name") {
                        totalCount
                        edges {
                            node {
                                name
                                reservationUnit {
                                    %s
                                }
                            }
                        }
                    }
                }
                """
                % (filter_name, filter_value, field_name)
            )
            content = json.loads(response.content)
            assert_that(content.get("errors")).is_none()
            self.assertMatchSnapshot(content)

    def test_filter_by_unit(self):
        self.client.force_login(self.general_admin)
        response = self.query(
            """
            query {
                recurringReservations(unit:%s, orderBy:"name") {
                    totalCount
                    edges {
                        node {
                            name
                            reservationUnit {
                                nameFi
                                unit {
                                    nameFi
                                }
                            }
                        }
                    }
                }
            }
            """
            % self.unit.pk
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filter_by_unit_multiple_values(self):
        unit = UnitFactory(name="Another unit")
        reservation_unit = ReservationUnitFactory(name="Another resunit", unit=unit)
        RecurringReservationFactory(name="Another recurring", reservation_unit=reservation_unit)

        self.client.force_login(self.general_admin)
        response = self.query(
            """
            query {
                recurringReservations(unit:[%s, %s], orderBy:"name") {
                    totalCount
                    edges {
                        node {
                            name
                            reservationUnit {
                                nameFi
                                unit {
                                    nameFi
                                }
                            }
                        }
                    }
                }
            }
            """
            % (self.unit.pk, unit.pk)
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filter_by_reservation_unit_type(self):
        reservation_unit_type = ReservationUnitTypeFactory(name="another type")
        reservation_unit = ReservationUnitFactory(name="another resunit", reservation_unit_type=reservation_unit_type)
        RecurringReservationFactory(
            name="another recurring",
            reservation_unit=reservation_unit,
        )
        self.client.force_login(self.general_admin)
        response = self.query(
            """
            query {
                recurringReservations(reservationUnitType: %s, orderBy:"name") {
                    totalCount
                    edges {
                        node {
                            name
                            reservationUnit {
                                reservationUnitType {
                                    nameFi
                                }
                            }
                        }
                    }
                }
            }
            """
            % self.reservation_unit_type.pk
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filter_by_reservation_unit_type_multiple_values(self):
        reservation_unit_type = ReservationUnitTypeFactory(name="Another type")
        reservation_unit = ReservationUnitFactory(name="Another resunit", reservation_unit_type=reservation_unit_type)
        RecurringReservationFactory(
            name="Another recurring",
            reservation_unit=reservation_unit,
        )
        self.client.force_login(self.general_admin)
        response = self.query(
            """
            query {
                recurringReservations(reservationUnitType: [%s, %s], orderBy:"name") {
                    totalCount
                    edges {
                        node {
                            name
                            reservationUnit {
                                reservationUnitType {
                                    nameFi
                                }
                            }
                        }
                    }
                }
            }
            """
            % (self.reservation_unit_type.pk, reservation_unit_type.pk)
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_order_by_reservation_unit_name(self):
        resunitA = ReservationUnitFactory(name_fi="a Unit", name_en="d Unit", name_sv="g unit")
        resunitB = ReservationUnitFactory(name_fi="b Unit", name_en="e Unit", name_sv="h unit")
        resunitC = ReservationUnitFactory(name_fi="c Unit", name_en="f Unit", name_sv="i unit")

        RecurringReservationFactory(name="this should be 1st", reservation_unit=resunitA)
        RecurringReservationFactory(name="this should be 2nd", reservation_unit=resunitB)
        RecurringReservationFactory(name="this should be 3rd", reservation_unit=resunitC)

        self.client.force_login(self.general_admin)
        test_data = ["Fi", "En", "Sv"]
        for lang in test_data:
            response = self.query(
                """
                query {
                    recurringReservations(orderBy:"reservationUnitName%s") {
                        totalCount
                        edges {
                            node {
                                name
                                reservationUnit {
                                    name%s
                                }
                            }
                        }
                    }
                }
                """
                % (lang, lang)
            )
            content = json.loads(response.content)
            assert_that(content.get("errors")).is_none()
            self.assertMatchSnapshot(content)

    def test_order_by_unit_name(self):
        unitA = UnitFactory(name_fi="a Unit", name_en="d Unit", name_sv="g unit")
        unitB = UnitFactory(name_fi="b Unit", name_en="e Unit", name_sv="h unit")
        unitC = UnitFactory(name_fi="c Unit", name_en="f Unit", name_sv="i unit")

        resunitA = ReservationUnitFactory(name="1st resunit", unit=unitA)
        resunitB = ReservationUnitFactory(name="2nd resunit", unit=unitB)
        resunitC = ReservationUnitFactory(name="3nd resunit", unit=unitC)

        RecurringReservationFactory(name="this should be 1st", reservation_unit=resunitA)
        RecurringReservationFactory(name="this should be 2nd", reservation_unit=resunitB)
        RecurringReservationFactory(name="this should be 3rd", reservation_unit=resunitC)

        self.client.force_login(self.general_admin)
        test_data = ["Fi", "En", "Sv"]
        for lang in test_data:
            response = self.query(
                """
                query {
                    recurringReservations(orderBy:"unitName%s") {
                        totalCount
                        edges {
                            node {
                                name
                                reservationUnit {
                                    unit {
                                        name%s
                                    }
                                }
                            }
                        }
                    }
                }
                """
                % (lang, lang)
            )
            content = json.loads(response.content)
            assert_that(content.get("errors")).is_none()
            self.assertMatchSnapshot(content)

    @freezegun.freeze_time("2021-10-12T12:00:00Z")
    def test_order_by_created_at(self):
        now = datetime.datetime.now(tz=get_default_timezone())

        with freezegun.freeze_time(now + datetime.timedelta(hours=-3)):
            RecurringReservationFactory(name="this should be 1st")
        with freezegun.freeze_time(now + datetime.timedelta(hours=-2)):
            RecurringReservationFactory(name="this should be 2nd")
        with freezegun.freeze_time(now + datetime.timedelta(hours=-1)):
            RecurringReservationFactory(name="this should be 3rd")
        with freezegun.freeze_time(now + datetime.timedelta(hours=10)):
            RecurringReservationFactory(name="this should be last")

        self.client.force_login(self.general_admin)
        response = self.query(
            """
            query {
                recurringReservations(orderBy:"created") {
                    totalCount
                    edges {
                        node {
                            name
                            created
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filter_by_reservation_unit(self):
        RecurringReservationFactory(
            name="Test recurring",
            reservation_unit=self.reservation_unit,
        )
        self.client.force_login(self.general_admin)
        response = self.query(
            """
            query {
                recurringReservations(reservationUnit: "%s", orderBy:"unitNameFi") {
                    totalCount
                    edges {
                        node {
                            name
                            reservationUnit {
                                nameFi
                            }
                        }
                    }
                }
            }
            """
            % self.reservation_unit.pk
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filter_by_multiple_reservation_unit(self):
        other_unit = ReservationUnitFactory(
            spaces=[self.space],
            unit=self.unit,
            name="other unit",
            reservation_start_interval=ReservationUnit.RESERVATION_START_INTERVAL_15_MINUTES,
            reservation_unit_type=self.reservation_unit_type,
            rank=0,
        )

        not_visible_unit = ReservationUnitFactory(
            spaces=[self.space],
            unit=self.unit,
            name="not visible unit",
            reservation_start_interval=ReservationUnit.RESERVATION_START_INTERVAL_15_MINUTES,
            reservation_unit_type=self.reservation_unit_type,
            rank=1,
        )

        RecurringReservationFactory(
            name="test recurring",
            reservation_unit=other_unit,
        )

        RecurringReservationFactory(
            name="hidden recurring",
            reservation_unit=not_visible_unit,
        )

        self.client.force_login(self.general_admin)
        response = self.query(
            """
            query {
                recurringReservations(reservationUnit: [%s, %s], orderBy:"name") {
                    totalCount
                    edges {
                        node {
                            name
                            reservationUnit {
                                nameFi
                            }
                        }
                    }
                }
            }
            """
            % (self.reservation_unit.pk, other_unit.pk)
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)
