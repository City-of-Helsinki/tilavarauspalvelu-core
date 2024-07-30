from typing import TYPE_CHECKING

from django.db import migrations

if TYPE_CHECKING:
    from merchants import models as merchants_models


def convert_nullable_fields(apps, schema_editor):
    PaymentOrder: merchants_models.PaymentOrder = apps.get_model("merchants", "PaymentOrder")
    PaymentOrder.objects.filter(payment_id=None).update(payment_id="")
    PaymentOrder.objects.filter(checkout_url=None).update(checkout_url="")
    PaymentOrder.objects.filter(receipt_url=None).update(receipt_url="")

    PaymentAccounting: merchants_models.PaymentAccounting = apps.get_model("merchants", "PaymentAccounting")
    PaymentAccounting.objects.filter(internal_order=None).update(internal_order="")
    PaymentAccounting.objects.filter(profit_center=None).update(profit_center="")
    PaymentAccounting.objects.filter(project=None).update(project="")
    PaymentAccounting.objects.filter(operation_area=None).update(operation_area="")


class Migration(migrations.Migration):
    dependencies = [
        ("merchants", "0016_alter_paymentaccounting_options_and_more"),
    ]

    operations = [
        migrations.RunPython(
            code=convert_nullable_fields,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
