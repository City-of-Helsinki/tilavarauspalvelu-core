from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0002_migrate_users"),
    ]

    operations = [
        # Create models.
        migrations.CreateModel(
            name="Service",
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
                ("name", models.CharField(max_length=255)),
                ("name_fi", models.CharField(max_length=255, null=True)),
                ("name_en", models.CharField(max_length=255, null=True)),
                ("name_sv", models.CharField(max_length=255, null=True)),
                (
                    "service_type",
                    models.CharField(
                        choices=[
                            ("introduction", "Introduction"),
                            ("catering", "Catering"),
                            ("configuration", "Configuration"),
                        ],
                        default="introduction",
                        max_length=50,
                    ),
                ),
                ("buffer_time_before", models.DurationField(blank=True, null=True)),
                ("buffer_time_after", models.DurationField(blank=True, null=True)),
            ],
            options={
                "db_table": "service",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
    ]
