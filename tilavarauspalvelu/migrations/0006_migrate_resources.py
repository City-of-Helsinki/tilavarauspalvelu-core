from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0005_migrate_merchants"),
    ]

    operations = [
        # Create models.
        migrations.CreateModel(
            name="Resource",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "location_type",
                    models.CharField(
                        choices=[("fixed", "Fixed"), ("movable", "Movable")],
                        default="fixed",
                        max_length=20,
                    ),
                ),
                ("name", models.CharField(max_length=255)),
                ("name_fi", models.CharField(max_length=255, null=True)),
                ("name_en", models.CharField(max_length=255, null=True)),
                ("name_sv", models.CharField(max_length=255, null=True)),
                ("buffer_time_before", models.DurationField(blank=True, null=True)),
                ("buffer_time_after", models.DurationField(blank=True, null=True)),
            ],
            options={
                "db_table": "resource",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
    ]
