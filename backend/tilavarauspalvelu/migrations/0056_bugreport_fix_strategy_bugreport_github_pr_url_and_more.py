# Generated by Django 5.1.3 on 2024-12-19 12:12
from __future__ import annotations

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0055_rename_phase_bugreport_found_in_phase"),
    ]

    operations = [
        migrations.AddField(
            model_name="bugreport",
            name="fix_strategy",
            field=models.CharField(
                blank=True,
                choices=[
                    ("Specification", "Specification"),
                    ("Linter", "Linter"),
                    ("Automated Testing", "Automated Testing"),
                    ("Manual Review", "Manual Review"),
                    ("Robot", "Robot"),
                    ("Other", "Something else, what?"),
                ],
                max_length=255,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="bugreport",
            name="github_pr_url",
            field=models.URLField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="bugreport",
            name="jira_ticket_url",
            field=models.URLField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="bugreport",
            name="priority",
            field=models.CharField(
                choices=[
                    ("This Sprint", "This Sprint"),
                    ("Next Sprint", "Next Sprint"),
                    ("Backlog", "Backlog"),
                ],
                default="Backlog",
                max_length=255,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="bugreport",
            name="release",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="bugreport",
            name="target",
            field=models.CharField(
                choices=[
                    ("Backend", "Backend"),
                    ("Frontend", "Frontend"),
                    ("Robot", "Robot"),
                ],
                default="Backend",
                max_length=255,
            ),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name="bugreport",
            name="found_in_phase",
            field=models.CharField(
                choices=[
                    ("Pull Request", "Pull Request"),
                    ("Robot", "Robot"),
                    ("Manual Testing", "Manual Testing"),
                    ("Production", "Production"),
                ],
                max_length=255,
            ),
        ),
    ]
