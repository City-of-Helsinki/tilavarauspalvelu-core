# Generated by Django 3.2.15 on 2022-09-05 05:52

from django.db import migrations, models


def create_payment_types(apps, schema):
    ReservationUnitPaymentType = apps.get_model("reservation_units", "ReservationUnitPaymentType")
    ReservationUnitPaymentType.objects.create(code="ONLINE")
    ReservationUnitPaymentType.objects.create(code="INVOICE")
    ReservationUnitPaymentType.objects.create(code="ON_SITE")


def remove_payment_types(apps, schema):
    ReservationUnitPaymentType = apps.get_model("reservation_units", "ReservationUnitPaymentType")
    ReservationUnitPaymentType.objects.all().delete()


def assign_payment_types(apps, schema):
    ReservationUnitPaymentType = apps.get_model("reservation_units", "ReservationUnitPaymentType")
    ReservationUnit = apps.get_model("reservation_units", "ReservationUnit")

    ONLINE = ReservationUnitPaymentType.objects.get(code="ONLINE")
    INVOICE = ReservationUnitPaymentType.objects.get(code="INVOICE")
    ON_SITE = ReservationUnitPaymentType.objects.get(code="ON_SITE")

    reservation_units = ReservationUnit.objects.all()
    for runit in reservation_units:
        if runit.payment_type == "online":
            runit.payment_types.add(ONLINE)
        elif runit.payment_type == "invoice":
            runit.payment_types.add(INVOICE)
        elif runit.payment_type == "on_site":
            runit.payment_types.add(ON_SITE)


def unassign_payment_types(apps, schema):
    ReservationUnit = apps.get_model("reservation_units", "ReservationUnit")
    reservation_units = ReservationUnit.objects.all()
    for runit in reservation_units:
        runit.payment_types.clear()


class Migration(migrations.Migration):
    dependencies = [
        ("reservation_units", "0068_update_reservation_unit_ranks"),
    ]

    operations = [
        migrations.RunSQL("SET CONSTRAINTS ALL IMMEDIATE", reverse_sql=migrations.RunSQL.noop),
        migrations.CreateModel(
            name="ReservationUnitPaymentType",
            fields=[
                ("code", models.CharField(max_length=32, primary_key=True, serialize=False, verbose_name="Code")),
            ],
            options={
                "db_table": "reservation_unit_payment_type",
            },
        ),
        migrations.AlterField(
            model_name="reservationunit",
            name="payment_type",
            field=models.CharField(
                blank=True,
                choices=[("ONLINE", "Online"), ("INVOICE", "Invoice"), ("ON_SITE", "On Site")],
                help_text="When pricing type is paid, what kind of payment types are available with this reservation unit.",
                max_length=20,
                null=True,
                verbose_name="Payment type",
            ),
        ),
        migrations.AddField(
            model_name="reservationunit",
            name="payment_types",
            field=models.ManyToManyField(blank=True, to="reservation_units.ReservationUnitPaymentType"),
        ),
        migrations.RunPython(create_payment_types, remove_payment_types),
        migrations.RunPython(assign_payment_types, unassign_payment_types),
        migrations.RunSQL(migrations.RunSQL.noop, reverse_sql="SET CONSTRAINTS ALL IMMEDIATE"),
    ]
