# Generated by Django 5.1.6 on 2025-04-14 11:11
from __future__ import annotations

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0074_paymentaccounting_product_invoicing_material_and_more"),
    ]

    operations = [
        migrations.AddConstraint(
            model_name="paymentaccounting",
            constraint=models.CheckConstraint(
                check=models.Q(
                    models.Q(("project", ""), _negated=True),
                    models.Q(("profit_center", ""), _negated=True),
                    models.Q(("internal_order", ""), _negated=True),
                    _connector="OR",
                ),
                name="internal_order_profit_center_or_project_required",
                violation_error_message=(
                    "At least one of the following fields must be filled: 'internal_order', 'profit_center', 'project'"
                ),
            ),
        ),
    ]
