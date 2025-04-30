from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.contrib import admin, messages
from django.contrib.admin import helpers
from django.template.response import TemplateResponse
from django.utils.translation import gettext_lazy as _
from lookup_property import L
from more_admin_filters import MultiSelectFilter
from rangefilter.filters import DateRangeFilterBuilder

from tilavarauspalvelu.enums import OrderStatus, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.models import Reservation, ReservationDenyReason
from tilavarauspalvelu.tasks import cancel_reservation_invoice_task, refund_paid_reservation_task
from utils.date_utils import local_date, local_datetime

from .filters import (
    AccessCodeGeneratedFilter,
    PaidReservationListFilter,
    RecurringReservationListFilter,
    ReservationUnitFilter,
    UnitFilter,
)
from .form import PaymentOrderInline, ReservationAdminForm

if TYPE_CHECKING:
    from decimal import Decimal

    from django.db.models import QuerySet

    from tilavarauspalvelu.typing import WSGIRequest


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    # Functions
    actions = [
        "deny_reservations_without_refund",
        "deny_reservations_with_refund",
    ]
    search_fields = [
        # 'id' handled separately in `get_search_results()`
        "name",
    ]
    search_help_text = _("Search by Reservation ID or name")

    # List
    list_display = [
        "id",
        "name",
        "type",
        "state",
        "begin",
        "reservation_units_admin",
        "access_type",
        "access_code_is_active",
        "access_code_generated_at",
    ]
    list_filter = [
        ("created_at", DateRangeFilterBuilder(title=_("Created at"))),
        ("begin", DateRangeFilterBuilder(title=_("Begin time"))),
        ("type", MultiSelectFilter),
        ("state", MultiSelectFilter),
        RecurringReservationListFilter,
        PaidReservationListFilter,
        ("reservation_units__unit", UnitFilter),
        ("reservation_units", ReservationUnitFilter),
        "access_type",
        "access_code_is_active",
        AccessCodeGeneratedFilter,
    ]

    # Form
    form = ReservationAdminForm
    fieldsets = [
        [
            _("Basic information"),
            {
                "fields": [
                    "id",
                    "ext_uuid",
                    "sku",
                    "name",
                    "description",
                    "num_persons",
                    "state",
                    "type",
                    "cancel_details",
                    "handling_details",
                    "working_memo",
                    "reservation_units",
                ],
            },
        ],
        [
            _("Time"),
            {
                "fields": [
                    "begin",
                    "end",
                    "buffer_time_before",
                    "buffer_time_after",
                    "handled_at",
                    "confirmed_at",
                    "created_at",
                ],
            },
        ],
        [
            _("Price"),
            {
                "fields": [
                    "price",
                    "price_net",
                    "non_subsidised_price",
                    "non_subsidised_price_net",
                    "unit_price",
                    "tax_percentage_value",
                    "applying_for_free_of_charge",
                    "free_of_charge_reason",
                ],
            },
        ],
        [
            _("Reservee information"),
            {
                "fields": [
                    "reservee_id",
                    "reservee_first_name",
                    "reservee_last_name",
                    "reservee_email",
                    "reservee_phone",
                    "reservee_organisation_name",
                    "reservee_address_street",
                    "reservee_address_city",
                    "reservee_address_zip",
                    "reservee_is_unregistered_association",
                    "reservee_type",
                ],
            },
        ],
        [
            _("Billing information"),
            {
                "fields": [
                    "billing_first_name",
                    "billing_last_name",
                    "billing_email",
                    "billing_phone",
                    "billing_address_street",
                    "billing_address_city",
                    "billing_address_zip",
                ],
            },
        ],
        [
            _("Pindora information"),
            {
                "fields": [
                    "access_type",
                    "access_code_is_active",
                    "access_code_should_be_active",
                    "access_code_generated_at",
                    "pindora_response",
                ],
            },
        ],
        [
            _("Additional information"),
            {
                "fields": [
                    "user",
                    "recurring_reservation",
                    "deny_reason",
                    "cancel_reason",
                    "purpose",
                    "home_city",
                    "age_group",
                ],
            },
        ],
    ]
    filter_horizontal = [
        "reservation_units",
    ]
    readonly_fields = [
        "id",
        "ext_uuid",
        "handled_at",
        "confirmed_at",
        "created_at",
        "price_net",
        "non_subsidised_price_net",
        "access_code_is_active",
        "access_code_should_be_active",
        "access_code_generated_at",
        "access_type",
    ]
    inlines = [PaymentOrderInline]

    def get_queryset(self, request: WSGIRequest) -> QuerySet[Reservation]:
        return (
            super()
            .get_queryset(request)
            .annotate(access_code_should_be_active=L("access_code_should_be_active"))
            .prefetch_related("reservation_units")
        )

    def get_search_results(
        self,
        request: WSGIRequest,
        queryset: QuerySet,
        search_term: Any,
    ) -> tuple[QuerySet, bool]:
        queryset, may_have_duplicates = super().get_search_results(request, queryset, search_term)

        if str(search_term).isdigit():
            queryset |= self.model.objects.filter(id__exact=int(search_term))

        return queryset, may_have_duplicates

    @admin.display(ordering="reservation_units__name", description="Reservation units")
    def reservation_units_admin(self, obj: Reservation) -> str:
        return ", ".join(str(reservation_unit) for reservation_unit in obj.reservation_units.all())

    def price_net(self, obj: Reservation) -> Decimal:
        return obj.price_net

    def non_subsidised_price_net(self, obj: Reservation) -> Decimal:
        return obj.non_subsidised_price_net

    def _deny_reservations_action_confirmation_page(
        self,
        request: WSGIRequest,
        queryset: QuerySet[Reservation],
        action_name: str,
    ) -> TemplateResponse | None:
        if not queryset.exists():
            msg = _("None of the selected reservations can be denied.")
            self.message_user(request, msg, level=messages.ERROR)
            return None

        queryset = queryset.filter(state__in=ReservationStateChoice.states_that_can_change_to_deny)
        queryset_ended_reservation_count = queryset.filter(end__lt=local_datetime()).count()

        queryset = queryset.filter(end__gte=local_datetime())
        queryset_unpaid_reservation_count = queryset.filter(price=0).count()
        queryset_paid_reservation_count = queryset.filter(price__gt=0).count()

        queryset_refundable_reservation_count = queryset.filter(
            price__gt=0,
            payment_order__isnull=False,
            payment_order__status=OrderStatus.PAID,
            payment_order__refund_id__isnull=True,
        ).count()

        queryset_cancellable_reservation_count = queryset.filter(
            price__gt=0,
            payment_order__isnull=False,
            payment_order__status=OrderStatus.PAID_BY_INVOICE,
            begin__date__lte=local_date(),
        ).count()

        deny_reasons = ReservationDenyReason.objects.all().order_by("reason")

        context = {
            **self.admin_site.each_context(request),
            "title": _("Are you sure?"),
            "subtitle": _("Are you sure you want deny these reservations?"),
            "queryset": queryset,
            "queryset_unpaid_reservation_count": queryset_unpaid_reservation_count,
            "queryset_paid_reservation_count": queryset_paid_reservation_count,
            "queryset_ended_reservation_count": queryset_ended_reservation_count,
            "queryset_refundable_reservation_count": queryset_refundable_reservation_count,
            "queryset_cancellable_reservation_count": queryset_cancellable_reservation_count,
            "deny_reasons": deny_reasons,
            "opts": self.model._meta,
            "action_checkbox_name": helpers.ACTION_CHECKBOX_NAME,
            "media": self.media,
            "action_name": action_name,
        }
        request.current_app = self.admin_site.name
        return TemplateResponse(request, "admin/deny_reservation_confirmation.html", context)

    def _deny_reservations_action_set_denied(self, request: WSGIRequest, queryset: QuerySet[Reservation]) -> None:
        deny_reason = request.POST.get("deny_reason")
        queryset.filter(
            state__in=ReservationStateChoice.states_that_can_change_to_deny,
            end__gte=local_datetime(),
        ).update(
            state=ReservationStateChoice.DENIED,
            handled_at=local_datetime(),
            deny_reason=deny_reason,
        )

        msg = _("Selected reservations have been denied.")
        self.message_user(request, msg, level=messages.INFO)

        for reservation in queryset:
            EmailService.send_reservation_rejected_email(reservation=reservation)

    @admin.action(description=_("Deny selected reservations without refund"))
    def deny_reservations_without_refund(
        self,
        request: WSGIRequest,
        queryset: QuerySet[Reservation],
    ) -> TemplateResponse | None:
        # Confirmation page
        if not request.POST.get("confirmed"):
            return self._deny_reservations_action_confirmation_page(
                request=request,
                queryset=queryset,
                action_name="deny_reservations_without_refund",
            )

        # Set reservations as denied
        self._deny_reservations_action_set_denied(request=request, queryset=queryset)
        return None

    @admin.action(description=_("Deny selected reservations and refund"))
    def deny_reservations_with_refund(
        self,
        request: WSGIRequest,
        queryset: QuerySet[Reservation],
    ) -> TemplateResponse | None:
        # Confirmation page
        if not request.POST.get("confirmed"):
            return self._deny_reservations_action_confirmation_page(
                request=request,
                queryset=queryset,
                action_name="deny_reservations_with_refund",
            )

        # Set reservations as denied
        self._deny_reservations_action_set_denied(request=request, queryset=queryset)

        # Refund paid reservations
        refund_queryset = queryset.filter(
            state=ReservationStateChoice.DENIED,
            price__gt=0,
            payment_order__isnull=False,
            payment_order__status=OrderStatus.PAID,
            payment_order__refund_id__isnull=True,
        )
        for reservation in refund_queryset:
            refund_paid_reservation_task.delay(reservation.pk)

        # Cancel invoiced reservations
        cancel_queryset = queryset.filter(
            state=ReservationStateChoice.DENIED,
            price__gt=0,
            payment_order__isnull=False,
            payment_order__status=OrderStatus.PAID_BY_INVOICE,
            begin__date__lte=local_date(),
        )
        for reservation in cancel_queryset:
            cancel_reservation_invoice_task.delay(reservation.pk)

        refunded = len(refund_queryset)
        canceled = len(cancel_queryset)

        msg: str = ""

        if refunded:
            msg += str(_("Refund has been initiated for %(count)s paid reservations.") % {"count": refunded})

        if canceled:
            if msg:
                msg += " "
            msg += str(_("Cancellation has been initiated for %(count)s invoiced reservations.") % {"count": canceled})

        if not msg:
            msg = str(_("No reservations with paid orders to refund or cancel."))

        self.message_user(request, msg, level=messages.INFO)
        return None
