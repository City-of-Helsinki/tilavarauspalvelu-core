from typing import Any

from django.contrib import admin, messages
from django.contrib.admin import helpers
from django.core.handlers.wsgi import WSGIRequest
from django.db import models
from django.db.models import QuerySet
from django.template.response import TemplateResponse
from django.utils.translation import gettext_lazy as _
from more_admin_filters import MultiSelectFilter
from more_admin_filters.filters import MultiSelectRelatedOnlyDropdownFilter
from rangefilter.filters import DateRangeFilterBuilder

from common.date_utils import local_datetime
from email_notification.helpers.reservation_email_notification_sender import ReservationEmailNotificationSender
from merchants.enums import OrderStatus
from merchants.models import PaymentOrder
from reservations.admin.reservation.filters import PaidReservationListFilter, RecurringReservationListFilter
from reservations.admin.reservation.form import ReservationAdminForm
from reservations.enums import ReservationStateChoice
from reservations.models import Reservation, ReservationDenyReason
from reservations.tasks import refund_paid_reservation_task

__all__ = [
    "ReservationAdmin",
]


class PaymentOrderInline(admin.TabularInline):
    model = PaymentOrder
    extra = 0
    show_change_link = True
    can_delete = False
    fields = [
        "id",
        "payment_type",
        "status",
        "price_total",
    ]
    readonly_fields = fields


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
        "reservation_units",
    ]
    list_filter = [
        ("created_at", DateRangeFilterBuilder(title=_("Created at"))),
        ("begin", DateRangeFilterBuilder(title=_("Begin time"))),
        ("type", MultiSelectFilter),
        ("state", MultiSelectFilter),
        RecurringReservationListFilter,
        PaidReservationListFilter,
        ("reservation_unit__unit", MultiSelectRelatedOnlyDropdownFilter),
        ("reservation_unit", MultiSelectRelatedOnlyDropdownFilter),
    ]

    # Form
    form = ReservationAdminForm
    fieldsets = [
        [
            _("Basic information"),
            {
                "fields": [
                    "id",
                    "sku",
                    "name",
                    "description",
                    "num_persons",
                    "state",
                    "type",
                    "cancel_details",
                    "handling_details",
                    "working_memo",
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
                    "reservee_language",
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
    readonly_fields = [
        "id",
        "handled_at",
        "confirmed_at",
        "created_at",
    ]
    inlines = [PaymentOrderInline]

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related("reservation_unit")

    def get_search_results(
        self,
        request: WSGIRequest,
        queryset: models.QuerySet,
        search_term: Any,
    ) -> tuple[models.QuerySet, bool]:
        queryset, may_have_duplicates = super().get_search_results(request, queryset, search_term)

        if str(search_term).isdigit():
            queryset |= self.model.objects.filter(id__exact=int(search_term))

        return queryset, may_have_duplicates

    @admin.display(ordering="reservation_unit__name")
    def reservation_units(self, obj: Reservation) -> str:
        return ", ".join([str(reservation_unit) for reservation_unit in obj.reservation_unit.all()])

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
            ReservationEmailNotificationSender.send_deny_email(reservation=reservation)

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

        if refund_queryset.count():
            msg = _("Refund has been initiated for selected reservations.") + f" ({refund_queryset.count()})"
        else:
            msg = _("No reservations with paid orders to refund.")
        self.message_user(request, msg, level=messages.INFO)
        return None
