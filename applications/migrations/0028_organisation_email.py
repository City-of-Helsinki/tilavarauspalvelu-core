# Generated by Django 3.1.7 on 2021-03-17 04:21

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('applications', '0027_application_round_add_translated_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='organisation',
            name='email',
            field=models.EmailField(blank=True, default='', max_length=254, verbose_name='Email'),
        ),
    ]
