# Generated by Django 4.2.6 on 2023-10-27 09:25

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('applications', '0067_remove_applicationevent_declined_reservation_units'),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='applicationeventschedule',
            constraint=models.CheckConstraint(check=models.Q(models.Q(('end__hour', 0), ('end__minute', 0)), ('begin__lte', models.F('end')), _connector='OR'), name='begin_before_end', violation_error_message='Begin must be before end, or end must be at midnight.'),
        ),
        migrations.AddConstraint(
            model_name='applicationeventschedule',
            constraint=models.CheckConstraint(check=models.Q(models.Q(('allocated_begin__isnull', True), ('allocated_end__isnull', True), ('allocated_day__isnull', True), ('allocated_reservation_unit__isnull', True)), models.Q(('allocated_begin__isnull', False), ('allocated_end__isnull', False), ('allocated_day__isnull', False), ('allocated_reservation_unit__isnull', False), models.Q(models.Q(('allocated_end__hour', 0), ('allocated_end__minute', 0)), ('allocated_begin__lte', models.F('allocated_end')), _connector='OR')), _connector='OR'), name='allocated_begin_before_end', violation_error_message='Allocation day, allocated reservation unit, allocation begin, and allocation end must all be set or null, and begin must be before end, or end must be at midnight.'),
        ),
    ]
