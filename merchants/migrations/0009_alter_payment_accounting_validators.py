# Generated by Django 3.2.16 on 2022-12-13 04:38

from django.db import migrations, models
import merchants.validators


class Migration(migrations.Migration):

    dependencies = [
        ('merchants', '0008_paymentaccounting'),
    ]

    operations = [
        migrations.AlterField(
            model_name='paymentaccounting',
            name='company_code',
            field=models.CharField(max_length=4, validators=[merchants.validators.is_numeric], verbose_name='Company code'),
        ),
        migrations.AlterField(
            model_name='paymentaccounting',
            name='internal_order',
            field=models.CharField(blank=True, max_length=10, null=True, validators=[merchants.validators.is_numeric], verbose_name='Internal order'),
        ),
        migrations.AlterField(
            model_name='paymentaccounting',
            name='main_ledger_account',
            field=models.CharField(max_length=6, validators=[merchants.validators.is_numeric], verbose_name='Main ledger account'),
        ),
        migrations.AlterField(
            model_name='paymentaccounting',
            name='operation_area',
            field=models.CharField(blank=True, max_length=6, null=True, validators=[merchants.validators.is_numeric], verbose_name='Operation area'),
        ),
        migrations.AlterField(
            model_name='paymentaccounting',
            name='profit_center',
            field=models.CharField(blank=True, max_length=7, null=True, validators=[merchants.validators.is_numeric], verbose_name='Profit center'),
        ),
        migrations.AlterField(
            model_name='paymentaccounting',
            name='project',
            field=models.CharField(blank=True, max_length=16, null=True, validators=[merchants.validators.validate_accounting_project, merchants.validators.is_numeric], verbose_name='Project'),
        ),
    ]
