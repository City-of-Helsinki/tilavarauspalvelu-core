import datetime
import json

import snapshottest
from assertpy import assert_that
from django.contrib.auth import get_user_model
from django.utils.timezone import get_default_timezone
from graphene_django.utils import GraphQLTestCase

from permissions.models import (
    ServiceSectorRole,
    ServiceSectorRoleChoice,
    ServiceSectorRolePermission,
    UnitRole,
    UnitRoleChoice,
    UnitRolePermission,
)
from spaces.models import Unit
from tests.factories import (
    PaymentMerchantFactory,
    ReservationFactory,
    ReservationUnitFactory,
    ServiceSectorFactory,
    UnitFactory,
    UnitGroupFactory,
)


class UnitTestCaseBase(GraphQLTestCase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.unit = UnitFactory(
            name="Test unit",
            description="Test description",
            short_description="Short description",
            web_page="https://hel.fi",
            email="test@example.com",
            phone="+358 12 34567",
        )

        # Unit permissions and role setup
        cls.unit_admin = get_user_model().objects.create(
            username="gen_admin",
            first_name="Admin",
            last_name="General",
            email="amin.general@foo.com",
        )
        unit_role_choice = UnitRoleChoice.objects.get(code="admin")
        cls.unit_role = UnitRole.objects.create(user=cls.unit_admin, role=unit_role_choice)
        cls.unit_role.unit.add(cls.unit)
        UnitRolePermission.objects.create(role=unit_role_choice, permission="can_manage_units")

        cls.regular_joe = get_user_model().objects.create(
            username="regjoe",
            first_name="joe",
            last_name="regular",
            email="joe.regularl@foo.com",
        )


class UnitsUpdateTestCase(UnitTestCaseBase):
    def get_update_query(self):
        return "mutation updateUnit($input: UnitUpdateMutationInput!) {updateUnit(input: $input){pk}}"

    def test_admin_can_update_unit(self):
        self.client.force_login(self.unit_admin)
        desc = "Awesomeunit"
        response = self.query(
            self.get_update_query(),
            input_data={"pk": self.unit.pk, "descriptionFi": desc},
        )

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(Unit.objects.get(pk=self.unit.pk).description).is_equal_to(desc)

    def test_normal_user_cannot_update_unit(self):
        self.client.force_login(self.regular_joe)
        desc = "Awesomeunit"
        response = self.query(
            self.get_update_query(),
            input_data={"pk": self.unit.pk, "descriptionFi": desc},
        )

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")[0]["message"]).contains("No permission to mutate")
        assert_that(Unit.objects.get(pk=self.unit.pk).description).is_equal_to("Test description")


class UnitsQueryTestCase(UnitTestCaseBase):
    def test_getting_units(self):
        response = self.query(
            """
            query {
                units {
                    edges {
                        node {
                            nameFi
                            nameEn
                            nameSv
                            descriptionFi
                            descriptionEn
                            descriptionSv
                            shortDescriptionFi
                            shortDescriptionEn
                            shortDescriptionSv
                            webPage
                            email
                            phone
                            reservationUnits {
                                nameFi
                            }
                            spaces {
                                nameFi
                            }
                            location {
                                addressStreetFi
                            }
                            serviceSectors {
                                nameFi
                            }
                            paymentMerchant {
                                name
                            }
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_getting_units_sorted_by_name_asc(self):
        UnitFactory.create(name="Aaaaaa")
        UnitFactory.create(name="Bbbbbb")
        UnitFactory.create(name="Cccccc")
        response = self.query(
            """
            query {
                units(orderBy:"nameFi") {
                    edges {
                        node {
                            nameFi
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        self.assertMatchSnapshot(content)

    def test_getting_units_sorted_by_name_desc(self):
        UnitFactory.create(name="Aaaaaa")
        UnitFactory.create(name="Bbbbbb")
        UnitFactory.create(name="Cccccc")
        response = self.query(
            """
                query {
                    units(orderBy:"-nameFi") {
                        edges {
                            node {
                                nameFi
                            }
                        }
                    }
                }
                """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        self.assertMatchSnapshot(content)

    def test_getting_units_filtered_by_name(self):
        UnitFactory.create(name="Aaaaaa")
        UnitFactory.create(name="Bbbbbb")
        UnitFactory.create(name="Cccccc")
        response = self.query(
            """
            query {
                units(nameFi:"Bbb") {
                    edges {
                        node {
                            nameFi
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        self.assertMatchSnapshot(content)

    def test_getting_units_filtered_by_service_sector(self):
        target_unit_a = UnitFactory.create(name="Aaaaaa", rank=1)
        target_unit_b = UnitFactory.create(name="Bbbbbb", rank=2)
        ServiceSectorFactory.create(pk=123, name="Test sector", units=[target_unit_a, target_unit_b])
        UnitFactory.create(name="Cccccc", rank=3)

        response = self.query(
            """
            query {
                units(serviceSector:123) {
                    edges {
                        node {
                            nameFi
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        self.assertMatchSnapshot(content)

    def test_getting_only_with_permission_when_unit_admin(self):
        self.client.force_login(self.unit_admin)
        UnitFactory.create(name="Don't show me")
        UnitFactory.create(name="And specially don't show me!")
        unit = UnitFactory.create(name="Show me! I'm from unit group")
        unit_group = UnitGroupFactory(units=[unit])
        unit_too = UnitFactory.create(name="Me too, i'm just a jUnit")

        self.unit_role.unit_group.add(unit_group)
        self.unit_role.unit.add(unit_too)
        response = self.query(
            """
            query {
                units(onlyWithPermission: true orderBy: "rank") {
                    edges {
                        node {
                            nameFi
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        self.assertMatchSnapshot(content)

    def test_getting_only_with_permission_when_service_sector_admin(self):
        UnitFactory.create(name="Don't show me")
        UnitFactory.create(name="And specially don't show me!")

        # Service sector permission and role setup
        ss_unit = UnitFactory(name="Service sector unit")
        service_sector = ServiceSectorFactory(units=[ss_unit])

        service_sector_admin = get_user_model().objects.create(
            username="service_sector_admin",
            first_name="Admin",
            last_name="service sector",
            email="serv.icsector@foo.com",
        )
        ss_role_choice = ServiceSectorRoleChoice.objects.get(code="admin")
        ServiceSectorRole.objects.create(
            user=service_sector_admin,
            role=ss_role_choice,
            service_sector=service_sector,
        )
        ServiceSectorRolePermission.objects.create(role=ss_role_choice, permission="can_manage_units")

        self.client.force_login(service_sector_admin)

        response = self.query(
            """
            query {
                units(onlyWithPermission: true) {
                    edges {
                        node {
                            nameFi
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        self.assertMatchSnapshot(content)

    def test_getting_units_with_published_reservation_units(self):
        publish_date = datetime.datetime.now(tz=get_default_timezone())
        unpublish_date = publish_date + datetime.timedelta(days=30)

        a_unit = UnitFactory.create(name="Include me A")
        b_unit = UnitFactory.create(name="Include me B")
        d_unit = UnitFactory.create(name="Don't you ever show me")

        ReservationUnitFactory(
            unit=a_unit,
        )
        ReservationUnitFactory(publish_begins=publish_date, unit=b_unit)
        ReservationUnitFactory(is_archived=True, unit=d_unit)
        ReservationUnitFactory(publish_begins=unpublish_date, unit=d_unit)

        response = self.query(
            """
            query {
                units(publishedReservationUnits: true) {
                    edges {
                        node {
                            nameFi
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        edges = sorted(content["data"]["units"]["edges"], key=lambda x: x["node"]["nameFi"])
        assert edges[0] == {"node": {"nameFi": "Include me A"}}
        assert edges[1] == {"node": {"nameFi": "Include me B"}}

    def test_getting_own_reservations_true(self):
        other_user = get_user_model().objects.create(
            username="sapr",
            first_name="Sam",
            last_name="Sprite",
            email="s.sprite@foo.com",
        )
        a_unit = UnitFactory(name="Include me A", rank=1)
        b_unit = UnitFactory(name="Include me B", rank=2)
        d_unit = UnitFactory(name="Don't you ever show me", rank=3)

        resu_a = ReservationUnitFactory(
            unit=a_unit,
        )
        resu_b = ReservationUnitFactory(unit=b_unit)
        resu_d = ReservationUnitFactory(unit=d_unit)
        resu_too_d = ReservationUnitFactory(unit=d_unit)

        ReservationFactory(reservation_units=[resu_a], user=self.regular_joe)
        ReservationFactory(reservation_units=[resu_b], user=self.regular_joe)
        ReservationFactory(reservation_units=[resu_d], user=other_user)
        ReservationFactory(reservation_units=[resu_too_d], user=other_user)

        self.client.force_login(self.regular_joe)
        response = self.query(
            """
            query {
                units(ownReservations: true) {
                    edges {
                        node {
                            nameFi
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        self.assertMatchSnapshot(content)

    def test_getting_own_reservations_false(self):
        other_user = get_user_model().objects.create(
            username="sapr",
            first_name="Sam",
            last_name="Sprite",
            email="s.sprite@foo.com",
        )
        a_unit = UnitFactory(name="Me you no see")
        b_unit = UnitFactory(name="Me neither")
        d_unit = UnitFactory(name="I'm in a result as I should with Test unit.")

        resu_a = ReservationUnitFactory(
            unit=a_unit,
        )
        resu_b = ReservationUnitFactory(unit=b_unit)
        resu_d = ReservationUnitFactory(unit=d_unit)
        resu_too_d = ReservationUnitFactory(unit=d_unit)

        ReservationFactory(reservation_units=[resu_a], user=self.regular_joe)
        ReservationFactory(reservation_units=[resu_b], user=self.regular_joe)
        ReservationFactory(reservation_units=[resu_d], user=other_user)
        ReservationFactory(reservation_units=[resu_too_d], user=other_user)

        self.client.force_login(self.regular_joe)
        response = self.query(
            """
            query {
                units(ownReservations: false) {
                    edges {
                        node {
                            nameFi
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        edges = sorted(content["data"]["units"]["edges"], key=lambda x: x["node"]["nameFi"])
        assert edges[0] == {"node": {"nameFi": "I'm in a result as I should with Test unit."}}
        assert edges[1] == {"node": {"nameFi": "Test unit"}}

    def test_order_by_own_reservation_count(self):
        other_user = get_user_model().objects.create(
            username="sapr",
            first_name="Sam",
            last_name="Sprite",
            email="s.sprite@foo.com",
        )
        no_unit = UnitFactory(name="Don't show me")
        a_unit = UnitFactory(name="I'm first")
        b_unit = UnitFactory(name="Then me")
        l_unit = UnitFactory(name="I'm last.")

        resu_a = ReservationUnitFactory(
            unit=a_unit,
        )
        resu_b = ReservationUnitFactory(unit=b_unit)
        resu_d = ReservationUnitFactory(unit=l_unit)
        resu_too_d = ReservationUnitFactory(unit=l_unit)
        no_resu = ReservationUnitFactory(unit=no_unit)

        ReservationFactory.create_batch(4, reservation_units=[resu_a], user=self.regular_joe)
        ReservationFactory.create_batch(3, reservation_units=[resu_b], user=self.regular_joe)
        ReservationFactory(reservation_units=[resu_d], user=self.regular_joe)
        ReservationFactory.create_batch(3, reservation_units=[resu_too_d], user=other_user)
        ReservationFactory(reservation_units=[no_resu], user=other_user)
        self.client.force_login(self.regular_joe)
        response = self.query(
            """
            query {
                units(ownReservations: true orderBy: "-reservationCount") {
                    edges {
                        node {
                            nameFi
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        self.assertMatchSnapshot(content)

    def test_show_payment_merchant(self):
        self.client.force_login(self.unit_admin)

        merchant = PaymentMerchantFactory.create(name="Test Merchant")
        self.unit.payment_merchant = merchant
        self.unit.save()

        response = self.query(
            """
            query {
                units {
                    edges {
                        node {
                            nameFi
                            paymentMerchant {
                                name
                            }
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)

    def test_hide_payment_merchant_without_permissions(self):
        merchant = PaymentMerchantFactory.create(name="Test Merchant")
        self.unit.payment_merchant = merchant
        self.unit.save()

        response = self.query(
            """
            query {
                units {
                    edges {
                        node {
                            nameFi
                            paymentMerchant {
                                name
                            }
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)
