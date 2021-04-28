# Generated by Django 3.1.7 on 2021-04-27 13:21

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('applications', '0037_add_allocated_to_schedule_result'),
        ('reservations', '0003_fix_verbose_name_typo'),
    ]

    operations = [
        migrations.AddField(
            model_name='recurringreservation',
            name='application_event',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='recurring_reservation', to='applications.applicationevent', verbose_name='Application event'),
        ),
    ]
