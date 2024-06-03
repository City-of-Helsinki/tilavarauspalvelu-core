from django import forms
from django.utils.translation import gettext_lazy as _

from common.models import RequestLog, SQLLog


class SQLLogAdminForm(forms.ModelForm):
    class Meta:
        model = SQLLog
        # Use exclude to, since all fields are readonly
        exclude = [  # noqa: DJ006
            "request_log",
            "sql",
            "duration_ns",
            "succeeded",
            "stack_info",
        ]
        labels = {
            "request_log": _("Request log"),
            "sql": _("SQL"),
            "duration_ns": _("Duration (ns)"),
            "succeeded": _("Succeeded"),
            "stack_info": _("Stack Info"),
        }
        help_texts = {
            "request_log": _("Request log"),
            "sql": _("SQL that was executed (without params)."),
            "duration_ns": _("Duration of the SQL query in nanoseconds."),
            "succeeded": _("Whether the SQL query succeeded or not."),
            "stack_info": _("Stack trace where the SQL query was executed."),
        }


class RequestLogAdminForm(forms.ModelForm):
    class Meta:
        model = RequestLog
        # Use exclude to, since all fields are readonly
        exclude = [  # noqa: DJ006
            "request_id",
            "path",
            "body",
            "duration_ms",
            "created",
        ]
        labels = {
            "request_id": _("Request ID"),
            "path": _("Path"),
            "body": _("Body"),
            "duration_ms": _("Duration (ms)"),
            "created": _("Created"),
        }
        help_texts = {
            "request_id": _("Random ID for grouping this log with other logs from the same request."),
            "path": _("Request path where the SQL was executed."),
            "body": _("Body of the request that executed the SQL."),
            "duration_ms": _("Duration of the request in milliseconds."),
            "created": _("When the SQL query was executed."),
        }


class SQLLogAdminInlineForm(forms.ModelForm):
    class Meta:
        model = SQLLog
        # Use exclude to, since all fields are readonly
        exclude = [  # noqa: DJ006
            "sql",
            "duration_ns",
            "succeeded",
        ]
        labels = {
            "sql": _("SQL"),
            "duration_ns": _("Duration (ns)"),
            "succeeded": _("Succeeded"),
        }
        help_texts = {
            "sql": _("SQL that was executed (without params)."),
            "duration_ns": _("Duration of the SQL query in nanoseconds."),
            "succeeded": _("Whether the SQL query succeeded or not."),
        }
