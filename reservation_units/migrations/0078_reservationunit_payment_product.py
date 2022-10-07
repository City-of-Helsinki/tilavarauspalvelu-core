# Generated by Django 3.2.15 on 2022-10-05 07:07

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('merchants', '0002_paymentproduct'),
        ('reservation_units', '0077_alter_reservationunit_payment_merchant'),
    ]

    operations = [
        migrations.AddField(
            model_name='reservationunit',
            name='payment_product',
            field=models.ForeignKey(blank=True, help_text='Product used for payments', null=True, on_delete=django.db.models.deletion.PROTECT, related_name='reservation_units', to='merchants.paymentproduct', verbose_name='Payment product'),
        ),
    ]
