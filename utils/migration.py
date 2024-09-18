import os

from django.db import migrations, models
from django.db.backends.base.schema import BaseDatabaseSchemaEditor
from django.db.migrations.recorder import MigrationRecorder
from django.db.migrations.state import ProjectState

__all__ = [
    "AlterModelTable",
    "TestOnlyRunBefore",
]


class AlterModelTable(migrations.AlterModelTable):
    """
    Rename a model's table.

    This is a customized version of the original AlterModelTable operation,
    which we needed in order to support renaming of tables whose name has also been
    corrected in the migration history (i.e. added to CreateModel migration).

    This is to allow converting an existing database to use the new table name
    but still be able to apply migrations from scratch, and not get errors with
    foreign keys pointing to the old table name.

    NOTE: THIS IS A HACK AND DOES NOT WORK IN REVERSE DIRECTION!
    WE SHOULD SQUASH MIGRATIONS AND DELETE THIS SOON TO AVOID PROBLEMS IN THE FUTURE...
    """

    def database_forwards(
        self,
        app_label: str,
        schema_editor: BaseDatabaseSchemaEditor,
        from_state: ProjectState,
        to_state: ProjectState,
    ) -> None:
        old_model = from_state.apps.get_model(app_label, self.name)
        new_model = to_state.apps.get_model(app_label, self.name)

        maybe_old_table_name = app_label + "_" + old_model._meta.db_table.replace("_", "")

        # Check and early return if the table does not exist to avoid transactions from being cancelled.
        # This happens when migrating from an empty database, and so the table already has the new name.
        if not self.table_exists(schema_editor, maybe_old_table_name):
            return

        if self.allow_migrate_model(schema_editor.connection.alias, new_model):
            schema_editor.alter_db_table(
                new_model,
                maybe_old_table_name,
                new_model._meta.db_table,
            )

            # Rename M2M fields whose name is based on this model's db_table
            for old_field, new_field in zip(
                old_model._meta.local_many_to_many,
                new_model._meta.local_many_to_many,
                strict=False,
            ):
                if new_field.remote_field.through._meta.auto_created:
                    through_table_name = old_field.remote_field.through._meta.object_name.lower()
                    schema_editor.alter_db_table(
                        new_field.remote_field.through,
                        app_label + "_" + through_table_name,
                        new_field.remote_field.through._meta.db_table,
                    )

    @staticmethod
    def table_exists(schema_editor: BaseDatabaseSchemaEditor, table_name: str) -> bool:
        sql = """
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = %s
            );
        """

        with schema_editor.connection.cursor() as cursor:
            cursor.execute(sql, [table_name])
            return cursor.fetchone()[0]


class TestOnlyRunBefore:
    """
    During testing, we need to make sure that any migrations using the 'RunPython'-migration
    run after any migrations that migrate models from one app to another, so that the Django
    migration schema stays consistent. This can happen e.g. when migrations are run from zero
    ("--create-db") or from a previous branch where some migrations have already been run ("--reuse-db").
    """

    def __init__(self, run_before: list[tuple[str, str]]) -> None:
        self.run_before = run_before

    def __get__(self, instance: object, owner: type) -> list[tuple[str, str]]:
        if os.environ["DJANGO_SETTINGS_ENVIRONMENT"] != "AutomatedTests":
            return []

        migration_model: type[models.Model] = MigrationRecorder.Migration

        try:
            migration_model.objects.exists()
        except Exception:
            # If creating database from zero, even the migrations table doesn't exist yet.
            return self.run_before

        to_run: list[tuple[str, str]] = []

        # Check if all the migrations that need to be run before this one are already run.
        # If not, add this migration as a dependency to those migrations that haven't been run yet.
        for app, name in self.run_before:
            migration: models.Model | None = migration_model.objects.filter(app=app, name=name).first()
            if migration is None:
                to_run.append((app, name))

        return to_run

    def __set__(self, instance: object, value: list[tuple[str, str]]) -> None:
        self.run_before = value
