import uuid
from functools import partial

from graphene_django_extensions.testing import build_mutation, build_query

from tests.factories import PaymentOrderFactory, ReservationFactory, ReservationUnitFactory
from tilavarauspalvelu.models import PaymentOrder, User

order_query = partial(
    build_query,
    "order",
    fields="""
        orderUuid
        status
        paymentType
        receiptUrl
        checkoutUrl
        reservationPk
        refundUuid
        expiresInMinutes
    """,
)


REFRESH_MUTATION = build_mutation("refreshOrder", "RefreshOrderMutation", fields="orderUuid status")


def get_order(*, user: User | None = None) -> PaymentOrder:
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        reservation_units=[reservation_unit],
        **({"user": user} if user is not None else {}),
    )
    return PaymentOrderFactory.create(
        reservation=reservation,
        remote_id=str(uuid.uuid4()),
        refund_id=str(uuid.uuid4()),
        checkout_url="https://example.url/checkout",
        receipt_url="https://example.url/receipt",
        reservation_user_uuid=reservation.user.uuid,
    )
