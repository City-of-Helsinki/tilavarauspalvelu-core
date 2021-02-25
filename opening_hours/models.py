from __future__ import annotations

from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from enumfields import EnumField, EnumIntegerField

from opening_hours.enums import (
    FrequencyModifier,
    RuleContext,
    RuleSubject,
    State,
    Weekday,
)


class TimeStampedModel(models.Model):
    created = models.DateTimeField(editable=False, default=timezone.now)
    modified = models.DateTimeField(editable=False, auto_now=True)

    class Meta:
        abstract = True


class DatePeriod(TimeStampedModel):
    # TODO: How to link it with our resources, such as Units/ReservationUnits/ApplicationPeriod?
    # resource = models.ForeignKey(
    #     Resource, on_delete=models.PROTECT, related_name="date_periods", db_index=True
    # )
    name = models.CharField(
        verbose_name=_("Name"), max_length=255, null=True, blank=True
    )
    description = models.TextField(verbose_name=_("Description"), null=True, blank=True)
    start_date = models.DateField(
        verbose_name=_("Start date"), null=True, blank=True, db_index=True
    )
    end_date = models.DateField(
        verbose_name=_("End date"), null=True, blank=True, db_index=True
    )
    resource_state = EnumField(
        State,
        verbose_name=_("Resource state"),
        max_length=100,
        default=State.UNDEFINED,
    )
    override = models.BooleanField(
        verbose_name=_("Override"), default=False, db_index=True
    )
    # TODO: Do we need this?
    # is_public = models.BooleanField(default=True)

    class Meta:
        verbose_name = _("Period")
        verbose_name_plural = _("Periods")
        ordering = ["start_date"]

    def __str__(self):
        return f"{self.name}({self.start_date} - {self.end_date} {self.resource_state})"


class TimeSpanGroup(models.Model):
    period = models.ForeignKey(
        DatePeriod, on_delete=models.PROTECT, related_name="time_span_groups"
    )

    def __str__(self):
        return f"{self.period} time spans {self.time_spans.all()}"


class TimeSpan(TimeStampedModel):
    group = models.ForeignKey(
        TimeSpanGroup, on_delete=models.PROTECT, related_name="time_spans"
    )
    name = models.CharField(
        verbose_name=_("Name"), max_length=255, null=True, blank=True
    )
    description = models.TextField(verbose_name=_("Description"), null=True, blank=True)
    start_time = models.TimeField(
        verbose_name=_("Start time"), null=True, blank=True, db_index=True
    )
    end_time = models.TimeField(
        verbose_name=_("End time"), null=True, blank=True, db_index=True
    )
    end_time_on_next_day = models.BooleanField(
        verbose_name=_("Is end time on the next day"), default=False
    )
    full_day = models.BooleanField(verbose_name=_("24 hours"), default=False)
    weekdays = ArrayField(
        EnumIntegerField(
            Weekday,
            verbose_name=_("Weekday"),
            default=None,
        ),
        null=True,
        blank=True,
    )
    resource_state = EnumField(
        State,
        verbose_name=_("Resource state"),
        max_length=100,
        default=State.UNDEFINED,
    )

    class Meta:
        verbose_name = _("Time span")
        verbose_name_plural = _("Time spans")
        ordering = [
            "weekdays",
            "start_time",
            "end_time_on_next_day",
            "end_time",
            "resource_state",
        ]

    def __str__(self):
        if self.weekdays:
            weekdays = ", ".join([str(i) for i in self.weekdays])
        else:
            weekdays = "[no weekdays]"

        return f"{self.name}({self.start_time} - {self.end_time} {weekdays})"


class Rule(TimeStampedModel):
    group = models.ForeignKey(
        TimeSpanGroup, on_delete=models.PROTECT, related_name="rules"
    )
    name = models.CharField(
        verbose_name=_("Name"), max_length=255, null=True, blank=True
    )
    description = models.TextField(verbose_name=_("Description"), null=True, blank=True)
    context = EnumField(
        RuleContext,
        verbose_name=_("Context"),
        max_length=100,
    )
    subject = EnumField(
        RuleSubject,
        verbose_name=_("Subject"),
        max_length=100,
    )
    start = models.IntegerField(verbose_name=_("Start"), null=True, blank=True)
    frequency_ordinal = models.PositiveIntegerField(
        verbose_name=_("Frequency (ordinal)"), null=True, blank=True
    )
    frequency_modifier = EnumField(
        FrequencyModifier,
        verbose_name=_("Frequency (modifier)"),
        max_length=100,
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = _("Rule")
        verbose_name_plural = _("Rules")

    def __str__(self):
        if self.frequency_modifier:
            return f"{self.frequency_modifier} {self.subject}s in {self.context}"
        else:
            return (
                f"every {self.frequency_ordinal} {self.subject}s in "
                f"{self.context}, starting from {self.start}"
            )
