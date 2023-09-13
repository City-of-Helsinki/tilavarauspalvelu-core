from admin_extra_buttons.api import ExtraButtonsMixin
from adminsortable2.admin import SortableAdminMixin
from django.contrib import admin, messages
from django.core.exceptions import ValidationError
from django.forms import CharField, ModelChoiceField, ModelForm
from django.http import FileResponse
from tinymce.widgets import TinyMCE

from terms_of_use.models import TermsOfUse

from .models import (
    Day,
    DayPart,
    Equipment,
    EquipmentCategory,
    Keyword,
    KeywordCategory,
    KeywordGroup,
    Period,
    Purpose,
    Qualifier,
    ReservationKind,
    ReservationUnit,
    ReservationUnitCancellationRule,
    ReservationUnitImage,
    ReservationUnitPricing,
    ReservationUnitType,
    TaxPercentage,
)
from .utils.export_data import ReservationUnitExporter


class ReservationUnitAdminForm(ModelForm):
    description = CharField(widget=TinyMCE())
    terms_of_use = CharField(widget=TinyMCE(), required=False)
    pricing_terms = ModelChoiceField(queryset=TermsOfUse.objects.none(), required=False)
    payment_terms = ModelChoiceField(queryset=TermsOfUse.objects.none(), required=False)
    cancellation_terms = ModelChoiceField(queryset=TermsOfUse.objects.none(), required=False)
    service_specific_terms = ModelChoiceField(queryset=TermsOfUse.objects.none(), required=False)

    class Meta:
        model = ReservationUnit
        fields = [
            "sku",
            "name",
            "name_fi",
            "name_en",
            "name_sv",
            "description",
            "description_fi",
            "description_en",
            "description_sv",
            "spaces",
            "keyword_groups",
            "resources",
            "services",
            "purposes",
            "qualifiers",
            "reservation_unit_type",
            "require_introduction",
            "equipments",
            "terms_of_use",
            "terms_of_use_fi",
            "terms_of_use_en",
            "terms_of_use_sv",
            "payment_terms",
            "cancellation_terms",
            "service_specific_terms",
            "pricing_terms",
            "reservation_pending_instructions",
            "reservation_pending_instructions_fi",
            "reservation_pending_instructions_en",
            "reservation_pending_instructions_sv",
            "reservation_confirmed_instructions",
            "reservation_confirmed_instructions_fi",
            "reservation_confirmed_instructions_en",
            "reservation_confirmed_instructions_sv",
            "reservation_cancelled_instructions",
            "reservation_cancelled_instructions_fi",
            "reservation_cancelled_instructions_en",
            "reservation_cancelled_instructions_sv",
            "unit",
            "contact_information",
            "max_reservation_duration",
            "min_reservation_duration",
            "is_draft",
            "max_persons",
            "min_persons",
            "surface_area",
            "buffer_time_before",
            "buffer_time_after",
            "hauki_resource_id",
            "cancellation_rule",
            "reservation_start_interval",
            "reservations_max_days_before",
            "reservations_min_days_before",
            "reservation_begins",
            "reservation_ends",
            "publish_begins",
            "publish_ends",
            "metadata_set",
            "max_reservations_per_user",
            "require_reservation_handling",
            "authentication",
            "reservation_kind",
            "payment_types",
            "can_apply_free_of_charge",
            "allow_reservations_without_opening_hours",
            "is_archived",
            "payment_merchant",
            "payment_accounting",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields["pricing_terms"].queryset = TermsOfUse.objects.filter(terms_type=TermsOfUse.TERMS_TYPE_PRICING)
        self.fields["payment_terms"].queryset = TermsOfUse.objects.filter(terms_type=TermsOfUse.TERMS_TYPE_PAYMENT)
        self.fields["cancellation_terms"].queryset = TermsOfUse.objects.filter(
            terms_type=TermsOfUse.TERMS_TYPE_CANCELLATION
        )
        self.fields["service_specific_terms"].queryset = TermsOfUse.objects.filter(
            terms_type=TermsOfUse.TERMS_TYPE_SERVICE
        )

    def clean_pricing_terms(self):
        terms = self.cleaned_data.get("pricing_terms")
        if terms and terms.terms_type != TermsOfUse.TERMS_TYPE_PRICING:
            raise ValidationError("Selected value for pricing terms is not valid.")

        return terms

    def clean_payment_terms(self):
        terms = self.cleaned_data.get("payment_terms")
        if terms and terms.terms_type != TermsOfUse.TERMS_TYPE_PAYMENT:
            raise ValidationError("Selected value for payment terms is not valid.")

        return terms

    def clean_cancellation_terms(self):
        terms = self.cleaned_data.get("cancellation_terms")
        if terms and terms.terms_type != TermsOfUse.TERMS_TYPE_CANCELLATION:
            raise ValidationError("Selected value for cancellation terms is not valid.")

        return terms

    def clean_service_specific_terms(self):
        terms = self.cleaned_data.get("service_specific_terms")
        if terms and terms.terms_type != TermsOfUse.TERMS_TYPE_SERVICE:
            raise ValidationError("Selected value for service specific terms is not valid.")

        return terms


class ReservationUnitImageInline(admin.TabularInline):
    model = ReservationUnitImage

    readonly_fields = ["large_url", "medium_url", "small_url"]


class ReservationUnitPricingInline(admin.TabularInline):
    model = ReservationUnitPricing


@admin.register(ReservationUnit)
class ReservationUnitAdmin(ExtraButtonsMixin, SortableAdminMixin, admin.ModelAdmin):
    model = ReservationUnit
    form = ReservationUnitAdminForm
    actions = ["export_to_csv"]
    inlines = [ReservationUnitImageInline, ReservationUnitPricingInline]
    readonly_fields = ["uuid", "payment_product"]
    search_fields = ["name", "unit__name", "pk__iexact", "unit__service_sectors__name"]

    ordering = ["rank"]

    def get_search_results(self, request, queryset, search_term):
        queryset, may_have_duplicates = super().get_search_results(request, queryset, search_term)

        model_name = request.GET.get("model_name")
        if model_name == "applicationround":
            queryset = queryset.exclude(reservation_kind=ReservationKind.DIRECT)

        return queryset, may_have_duplicates

    @admin.action(description="Export selected reservation units to CSV")
    def export_to_csv(self, request, queryset):
        try:
            path = ReservationUnitExporter.export_reservation_unit_data(queryset=queryset)
        except Exception as e:
            self.message_user(
                request,
                f"Error while exporting reservation units: {e}",
                level=messages.ERROR,
            )
        else:
            return FileResponse(open(path, "rb"))


@admin.register(ReservationUnitImage)
class ReservationUnitImageAdmin(admin.ModelAdmin):
    model = ReservationUnitImage


@admin.register(ReservationUnitType)
class ReservationUnitTypeAdmin(SortableAdminMixin, admin.ModelAdmin):
    model = ReservationUnitType


@admin.register(ReservationUnitCancellationRule)
class ReservationUnitCancellationRuleAdmin(admin.ModelAdmin):
    model = ReservationUnitCancellationRule


@admin.register(ReservationUnitPricing)
class ReservationUnitPricingAdmin(admin.ModelAdmin):
    model = ReservationUnitPricing


@admin.register(Period)
class PeriodAdmin(admin.ModelAdmin):
    model = Period


@admin.register(Day)
class DayAdmin(admin.ModelAdmin):
    model = Day


@admin.register(DayPart)
class DayPartAdmin(admin.ModelAdmin):
    model = DayPart


@admin.register(Purpose)
class PurposeAdmin(SortableAdminMixin, admin.ModelAdmin):
    model = Purpose


@admin.register(Qualifier)
class QualifierAdmin(admin.ModelAdmin):
    model = Qualifier


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    model = Equipment


@admin.register(EquipmentCategory)
class EquipmentCategoryAdmin(admin.ModelAdmin):
    model = EquipmentCategory


@admin.register(KeywordCategory)
class KeywordCategoryAdmin(admin.ModelAdmin):
    model = KeywordCategory


@admin.register(KeywordGroup)
class KeywordGroupAdmin(admin.ModelAdmin):
    model = KeywordGroup


@admin.register(Keyword)
class KeywordAdmin(admin.ModelAdmin):
    model = Keyword


@admin.register(TaxPercentage)
class TaxPercentageAdmin(admin.ModelAdmin):
    model = TaxPercentage
