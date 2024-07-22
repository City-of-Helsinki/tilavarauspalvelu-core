from django import forms
from django.contrib import admin, messages
from django.contrib.admin import helpers
from django.core.exceptions import ValidationError
from django.core.handlers.wsgi import WSGIRequest
from django.db.models import F, OrderBy, QuerySet
from django.template.response import TemplateResponse
from django.utils.translation import gettext_lazy as _
from import_export.admin import ExportMixin
from import_export.formats.base_formats import CSV
from more_admin_filters.filters import MultiSelectFilter, MultiSelectRelatedOnlyDropdownFilter
from rangefilter.filters import DateRangeFilter, DateRangeFilterBuilder

from common.date_utils import local_datetime
from email_notification.helpers.reservation_email_notification_sender import ReservationEmailNotificationSender
from merchants.admin import PaymentOrderInline
from merchants.models import OrderStatus
from reservations.choices import ReservationStateChoice
from reservations.models import (
    AbilityGroup,
    AgeGroup,
    RecurringReservation,
    Reservation,
    ReservationCancelReason,
    ReservationDenyReason,
    ReservationMetadataField,
    ReservationMetadataSet,
    ReservationPurpose,
    ReservationStatistic,
)
from reservations.tasks import refund_paid_reservation_task


class ReservationAdminForm(forms.ModelForm):
    class Meta:
        model = Reservation
        fields = [
            #
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
            #
            "begin",
            "end",
            "buffer_time_before",
            "buffer_time_after",
            "handled_at",
            "confirmed_at",
            "created_at",
            #
            "price",
            "price_net",
            "non_subsidised_price",
            "non_subsidised_price_net",
            "unit_price",
            "tax_percentage_value",
            #
            "applying_for_free_of_charge",
            "free_of_charge_reason",
            #
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
            #
            "billing_first_name",
            "billing_last_name",
            "billing_email",
            "billing_phone",
            "billing_address_street",
            "billing_address_city",
            "billing_address_zip",
            #
            "user",
            "recurring_reservation",
            "deny_reason",
            "cancel_reason",
            "purpose",
            "home_city",
            "age_group",
        ]
        labels = {
            #
            "sku": _("SKU"),
            "name": _("Name"),
            "description": _("Description"),
            "num_persons": _("Number of persons"),
            "state": _("State"),
            "type": _("Reservation type"),
            "cancel_details": _("Cancel details"),
            "handling_details": _("Handling details"),
            "working_memo": _("Working memo"),
            #
            "begin": _("Begin time"),
            "end": _("End time"),
            "buffer_time_before": _("Buffer time before"),
            "buffer_time_after": _("Buffer time after"),
            "handled_at": _("Handled at"),
            "confirmed_at": _("Confirmed at"),
            "created_at": _("Created at"),
            #
            "price": _("Price"),
            "price_net": _("Price net"),
            "non_subsidised_price": _("Non-subsidised price"),
            "non_subsidised_price_net": _("Non-subsidised net price"),
            "unit_price": _("Unit price"),
            "tax_percentage_value": _("Tax percentage value"),
            #
            "applying_for_free_of_charge": _("Applying free of charge"),
            "free_of_charge_reason": _("Free of charge reason"),
            #
            "reservee_id": _("Reservee ID"),
            "reservee_first_name": _("Reservee first name"),
            "reservee_last_name": _("Reservee last name"),
            "reservee_email": _("Reservee email"),
            "reservee_phone": _("Reservee phone"),
            "reservee_organisation_name": _("Reservee organisation name"),
            "reservee_address_street": _("Reservee address street"),
            "reservee_address_city": _("Reservee address city"),
            "reservee_address_zip": _("Reservee address zip code"),
            "reservee_is_unregistered_association": _("Reservee is an unregistered association"),
            "reservee_language": _("Preferred language of reservee"),
            "reservee_type": _("Type of reservee"),
            #
            "billing_first_name": _("Billing first name"),
            "billing_last_name": _("Billing last name"),
            "billing_email": _("Billing email"),
            "billing_phone": _("Billing phone"),
            "billing_address_street": _("Billing address street"),
            "billing_address_city": _("Billing address city"),
            "billing_address_zip": _("Billing address zip code"),
            #
            "user": _("User"),
            "recurring_reservation": _("Recurring reservation"),
            "deny_reason": _("Reason for deny"),
            "cancel_reason": _("Reason for cancellation"),
            "purpose": _("Reservation purpose"),
            "home_city": _("Home city"),
            "age_group": _("Age group"),
        }
        help_texts = {
            #
            "sku": _("SKU for this particular reservation"),
            "name": _("Name of the reservation"),
            "description": _("Description of the reservation"),
            "num_persons": _("Number of persons in the reservation"),
            "state": _("State of the reservation"),
            "type": _("Type of reservation"),
            "cancel_details": _("Details for this reservation's cancellation"),
            "handling_details": _("Additional details for denying or approving the reservation"),
            "working_memo": _("Working memo for staff users"),
            #
            "begin": _("Reservation begin date and time"),
            "end": _("Reservation end date and time"),
            "buffer_time_before": _("Buffer time before reservation"),
            "buffer_time_after": _("Buffer time after reservation"),
            "handled_at": _("When this reservation was handled"),
            "confirmed_at": _("When this reservation was confirmed"),
            "created_at": _("When this reservation was created"),
            #
            "price": _("The price of this particular reservation including VAT"),
            "price_net": _("The price of this particular reservation excluding VAT"),
            "non_subsidised_price": _("The non subsidised price of this reservation including VAT"),
            "non_subsidised_price_net": _("The non subsidised price of this reservation excluding VAT"),
            "unit_price": _("The unit price of this particular reservation"),
            "tax_percentage_value": _("The value of the tax percentage for this particular reservation"),
            #
            "applying_for_free_of_charge": _("Reservee is applying for a free-of-charge reservation"),
            "free_of_charge_reason": _("Reason for applying for a free-of-charge reservation"),
            #
            "reservee_id": _("Reservee's business or association identity code"),
            "reservee_first_name": _("Reservee's first name"),
            "reservee_last_name": _("Reservee's last name"),
            "reservee_email": _("Reservee's email address"),
            "reservee_phone": _("Reservee's phone number"),
            "reservee_organisation_name": _("Reservee's organisation name"),
            "reservee_address_street": _("Reservee's street address"),
            "reservee_address_city": _("Reservee's city"),
            "reservee_address_zip": _("Reservee's zip code"),
            "reservee_is_unregistered_association": _("Reservee is an unregistered association"),
            "reservee_language": _("Reservee's preferred language"),
            "reservee_type": _("Type of reservee"),
            #
            "billing_first_name": _("Billing first name"),
            "billing_last_name": _("Billing last name"),
            "billing_email": _("Billing email"),
            "billing_phone": _("Billing phone"),
            "billing_address_street": _("Billing address street"),
            "billing_address_city": _("Billing address city"),
            "billing_address_zip": _("Billing address zip code"),
            #
            "user": _("User who made the reservation"),
            "recurring_reservation": _("Recurring reservation"),
            "deny_reason": _("Reason for denying the reservation"),
            "cancel_reason": _("Reason for cancelling the reservation"),
            "purpose": _("Purpose of the reservation"),
            "home_city": _("Reservee's home city"),
            "age_group": _("Age group of the group or association"),
        }


