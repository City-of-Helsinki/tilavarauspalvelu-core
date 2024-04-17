from django import forms
from django.utils.translation import gettext_lazy as _

from common.models import SQLLog


class SQLLogAdminForm(forms.ModelForm):
    class Meta:
        model = SQLLog
        # Use exclude to, since all fields are readonly
        exclude = [  # noqa: DJ006
            "sql",
            "path",
            "body",
            "duration_ns",
            "succeeded",
            "request_id",
            "created",
        ]
        labels = {
            "sql": _("SQL"),
            "path": _("Path"),
            "body": _("Body"),
            "duration_ns": _("Duration (ns)"),
            "succeeded": _("Succeeded"),
            "request_id": _("Request ID"),
            "created": _("Created"),
        }
        help_texts = {
            "sql": _("SQL that was executed (without params)."),
            "path": _("Request path where the SQL was executed."),
            "body": _("Body of the request that executed the SQL."),
            "duration_ns": _("Duration of the SQL query in nanoseconds."),
            "succeeded": _("Whether the SQL query succeeded or not."),
            "request_id": _("Random ID for grouping this log with other logs from the same request."),
            "created": _("When the SQL query was executed."),
        }
