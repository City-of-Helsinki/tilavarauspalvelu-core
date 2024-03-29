# Generated by Django 3.2.16 on 2022-11-02 06:36

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('merchants', '0005_paymentorder_reservation_user_uuid'),
    ]

    operations = [
        migrations.AddField(
            model_name='paymentorder',
            name='checkout_url',
            field=models.CharField(blank=True, max_length=512, null=True, verbose_name='Checkout URL'),
        ),
        migrations.AddField(
            model_name='paymentorder',
            name='receipt_url',
            field=models.CharField(blank=True, max_length=512, null=True, verbose_name='Receipt URL'),
        ),
    ]