class ReservationInline(admin.TabularInline):
    model = Reservation


class RecurringReservationListFilter(admin.SimpleListFilter):
    title = _("Recurring reservation")
    parameter_name = "recurring_reservation"

    def lookups(self, request: WSGIRequest, model_admin: admin.ModelAdmin) -> list[tuple[str, str]]:
        return [
            ("1", _("Yes")),
            ("0", _("No")),
        ]

    def queryset(self, request: WSGIRequest, queryset: QuerySet[Reservation]):
        if self.value() == "1":
            return queryset.filter(recurring_reservation__isnull=False)
        if self.value() == "0":
            return queryset.filter(recurring_reservation__isnull=True)
        return queryset


class PaidReservationListFilter(admin.SimpleListFilter):
    title = _("Paid reservation")
    parameter_name = "paid_reservation"

    def lookups(self, request: WSGIRequest, model_admin: admin.ModelAdmin) -> list[tuple[str, str]]:
        return [
            ("1", _("Yes")),
            ("0", _("No")),
        ]

    def queryset(self, request: WSGIRequest, queryset: QuerySet[Reservation]):
        if self.value() == "1":
            return queryset.filter(price__gt=0)
        if self.value() == "0":
            return queryset.filter(price=0)
        return queryset


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    model = Reservation
    form = ReservationAdminForm

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

    search_fields = [
        "id__exact",
    ]
    search_help_text = _("Search by reservation ID")

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
    actions = [
        "deny_reservations_without_refund",
        "deny_reservations_with_refund",
    ]
    inlines = [PaymentOrderInline]

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related("reservation_unit")

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

        deny_reasons = ReservationDenyReason.objects.order_by(OrderBy(F("rank"), descending=True, nulls_last=True))
        queryset = queryset.filter(
            state__in=ReservationStateChoice.states_that_can_change_to_deny,
            end__gte=local_datetime(),
        )

        context = {
            **self.admin_site.each_context(request),
            "title": _("Are you sure?"),
            "subtitle": _("Are you sure you want deny these reservations?"),
            "queryset": queryset,
            "queryset_paid_reservation_count": queryset.filter(price__gt=0).count(),
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


@admin.register(RecurringReservation)
class RecurringReservationAdmin(admin.ModelAdmin):
    model = RecurringReservation
    inlines = [ReservationInline]


@admin.register(ReservationPurpose)
class ReservationPurposeAdmin(admin.ModelAdmin):
    model = ReservationPurpose


@admin.register(AgeGroup)
class AgeGroupAdmin(admin.ModelAdmin):
    model = AgeGroup


@admin.register(AbilityGroup)
class AbilityGroupAdmin(admin.ModelAdmin):
    model = AbilityGroup


@admin.register(ReservationCancelReason)
class ReservationCancelReasonAdmin(admin.ModelAdmin):
    model = ReservationCancelReason


@admin.register(ReservationDenyReason)
class ReservationDenyReasonAdmin(admin.ModelAdmin):
    model = ReservationDenyReason


class ReservationMetadataFieldForm(forms.ModelForm):
    class Meta:
        model = ReservationMetadataField
        fields = ("field_name",)
        widgets = {"field_name": forms.Select()}


@admin.register(ReservationMetadataField)
class ReservationMetadataFieldAdmin(admin.ModelAdmin):
    form = ReservationMetadataFieldForm
    ordering = ("field_name",)

    def has_delete_permission(self, request, obj=None) -> bool:
        return False

    def has_add_permission(self, request) -> bool:
        return False

    def has_change_permission(self, request, obj=None) -> bool:
        return False


class ReservationMetadataSetForm(forms.ModelForm):
    class Meta:
        model = ReservationMetadataSet
        fields = [
            "name",
            "supported_fields",
            "required_fields",
        ]

    def clean(self):
        supported = set(self.cleaned_data.get("supported_fields"))
        required = set(self.cleaned_data.get("required_fields"))
        if not required.issubset(supported):
            raise ValidationError(_("Required fields must be a subset of supported fields"))
        return self.cleaned_data


@admin.register(ReservationMetadataSet)
class ReservationMetadataSetAdmin(admin.ModelAdmin):
    exclude = ("id",)
    form = ReservationMetadataSetForm

    filter_horizontal = ["supported_fields", "required_fields"]


@admin.register(ReservationStatistic)
class ReservationStatisticsAdmin(ExportMixin, admin.ModelAdmin):
    list_filter = (
        ("reservation_created_at", DateRangeFilter),
        ("begin", DateRangeFilter),
    )
    formats = [CSV]
