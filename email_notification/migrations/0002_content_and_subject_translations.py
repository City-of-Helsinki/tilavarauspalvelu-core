# Generated by Django 3.2.15 on 2022-09-01 11:28

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('email_notification', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='emailtemplate',
            name='content_en',
            field=models.TextField(help_text='Email body content. Use curly brackets to indicate data specific fields e.g {{reservee_name}}.', null=True, verbose_name='Content'),
        ),
        migrations.AddField(
            model_name='emailtemplate',
            name='content_fi',
            field=models.TextField(help_text='Email body content. Use curly brackets to indicate data specific fields e.g {{reservee_name}}.', null=True, verbose_name='Content'),
        ),
        migrations.AddField(
            model_name='emailtemplate',
            name='content_sv',
            field=models.TextField(help_text='Email body content. Use curly brackets to indicate data specific fields e.g {{reservee_name}}.', null=True, verbose_name='Content'),
        ),
        migrations.AddField(
            model_name='emailtemplate',
            name='subject_en',
            field=models.CharField(max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='emailtemplate',
            name='subject_fi',
            field=models.CharField(max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='emailtemplate',
            name='subject_sv',
            field=models.CharField(max_length=255, null=True),
        ),
    ]
