# Generated by Django 4.2.7 on 2023-11-16 07:34

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("reservations", "0057_alter_reservation_reservee_type_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="reservation",
            name="user",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="reservations",
                to=settings.AUTH_USER_MODEL,
                verbose_name="User",
            ),
        ),
    ]
