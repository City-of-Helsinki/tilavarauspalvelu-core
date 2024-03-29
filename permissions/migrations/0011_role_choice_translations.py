# Generated by Django 3.1.13 on 2021-10-11 07:18

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('permissions', '0010_unit_permissions'),
    ]

    operations = [
        migrations.AddField(
            model_name='generalrolechoice',
            name='verbose_name_en',
            field=models.CharField(max_length=255, null=True, verbose_name='Verbose name'),
        ),
        migrations.AddField(
            model_name='generalrolechoice',
            name='verbose_name_fi',
            field=models.CharField(max_length=255, null=True, verbose_name='Verbose name'),
        ),
        migrations.AddField(
            model_name='generalrolechoice',
            name='verbose_name_sv',
            field=models.CharField(max_length=255, null=True, verbose_name='Verbose name'),
        ),
        migrations.AddField(
            model_name='servicesectorrolechoice',
            name='verbose_name_en',
            field=models.CharField(max_length=255, null=True, verbose_name='Verbose name'),
        ),
        migrations.AddField(
            model_name='servicesectorrolechoice',
            name='verbose_name_fi',
            field=models.CharField(max_length=255, null=True, verbose_name='Verbose name'),
        ),
        migrations.AddField(
            model_name='servicesectorrolechoice',
            name='verbose_name_sv',
            field=models.CharField(max_length=255, null=True, verbose_name='Verbose name'),
        ),
        migrations.AddField(
            model_name='unitrolechoice',
            name='verbose_name_en',
            field=models.CharField(max_length=255, null=True, verbose_name='Verbose name'),
        ),
        migrations.AddField(
            model_name='unitrolechoice',
            name='verbose_name_fi',
            field=models.CharField(max_length=255, null=True, verbose_name='Verbose name'),
        ),
        migrations.AddField(
            model_name='unitrolechoice',
            name='verbose_name_sv',
            field=models.CharField(max_length=255, null=True, verbose_name='Verbose name'),
        ),
    ]
