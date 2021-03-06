# Generated by Django 3.1.7 on 2021-03-15 12:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('applications', '0024_application_round_status_and_allocating'),
    ]

    operations = [
        migrations.AddField(
            model_name='organisation',
            name='organisation_type',
            field=models.CharField(choices=[('company', 'Company'), ('registered_association', 'Registered association'), ('public_association', 'Public association'), ('unregistered_association', 'Unregistered association'), ('municipality_consortium', 'Municipality consortium'), ('religious_community', 'Religious community')], default='company', max_length=255),
        ),
    ]
