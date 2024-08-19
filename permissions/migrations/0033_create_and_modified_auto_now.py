from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("permissions", "0032_rename_new_models"),
    ]

    operations = [
        migrations.AlterField(
            model_name="GeneralRole",
            name="created",
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.AlterField(
            model_name="GeneralRole",
            name="modified",
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AlterField(
            model_name="UnitRole",
            name="created",
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.AlterField(
            model_name="UnitRole",
            name="modified",
            field=models.DateTimeField(auto_now=True),
        ),
    ]
