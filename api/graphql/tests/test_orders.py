import json
from typing import Optional

import snapshottest
from assertpy import assert_that
from rest_framework.test import APIClient

from api.graphql.tests.base import GrapheneTestCaseBase
from merchants.tests.factories import PaymentOrderFactory
from reservation_units.tests.factories import ReservationUnitFactory
from reservations.tests.factories import ReservationFactory


class OrderQueryTestCase(GrapheneTestCaseBase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.api_client = APIClient()
        cls.reservation_unit = ReservationUnitFactory.create(
            name="Test reservation unit"
        )
        cls.reservation = ReservationFactory.create(
            name="Test reservation",
            reservation_unit=[cls.reservation_unit],
            user=cls.regular_joe,
        )
        cls.order = PaymentOrderFactory.create(
            reservation=cls.reservation, order_id="b3fef99e-6c18-422e-943d-cf00702af53e"
        )

    @classmethod
    def get_order_query(cls, order_id: Optional[str] = None) -> str:
        if not order_id:
            order_id = cls.order.order_id

        return (
            """
            query {
                order(orderId: "%s") {
                    orderId
                    status
                    paymentType
                    receiptUrl
                    checkoutUrl
                    reservationPk
                }
            }
            """
            % order_id
        )

    def test_returns_none_when_not_authenticated(self):
        response = self.query(self.get_order_query())
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_returns_order_when_user_owns_reservation(self):
        self.client.force_login(self.regular_joe)

        response = self.query(self.get_order_query())
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_returns_order_when_user_can_handle_reservations(self):
        self.client.force_login(self.general_admin)

        response = self.query(self.get_order_query())
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)
