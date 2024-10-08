from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0003_migrate_services"),
    ]

    operations = [
        # Create models.
        migrations.CreateModel(
            name="TermsOfUse",
            fields=[
                ("id", models.CharField(max_length=100, primary_key=True, serialize=False)),
                ("name", models.CharField(blank=True, max_length=255, null=True)),
                ("name_fi", models.CharField(blank=True, max_length=255, null=True)),
                ("name_en", models.CharField(blank=True, max_length=255, null=True)),
                ("name_sv", models.CharField(blank=True, max_length=255, null=True)),
                ("text", models.TextField()),
                ("text_fi", models.TextField(null=True)),
                ("text_en", models.TextField(null=True)),
                ("text_sv", models.TextField(null=True)),
                (
                    "terms_type",
                    models.CharField(
                        choices=[
                            ("generic_terms", "Generic terms"),
                            ("payment_terms", "Payment terms"),
                            ("cancellation_terms", "Cancellation terms"),
                            ("recurring_terms", "Recurring reservation terms"),
                            ("service_terms", "Service-specific terms"),
                            ("pricing_terms", "Pricing terms"),
                        ],
                        default="generic_terms",
                        max_length=40,
                    ),
                ),
            ],
            options={
                "verbose_name": "terms of use",
                "verbose_name_plural": "terms of use",
                "db_table": "terms_of_use",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
    ]
