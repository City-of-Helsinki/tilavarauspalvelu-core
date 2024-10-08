import django.contrib.gis.db.models.fields
import django.db.models.deletion
import mptt.fields
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0006_migrate_resources"),
    ]

    operations = [
        # Create models.
        migrations.CreateModel(
            name="RealEstate",
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
                    "surface_area",
                    models.DecimalField(
                        blank=True,
                        decimal_places=2,
                        max_digits=10,
                        null=True,
                    ),
                ),
            ],
            options={
                "db_table": "real_estate",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="Building",
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
                    "surface_area",
                    models.DecimalField(
                        blank=True,
                        decimal_places=2,
                        max_digits=10,
                        null=True,
                    ),
                ),
                (
                    "real_estate",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="buildings",
                        to="tilavarauspalvelu.realestate",
                    ),
                ),
            ],
            options={
                "db_table": "building",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="Space",
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
                ("surface_area", models.IntegerField(blank=True, null=True)),
                ("max_persons", models.PositiveIntegerField(blank=True, null=True)),
                ("code", models.CharField(blank=True, db_index=True, default="", max_length=255)),
                ("lft", models.PositiveIntegerField(editable=False)),
                ("rght", models.PositiveIntegerField(editable=False)),
                ("tree_id", models.PositiveIntegerField(db_index=True, editable=False)),
                ("level", models.PositiveIntegerField(editable=False)),
                (
                    "building",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="spaces",
                        to="tilavarauspalvelu.building",
                    ),
                ),
                (
                    "parent",
                    mptt.fields.TreeForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="children",
                        to="tilavarauspalvelu.space",
                    ),
                ),
            ],
            options={
                "db_table": "space",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="Unit",
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
                ("tprek_id", models.CharField(blank=True, max_length=255, null=True, unique=True)),
                ("tprek_department_id", models.CharField(blank=True, max_length=255, null=True)),
                ("tprek_last_modified", models.DateTimeField(blank=True, null=True)),
                ("name", models.CharField(max_length=255)),
                ("name_fi", models.CharField(max_length=255, null=True)),
                ("name_en", models.CharField(max_length=255, null=True)),
                ("name_sv", models.CharField(max_length=255, null=True)),
                ("description", models.TextField(blank=True, default="", max_length=4000)),
                ("description_fi", models.TextField(blank=True, default="", max_length=4000, null=True)),
                ("description_en", models.TextField(blank=True, default="", max_length=4000, null=True)),
                ("description_sv", models.TextField(blank=True, default="", max_length=4000, null=True)),
                ("short_description", models.CharField(blank=True, default="", max_length=255)),
                ("short_description_fi", models.CharField(blank=True, default="", max_length=255, null=True)),
                ("short_description_en", models.CharField(blank=True, default="", max_length=255, null=True)),
                ("short_description_sv", models.CharField(blank=True, default="", max_length=255, null=True)),
                ("web_page", models.URLField(blank=True, default="", max_length=255)),
                ("email", models.EmailField(blank=True, default="", max_length=255)),
                ("phone", models.CharField(blank=True, default="", max_length=255)),
                ("rank", models.PositiveIntegerField(blank=True, null=True)),
                (
                    "payment_accounting",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="units",
                        to="tilavarauspalvelu.paymentaccounting",
                    ),
                ),
                (
                    "payment_merchant",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="units",
                        to="tilavarauspalvelu.paymentmerchant",
                    ),
                ),
            ],
            options={
                "db_table": "unit",
                "ordering": ["rank"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="ServiceSector",
            fields=[
                (
                    "id",
                    models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("name", models.CharField(max_length=255)),
                ("name_fi", models.CharField(max_length=255, null=True)),
                ("name_en", models.CharField(max_length=255, null=True)),
                ("name_sv", models.CharField(max_length=255, null=True)),
                ("units", models.ManyToManyField(related_name="service_sectors", to="tilavarauspalvelu.unit")),
            ],
            options={
                "db_table": "service_sector",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="Location",
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
                ("address_street", models.CharField(blank=True, max_length=100)),
                ("address_street_fi", models.CharField(blank=True, max_length=100, null=True)),
                ("address_street_en", models.CharField(blank=True, max_length=100, null=True)),
                ("address_street_sv", models.CharField(blank=True, max_length=100, null=True)),
                ("address_zip", models.CharField(blank=True, max_length=30)),
                ("address_city", models.CharField(blank=True, max_length=100)),
                ("address_city_fi", models.CharField(blank=True, max_length=100, null=True)),
                ("address_city_en", models.CharField(blank=True, max_length=100, null=True)),
                ("address_city_sv", models.CharField(blank=True, max_length=100, null=True)),
                ("coordinates", django.contrib.gis.db.models.fields.PointField(null=True, srid=4326)),
                (
                    "building",
                    models.OneToOneField(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="location",
                        to="tilavarauspalvelu.building",
                    ),
                ),
                (
                    "real_estate",
                    models.OneToOneField(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="location",
                        to="tilavarauspalvelu.realestate",
                    ),
                ),
                (
                    "space",
                    models.OneToOneField(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="location",
                        to="tilavarauspalvelu.space",
                    ),
                ),
                (
                    "unit",
                    models.OneToOneField(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="location",
                        to="tilavarauspalvelu.unit",
                    ),
                ),
            ],
            options={
                "db_table": "location",
                "ordering": ["pk"],
                "base_manager_name": "objects",
            },
        ),
        migrations.CreateModel(
            name="UnitGroup",
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
                ("units", models.ManyToManyField(related_name="unit_groups", to="tilavarauspalvelu.unit")),
            ],
            options={
                "db_table": "unit_group",
                "ordering": ["name"],
                "base_manager_name": "objects",
            },
        ),
        # Create relations.
        migrations.AddField(
            model_name="space",
            name="unit",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="spaces",
                to="tilavarauspalvelu.unit",
            ),
        ),
        migrations.AddField(
            model_name="resource",
            name="space",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="tilavarauspalvelu.space",
            ),
        ),
    ]
