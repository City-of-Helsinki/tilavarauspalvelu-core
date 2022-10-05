# Generated by Django 3.2.15 on 2022-10-05 03:36

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('merchants', '0001_initial'),
        ('reservation_units', '0076_add_payment_merchant_to_runit'),
    ]

    operations = [
        migrations.AlterField(
            model_name='reservationunit',
            name='payment_merchant',
            field=models.ForeignKey(blank=True, help_text='Merchant used for payments', null=True, on_delete=django.db.models.deletion.PROTECT, related_name='reservation_units', to='merchants.paymentmerchant', verbose_name='Payment merchant'),
        ),
    ]
