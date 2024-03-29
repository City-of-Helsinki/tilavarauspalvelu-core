# Generated by Django 3.2.17 on 2023-03-06 10:27

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('merchants', '0009_alter_payment_accounting_validators'),
    ]

    operations = [
        migrations.AddField(
            model_name='paymentorder',
            name='refund_id',
            field=models.UUIDField(blank=True, help_text='Available only when order has been refunded', null=True, verbose_name='Refund ID'),
        ),
    ]
