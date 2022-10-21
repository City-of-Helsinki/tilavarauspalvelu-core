# Generated by Django 3.2.16 on 2022-10-24 07:10

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('merchants', '0002_paymentproduct'),
    ]

    operations = [
        migrations.CreateModel(
            name='PaymentOrder',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('order_id', models.UUIDField(blank=True, help_text='eCommerce order ID', null=True, verbose_name='Order ID')),
                ('payment_id', models.CharField(blank=True, help_text='eCommerce payment ID', max_length=128, null=True, verbose_name='Payment ID')),
                ('payment_type', models.CharField(choices=[('ON_SITE', 'On site'), ('ONLINE', 'Online'), ('INVOICE', 'Invoice')], max_length=128, verbose_name='Payment type')),
                ('status', models.CharField(choices=[('DRAFT', 'Draft'), ('EXPIRED', 'Expired'), ('CANCELLED', 'Cancelled'), ('PAID', 'Paid'), ('PAID_MANUALLY', 'Paid manually'), ('REFUNDED', 'Refunded')], max_length=128, verbose_name='Payment status')),
                ('price_net', models.DecimalField(decimal_places=2, max_digits=10, verbose_name='Net amount')),
                ('price_vat', models.DecimalField(decimal_places=2, max_digits=10, verbose_name='VAT amount')),
                ('price_total', models.DecimalField(decimal_places=2, max_digits=10, verbose_name='Total amount')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created at')),
                ('processed_at', models.DateTimeField(blank=True, null=True, verbose_name='Processed at')),
                ('language', models.CharField(choices=[('fi', 'Finnish'), ('sv', 'Swedish'), ('en', 'English')], max_length=8, verbose_name='Language')),
            ],
        ),
    ]
