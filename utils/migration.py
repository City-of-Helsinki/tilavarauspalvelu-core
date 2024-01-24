from django.db import migrations
from django.db.backends.base.schema import BaseDatabaseSchemaEditor
from django.db.migrations.state import ProjectState

__all__ = [
    "AlterModelTable",
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
            for old_field, new_field in zip(old_model._meta.local_many_to_many, new_model._meta.local_many_to_many):
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
