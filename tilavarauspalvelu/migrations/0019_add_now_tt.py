# ruff: noqa: E501


from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0018_rename_email_types_part_3"),
    ]

    operations = [
        #
        # Add test configurations table & 'NOW_TT' function
        #
        migrations.RunSQL(
            sql=(
                """
                CREATE TABLE IF NOT EXISTS testing_configurations (
                    id BIGSERIAL PRIMARY KEY NOT NULL,
                    global_time_offset_seconds BIGINT NOT NULL
                );

                INSERT INTO testing_configurations (id, global_time_offset_seconds) VALUES (1, 0) ON CONFLICT DO NOTHING;

                -- Gets the current time in the database's, but can be offset during testing.
                CREATE OR REPLACE FUNCTION NOW_TT()
                RETURNS TIMESTAMP WITH TIME ZONE
                AS
                $$
                BEGIN
                    -- See `django.db.models.functions.datetime.Now.as_postgresql`
                    RETURN STATEMENT_TIMESTAMP() + (
                        select global_time_offset_seconds
                        from testing_configurations
                        limit 1
                    ) * interval '1 second';
                END;
                $$
                LANGUAGE plpgsql STABLE PARALLEL SAFE STRICT;
                """
            ),
            reverse_sql=(
                """
                DROP TABLE IF EXISTS testing_configurations;
                DROP FUNCTION IF EXISTS NOW_TT;
                """
            ),
        ),
    ]
