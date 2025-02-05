from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.core.management.commands import makemessages

if TYPE_CHECKING:
    from django.core.management import CommandParser


class Command(makemessages.Command):
    help = makemessages.Command.help + (
        '\n\nAdds the `--omit-header` option for skipping the header `msgid ""` entry. '
        "This is useful, since the the `POT-Creation-Date` would otherwise always change, "
        "even if the translations themselves were not changed."
    )

    def add_arguments(self, parser: CommandParser) -> None:
        super().add_arguments(parser)
        parser.add_argument(
            "--omit-header",
            action="store_true",
            help='Don`t write header with `msgid ""` entry.',
        )

    def handle(self, *args: Any, **options: Any) -> Any:
        omit_header: bool = options.pop("omit_header", False)
        if omit_header:
            self.xgettext_options = makemessages.Command.xgettext_options[:] + ["--omit-header"]
        super().handle(*args, **options)
