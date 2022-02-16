from django.core.management.base import BaseCommand

from spaces.importers.units import UnitImporter


class Command(BaseCommand):
    help = "Imports units from given url."

    def add_arguments(self, parser):
        parser.add_argument("url", type=str, help="Url for the datasource.")
        parser.add_argument(
            "--single",
            type=bool,
            help="Source contains only one record not in list format.",
        )
        parser.add_argument(
            "--field_map",
            type=dict,
            help="""Specify custom field map to map the data fields.
            field_map = {
                "unit": {
                    "<unit model field>": "<data source field>",
                    ...
                },
                "location": {
                    "<location model field>": "<data source field>",
                    ...
                },
            }""",
        )
        parser.add_argument(
            "--ids",
            nargs="+",
            help="List of tprek unit ids to be imported. If this is given, the url must be "
            "pointing to root of the datasource since the ids are requested in their own "
            "requests using the root url. Example: if given url is 'https://url.com and ids "
            "of 1,2,3,4 the requests would be https:/url.com/1, https://url.com/2 etc.",
        )
        parser.add_argument(
            "--import_hauki_resource_ids",
            type=bool,
            help="Should hauki resource ids for units be imported from hauki within the import.",
        )

    def handle(self, url, *args, **options):
        field_map = options.get("field_map", None)
        ids = options.get("ids")
        use_field_map = field_map and isinstance(field_map, dict)
        import_hauki_resource_ids = options.get("import_hauki_resource_ids", False)

        if use_field_map:
            importer = UnitImporter(
                url, field_map=field_map, single=options.get("single")
            )
        else:
            importer = UnitImporter(url, single=options.get("single"))

        if not ids:
            importer.import_units(import_hauki_resource_id=import_hauki_resource_ids)
            return

        if url[len(url) - 1] != "/":
            url = "{}/".format(url)
        importer.single = True

        for id in ids:
            importer.url = "{}{}".format(url, id)
            importer.import_units(import_hauki_resource_id=import_hauki_resource_ids)
        return (
            f"Created: {importer.creation_counter} Updated: {importer.update_counter}"
        )

    def get_version(self):
        """
        Custom version for devops etc scenarios to know which version running.
        """
        return "0.0.2"
