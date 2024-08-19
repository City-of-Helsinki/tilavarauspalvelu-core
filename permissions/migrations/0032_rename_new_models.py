from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("permissions", "0031_rename_model_tables"),
    ]

    operations = [
        migrations.RenameModel(
            old_name="NewGeneralRole",
            new_name="GeneralRole",
        ),
        migrations.RenameModel(
            old_name="NewUnitRole",
            new_name="UnitRole",
        ),
    ]
