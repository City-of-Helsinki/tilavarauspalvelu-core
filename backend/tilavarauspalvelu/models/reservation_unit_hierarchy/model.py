from __future__ import annotations

from inspect import cleandoc
from typing import TYPE_CHECKING, ClassVar

from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.db import migrations, models
from django.db.transaction import get_connection
from django.utils.translation import gettext_lazy as _

from tilavarauspalvelu.integrations.sentry import SentryLogger
from utils.utils import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnit

    from .actions import ReservationUnitHierarchyActions
    from .queryset import ReservationUnitHierarchyManager
    from .validators import ReservationUnitHierarchyValidator

__all__ = [
    "ReservationUnitHierarchy",
]


class ReservationUnitHierarchy(models.Model):
    """
    A PostgreSQL materialized view that is used to pre-calculate
    which reservation units affect a given reservation unit's reservations.
    """

    reservation_unit: ReservationUnit = models.OneToOneField(
        "tilavarauspalvelu.ReservationUnit",
        related_name="reservation_unit_hierarchy",
        on_delete=models.DO_NOTHING,
        primary_key=True,
        db_column="reservation_unit_id",
    )
    related_reservation_unit_ids: list[int] = ArrayField(base_field=models.IntegerField())

    objects: ClassVar[ReservationUnitHierarchyManager] = LazyModelManager.new()
    actions: ReservationUnitHierarchyActions = LazyModelAttribute.new()
    validators: ReservationUnitHierarchyValidator = LazyModelAttribute.new()

    class Meta:
        managed = False
        db_table = "reservation_unit_hierarchy"
        base_manager_name = "objects"
        verbose_name = _("reservation unit hierarchy")
        verbose_name_plural = _("reservation unit hierarchies")

    def __str__(self) -> str:
        return f"Hierarchy for reservation unit: {self.reservation_unit_id}"

    @classmethod
    def refresh(cls, using: str | None = None) -> None:
        """
        Called to refresh the contents of the materialized view.

        The view gets stale when:
          1) Reservation units are created or deleted.
          2) Spaces or resources are added to or removed from existing reservation units.
          3) The space hierarchy is changed.

        This method is called automatically with appropriate signals,
        and with a scheduled task, but can also be called manually if needed.
        """
        try:
            with get_connection(using).cursor() as cursor:
                cursor.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY reservation_unit_hierarchy")
        except Exception as error:
            # Only raise error in local development, otherwise log to Sentry
            if settings.RAISE_ERROR_ON_REFRESH_FAILURE:
                raise
            SentryLogger.log_exception(error, details="Failed to refresh materialized view.")

    # For migrations.

    @classmethod
    def create_migration(cls) -> migrations.RunSQL:
        return migrations.RunSQL(sql=cls.__forward_sql(), reverse_sql=cls.__reverse_sql())

    @classmethod
    def __forward_sql(cls) -> str:
        view_sql = "CREATE MATERIALIZED VIEW reservation_unit_hierarchy AS"

        table_sql = cleandoc(
            """
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
                            LEFT OUTER JOIN reservation_unit_spaces res_space ON (
                                agg_res_unit.id = res_space.reservationunit_id
                            )
                            LEFT OUTER JOIN reservation_unit_resources res_resource ON (
                                agg_res_unit.id = res_resource.reservationunit_id
                            )
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
                                    INNER JOIN reservation_unit_spaces target_rus ON (
                                        target_space.id = target_rus.space_id
                                    )
                                    WHERE target_rus.reservationunit_id = target_reservation_unit.id
                                    ORDER BY target_space.tree_id, target_space.lft
                                )
                                OR res_resource.resource_id IN (
                                    SELECT
                                        resource.id
                                    FROM "resource" resource
                                    INNER JOIN reservation_unit_resources ON (
                                        resource.id = reservation_unit_resources.resource_id
                                    )
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
        )

        indexes_sql = cleandoc(
            """
            CREATE UNIQUE INDEX reservation_unit_hierarchy_reservation_unit_id ON reservation_unit_hierarchy (
                reservation_unit_id
            );
            """
        )

        return f"{view_sql}\n{table_sql}\n{indexes_sql}"

    @classmethod
    def __reverse_sql(cls) -> str:
        return cleandoc(
            """
            DROP INDEX reservation_unit_hierarchy_reservation_unit_id;
            DROP MATERIALIZED VIEW reservation_unit_hierarchy;
            """
        )
