from django.db import models
from django.utils.translation import gettext_lazy as _

from reservation_units.models import ReservationUnit
from reservations.models import Reservation

from .order_numbers import generate_order_number


class Product(models.Model):
    """
    A product that links a reservation unit with a Verkkokauppa product.

    When a paid reservation unit is created (or a free reservation unit
    is turned into a paid one), a corresponding product should be created
    in Verkkokauppa. This model links that product to our own reservation
    unit instance.
    """

    verkkokauppa_product_id = models.UUIDField(unique=True)
    reservation_unit = models.OneToOneField(
        ReservationUnit,
        verbose_name=_("Reservation unit"),
        related_name="product",
        on_delete=models.PROTECT,
    )


class Order(models.Model):
    """
    An order that links a reservation to a Verkkokauppa order.

    When a paid reservation is made, a corresponding order is created
    in Verkkokauppa. This model links that model with our own reservation
    instance.
    """

    CREATED = "created"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    STATE_CHOICES = (
        (CREATED, _("created")),
        (COMPLETED, _("completed")),
        (CANCELLED, _("cancelled")),
    )

    state = models.CharField(
        max_length=32,
        verbose_name=_("state"),
        choices=STATE_CHOICES,
        default=CREATED,
    )
    order_number = models.CharField(
        max_length=64,
        verbose_name=_("order number"),
        unique=True,
        default=generate_order_number,
    )
    verkkokauppa_order_id = models.UUIDField(unique=True)
    payment_url = models.URLField(verbose_name=_("payment URL"))
    reservation = models.OneToOneField(
        Reservation,
        verbose_name=_("reservation"),
        related_name="order",
        on_delete=models.PROTECT,
    )


class OrderLine(models.Model):
    """A line in an order, containing the product and the quantity of that product."""

    order = models.ForeignKey(
        Order,
        verbose_name=_("order"),
        related_name="order_lines",
        on_delete=models.CASCADE,
    )
    product = models.ForeignKey(
        Product,
        verbose_name=_("product"),
        related_name="order_lines",
        on_delete=models.PROTECT,
    )
    quantity = models.PositiveIntegerField(verbose_name=_("quantity"), default=1)
