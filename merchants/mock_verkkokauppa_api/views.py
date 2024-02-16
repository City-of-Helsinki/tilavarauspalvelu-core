import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.handlers.wsgi import WSGIRequest
from django.http import Http404, HttpResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.views.generic import TemplateView

from common.date_utils import local_datetime
from merchants.models import OrderStatus, PaymentOrder
from reservations.choices import ReservationStateChoice
from reservations.models import Reservation


class MockVerkkokauppaView(TemplateView):
    template_name = "mock_verkkokauppa/index.html"

    def get_payment_order(self, order_uuid: str | None) -> PaymentOrder:
        if order_uuid is None:
            raise Http404("Order UUID is missing.")

        try:
            payment_order = get_object_or_404(PaymentOrder, remote_id=order_uuid)
        except (ValueError, ValidationError) as err:  # Catch invalid UUIDs
            raise Http404(str(err))

        return payment_order

    def handle_payment_success(self, payment_order: PaymentOrder) -> None:
        payment_order.status = OrderStatus.PAID
        payment_order.payment_id = uuid.uuid4()
        payment_order.processed_at = local_datetime()
        payment_order.save()

        reservation: Reservation | None = payment_order.reservation
        if reservation is not None:
            reservation.state = ReservationStateChoice.CONFIRMED
            reservation.save()

    def get(self, request: WSGIRequest, *args, **kwargs) -> HttpResponseRedirect:
        payment_order = self.get_payment_order(order_uuid=kwargs.get("order_uuid"))

        context = {
            "payment_order": payment_order,
            "reservation": payment_order.reservation,
        }
        return super().get(request, *args, **kwargs, **context)

    def post(self, request: WSGIRequest, *args, **kwargs) -> HttpResponseRedirect | HttpResponse:
        payment_order = self.get_payment_order(order_uuid=kwargs.get("order_uuid"))
        # Assume that the second URL in CORS_ALLOWED_ORIGINS is the Frontend UI URL
        frontend_url = settings.CORS_ALLOWED_ORIGINS[1].strip("/")

        if "payment_success" in request.POST:
            self.handle_payment_success(payment_order=payment_order)
            return HttpResponseRedirect(f"{frontend_url}/success?orderId={payment_order.remote_id}")
        elif "payment_cancelled" in request.POST:
            # Return user to cancel page on the Frontend, which then sends a GQL request to cancel the reservation.
            return HttpResponseRedirect(f"{frontend_url}/reservation/cancel?orderId={payment_order.remote_id}")

        return HttpResponse("Invalid POST request.", 400)
