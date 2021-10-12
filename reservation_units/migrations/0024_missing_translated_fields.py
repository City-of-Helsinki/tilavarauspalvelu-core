# Generated by Django 3.1.13 on 2021-10-11 07:18

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservation_units', '0023_reservation_unit_buffer_time_between_reservations'),
    ]

    operations = [
        migrations.AddField(
            model_name='keyword',
            name='name_en',
            field=models.CharField(max_length=255, null=True, verbose_name='Name'),
        ),
        migrations.AddField(
            model_name='keyword',
            name='name_fi',
            field=models.CharField(max_length=255, null=True, verbose_name='Name'),
        ),
        migrations.AddField(
            model_name='keyword',
            name='name_sv',
            field=models.CharField(max_length=255, null=True, verbose_name='Name'),
        ),
        migrations.AddField(
            model_name='keywordcategory',
            name='name_en',
            field=models.CharField(max_length=255, null=True, verbose_name='Name'),
        ),
        migrations.AddField(
            model_name='keywordcategory',
            name='name_fi',
            field=models.CharField(max_length=255, null=True, verbose_name='Name'),
        ),
        migrations.AddField(
            model_name='keywordcategory',
            name='name_sv',
            field=models.CharField(max_length=255, null=True, verbose_name='Name'),
        ),
        migrations.AddField(
            model_name='keywordgroup',
            name='name_en',
            field=models.CharField(max_length=255, null=True, verbose_name='Name'),
        ),
        migrations.AddField(
            model_name='keywordgroup',
            name='name_fi',
            field=models.CharField(max_length=255, null=True, verbose_name='Name'),
        ),
        migrations.AddField(
            model_name='keywordgroup',
            name='name_sv',
            field=models.CharField(max_length=255, null=True, verbose_name='Name'),
        ),
        migrations.AddField(
            model_name='period',
            name='description_en',
            field=models.CharField(blank=True, max_length=500, null=True, verbose_name='Description'),
        ),
        migrations.AddField(
            model_name='period',
            name='description_fi',
            field=models.CharField(blank=True, max_length=500, null=True, verbose_name='Description'),
        ),
        migrations.AddField(
            model_name='period',
            name='description_sv',
            field=models.CharField(blank=True, max_length=500, null=True, verbose_name='Description'),
        ),
        migrations.AddField(
            model_name='period',
            name='name_en',
            field=models.CharField(blank=True, default='', max_length=200, null=True, verbose_name='Name'),
        ),
        migrations.AddField(
            model_name='period',
            name='name_fi',
            field=models.CharField(blank=True, default='', max_length=200, null=True, verbose_name='Name'),
        ),
        migrations.AddField(
            model_name='period',
            name='name_sv',
            field=models.CharField(blank=True, default='', max_length=200, null=True, verbose_name='Name'),
        ),
        migrations.AddField(
            model_name='reservationunit',
            name='contact_information_en',
            field=models.TextField(blank=True, default='', null=True, verbose_name='Contact information'),
        ),
        migrations.AddField(
            model_name='reservationunit',
            name='contact_information_fi',
            field=models.TextField(blank=True, default='', null=True, verbose_name='Contact information'),
        ),
        migrations.AddField(
            model_name='reservationunit',
            name='contact_information_sv',
            field=models.TextField(blank=True, default='', null=True, verbose_name='Contact information'),
        ),
        migrations.AddField(
            model_name='reservationunit',
            name='terms_of_use_en',
            field=models.TextField(blank=True, max_length=2000, null=True, verbose_name='Terms of use'),
        ),
        migrations.AddField(
            model_name='reservationunit',
            name='terms_of_use_fi',
            field=models.TextField(blank=True, max_length=2000, null=True, verbose_name='Terms of use'),
        ),
        migrations.AddField(
            model_name='reservationunit',
            name='terms_of_use_sv',
            field=models.TextField(blank=True, max_length=2000, null=True, verbose_name='Terms of use'),
        ),
        migrations.AddField(
            model_name='reservationunittype',
            name='name_en',
            field=models.CharField(max_length=255, null=True, verbose_name='Name'),
        ),
        migrations.AddField(
            model_name='reservationunittype',
            name='name_fi',
            field=models.CharField(max_length=255, null=True, verbose_name='Name'),
        ),
        migrations.AddField(
            model_name='reservationunittype',
            name='name_sv',
            field=models.CharField(max_length=255, null=True, verbose_name='Name'),
        ),
    ]
