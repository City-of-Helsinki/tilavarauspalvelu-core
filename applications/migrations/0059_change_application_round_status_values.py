# Generated by Django 3.2.13 on 2022-06-15 03:06

from django.db import migrations

OLD_STATUS_VALUES = ["validated", "approved"]
NEW_STATUS_VALUES = ["handled", "handled"]


def change_status_to_new(apps, schema_editor):
    ApplicationRoundStatus = apps.get_model("applications", "ApplicationRoundStatus")

    for new, old in zip(NEW_STATUS_VALUES, OLD_STATUS_VALUES):
        ApplicationRoundStatus.objects.filter(status=old).update(status=new)


class Migration(migrations.Migration):

    dependencies = [
        ("applications", "0058_alter_applicationeventstatus_status"),
    ]

    # Rolling back to original values is not possible because both 'validated' and 'approved' are updated to 'handled'
    # We can't set all 'handled' rows back to 'validated' or 'approved'
    operations = [migrations.RunPython(change_status_to_new, migrations.RunPython.noop)]
