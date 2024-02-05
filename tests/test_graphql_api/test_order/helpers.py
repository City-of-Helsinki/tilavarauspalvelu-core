import uuid
from functools import partial

from merchants.models import PaymentOrder
from tests.factories import PaymentOrderFactory, ReservationFactory, ReservationUnitFactory
from tests.gql_builders import build_mutation, build_query
from users.models import User

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


REFRESH_MUTATION = build_mutation(
    "refreshOrder",
    "RefreshOrderMutationInput",
    selections="orderUuid status",
)


def get_order(*, user: User | None = None) -> PaymentOrder:
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        reservation_unit=[reservation_unit],
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
