# Generated by Django 3.2.12 on 2022-03-02 14:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservation_units', '0047_reservationunit_remove_contact_information_languages'),
    ]

    operations = [
        migrations.AlterField(
            model_name='reservationunit',
            name='terms_of_use',
            field=models.TextField(blank=True, max_length=2000, null=True, verbose_name='Terms of use'),
        ),
    ]
