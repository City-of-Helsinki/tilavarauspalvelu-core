import django.contrib.postgres.fields
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("reservation_units", "0101_alter_purpose_rank"),
    ]

    operations = [
        # Create materialized view
        migrations.RunSQL(
            sql=(
                """
                CREATE MATERIALIZED VIEW reservation_unit_hierarchy AS
                    SELECT
                        subquery.reservation_unit_id,
                        subquery.related_reservation_unit_ids
                    FROM (
                        SELECT
                            target_reservation_unit.id as reservation_unit_id,
                            (
                                SELECT
                                    ARRAY_AGG(DISTINCT reservation_ids.id)
                                FROM (
                                    SELECT
                                        agg_res_unit.id
                                    FROM "reservation_unit" agg_res_unit
                                    LEFT OUTER JOIN reservation_unit_spaces res_space ON agg_res_unit.id = res_space.reservationunit_id
                                    LEFT OUTER JOIN reservation_unit_resources res_resource ON agg_res_unit.id = res_resource.reservationunit_id
                                    WHERE (
                                        agg_res_unit.id = target_reservation_unit.id
                                        OR res_space.space_id IN (
                                            SELECT
                                                UNNEST((
                                                    SELECT
                                                        ARRAY_AGG(id)
                                                    FROM (
                                                        SELECT
                                                            family_space.id
                                                        FROM "space" family_space
                                                        WHERE (
                                                            (
                                                                family_space.lft <= (target_space.lft)
                                                                AND family_space.rght >= (target_space.rght)
                                                                AND family_space.tree_id = (target_space.tree_id)
                                                            )
                                                            OR (
                                                                family_space.lft >= (target_space.lft)
                                                                AND family_space.rght <= (target_space.rght)
                                                                AND family_space.tree_id = (target_space.tree_id)
                                                            )
                                                        )
                                                        ORDER BY family_space.tree_id, family_space.lft
                                                    ) space_ids
                                                )) AS all_families
                                            FROM
                                                "space" target_space
                                            INNER JOIN reservation_unit_spaces target_rus ON target_space.id = target_rus.space_id
                                            WHERE target_rus.reservationunit_id = target_reservation_unit.id
                                            ORDER BY target_space.tree_id, target_space.lft
                                        )
                                        OR res_resource.resource_id IN (
                                            SELECT
                                                resource.id
                                            FROM "resource" resource
                                            INNER JOIN reservation_unit_resources ON resource.id = reservation_unit_resources.resource_id
                                            WHERE reservation_unit_resources.reservationunit_id = target_reservation_unit.id
                                            ORDER BY agg_res_unit.id
                                        )
                                    )
                                    ORDER BY agg_res_unit.rank, agg_res_unit.id
                                ) reservation_ids
                            ) AS related_reservation_unit_ids
                        FROM "reservation_unit" target_reservation_unit
                    ) subquery;
                """
            ),
            reverse_sql=(
                """
                DROP MATERIALIZED VIEW reservation_unit_hierarchy
                """
            ),
        ),
        # Add index
        migrations.RunSQL(
            sql=(
                """
                CREATE UNIQUE INDEX reservation_unit_hierarchy_reservation_unit_id ON reservation_unit_hierarchy (reservation_unit_id);
                """
            ),
            reverse_sql=(
                """
                DROP INDEX reservation_unit_hierarchy_reservation_unit_id
                """
            ),
        ),
        migrations.CreateModel(
            name="ReservationUnitHierarchy",
            fields=[
                (
                    "reservation_unit",
                    models.OneToOneField(
                        db_column="reservation_unit_id",
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        primary_key=True,
                        related_name="reservation_unit_hierarchy",
                        serialize=False,
                        to="reservation_units.reservationunit",
                    ),
                ),
                (
                    "related_reservation_unit_ids",
                    django.contrib.postgres.fields.ArrayField(base_field=models.IntegerField(), size=None),
                ),
            ],
            options={
                "db_table": "reservation_unit_hierarchy",
                "managed": False,
                "base_manager_name": "objects",
                "verbose_name": "reservation unit hierarchy",
                "verbose_name_plural": "reservation unit hierarchies",
            },
        ),
    ]
