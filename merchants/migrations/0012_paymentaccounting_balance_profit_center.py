# Generated by Django 3.2.18 on 2023-05-10 07:34

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('merchants', '0011_add_db_indexes'),
    ]

    operations = [
        migrations.AddField(
            model_name='paymentaccounting',
            name='balance_profit_center',
            field=models.CharField(default=' ', max_length=10, verbose_name='Balance profit center'),
            preserve_default=False,
        ),
    ]
