# Generated by Django 3.0.10 on 2021-02-15 07:46

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('applications', '0016_add_order_number_to_application_round_basket'),
    ]

    operations = [
        migrations.AddField(
            model_name='application',
            name='billing_address',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='applications.Address'),
        ),
    ]
