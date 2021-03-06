# Generated by Django 3.0.10 on 2021-02-09 08:28

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('applications', '0014_refactor_application_round'),
    ]

    operations = [
        migrations.AlterField(
            model_name='applicationstatus',
            name='status',
            field=models.CharField(choices=[('draft', 'Draft'), ('in_review', 'In review'), ('review_done', 'Review done'), ('allocating', 'Allocating'), ('allocated', 'Allocated'), ('validated', 'Validated'), ('declined', 'Declined'), ('cancelled', 'Cancelled'), ('handled', 'Handled')], max_length=20, verbose_name='Status'),
        ),
    ]
