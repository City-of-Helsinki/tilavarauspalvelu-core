from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("permissions", "0030_remove_old_models"),
    ]

    operations = [
        migrations.AlterModelTable(
            name="NewGeneralRole",
            table="general_role",
        ),
        migrations.AlterModelTable(
            name="NewUnitRole",
            table="unit_role",
        ),
    ]
