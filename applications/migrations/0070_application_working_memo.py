# Generated by Django 4.2.6 on 2023-10-20 12:16

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('applications', '0069_applicationroundtimeslot_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='application',
            name='working_memo',
            field=models.TextField(blank=True, default=''),
        ),
    ]
