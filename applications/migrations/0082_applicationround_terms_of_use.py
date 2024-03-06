# Generated by Django 5.0.2 on 2024-03-06 10:17

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('applications', '0081_alter_address_options_and_more'),
        ('terms_of_use', '0004_change_database_table_names'),
    ]

    operations = [
        migrations.AddField(
            model_name='applicationround',
            name='terms_of_use',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='application_rounds', to='terms_of_use.termsofuse'),
        ),
    ]
