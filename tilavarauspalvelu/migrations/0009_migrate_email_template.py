from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0008_migrate_permissions"),
    ]

    operations = [
        # Create models.
        migrations.CreateModel(
            name="EmailTemplate",
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
                    "type",
                    models.CharField(
                        choices=[
                            ("access_code_for_reservation", "Access Code For Reservation"),
                            ("application_handled", "Application Handled"),
                            ("application_in_allocation", "Application In Allocation"),
                            ("application_received", "Application Received"),
                            ("handling_required_reservation", "Handling Required Reservation"),
                            ("reservation_cancelled", "Reservation Cancelled"),
                            ("reservation_confirmed", "Reservation Confirmed"),
                            ("reservation_handled_and_confirmed", "Reservation Handled And Confirmed"),
                            ("reservation_modified", "Reservation Modified"),
                            ("reservation_needs_to_be_paid", "Reservation Needs To Be Paid"),
                            ("reservation_rejected", "Reservation Rejected"),
                            ("reservation_with_pin_confirmed", "Reservation With Pin Confirmed"),
                            ("staff_notification_reservation_made", "Staff Notification Reservation Made"),
                            (
                                "staff_notification_reservation_requires_handling",
                                "Staff Notification Reservation Requires Handling",
                            ),
                        ],
                        help_text="Only one template per type can be created.",
                        max_length=254,
                        unique=True,
                        verbose_name="Email type",
                    ),
                ),
                (
                    "name",
                    models.CharField(
                        max_length=255,
                        unique=True,
                        verbose_name="Unique name for this content",
                    ),
                ),
                ("subject", models.CharField(max_length=255)),
                ("subject_fi", models.CharField(max_length=255, null=True)),
                ("subject_en", models.CharField(max_length=255, null=True)),
                ("subject_sv", models.CharField(max_length=255, null=True)),
                (
                    "content",
                    models.TextField(
                        help_text=(
                            "Email body content. Use curly brackets to indicate data "
                            "specific fields e.g {{reservee_name}}."
                        ),
                        verbose_name="Content",
                    ),
                ),
                (
                    "content_fi",
                    models.TextField(
                        help_text=(
                            "Email body content. Use curly brackets to indicate data "
                            "specific fields e.g {{reservee_name}}."
                        ),
                        null=True,
                        verbose_name="Content",
                    ),
                ),
                (
                    "content_en",
                    models.TextField(
                        help_text=(
                            "Email body content. Use curly brackets to indicate data "
                            "specific fields e.g {{reservee_name}}."
                        ),
                        null=True,
                        verbose_name="Content",
                    ),
                ),
                (
                    "content_sv",
                    models.TextField(
                        help_text=(
                            "Email body content. Use curly brackets to indicate data "
                            "specific fields e.g {{reservee_name}}."
                        ),
                        null=True,
                        verbose_name="Content",
                    ),
                ),
                (
                    "html_content",
                    models.FileField(
                        blank=True,
                        help_text=(
                            "Email body content as HTML. Use curly brackets to indicate data "
                            "specific fields e.g {{reservee_name}}."
                        ),
                        null=True,
                        upload_to="email_html_templates",
                        verbose_name="HTML content",
                    ),
                ),
                (
                    "html_content_fi",
                    models.FileField(
                        blank=True,
                        help_text=(
                            "Email body content as HTML. Use curly brackets to indicate data "
                            "specific fields e.g {{reservee_name}}."
                        ),
                        null=True,
                        upload_to="email_html_templates",
                        verbose_name="HTML content",
                    ),
                ),
                (
                    "html_content_en",
                    models.FileField(
                        blank=True,
                        help_text=(
                            "Email body content as HTML. Use curly brackets to indicate data "
                            "specific fields e.g {{reservee_name}}."
                        ),
                        null=True,
                        upload_to="email_html_templates",
                        verbose_name="HTML content",
                    ),
                ),
                (
                    "html_content_sv",
                    models.FileField(
                        blank=True,
                        help_text=(
                            "Email body content as HTML. Use curly brackets to indicate data "
                            "specific fields e.g {{reservee_name}}."
                        ),
                        null=True,
                        upload_to="email_html_templates",
                        verbose_name="HTML content",
                    ),
                ),
            ],
            options={
                "db_table": "email_template",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
    ]
