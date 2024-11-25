"""
Custom providers for Faker.

Note: The following structure is required by Faker:

├─ <provider_name>/
│  ├─ en_US/  # 2)
│  │  ├─ __init__.py  # 3)
│  ├─ fi_FI/
│  │  ├─ __init__.py
│  ├─ sv_SE/
│  │  ├─ __init__.py
│  ├─ __init__.py  # 1)

1) Must contain `localized: bool = True` and `default_locale: str = "fi_FI"`.
   Must also contain a class called `Provider` that inherits from `BaseProvider` or one of its subclasses.

2) Must contain locale-specific providers in directories named after the locale.

3) Must contain a class called `Provider` that inherits from the provider in 1).
   Should alter the class to suit the locale.

Add the provider function names to `tests.factories._typing.CustomProviders` for typing support!
"""

from __future__ import annotations

from pathlib import Path

from django.conf import settings

# Find the path to this directory relative to the project root.
DIR = Path(__file__).parent

# Get all providers in the directory in dot import notation.
CUSTOM_PROVIDERS = [
    path.relative_to(settings.BASE_DIR).as_posix().replace("/", ".")  #
    for path in DIR.iterdir()
    if path.is_dir() and path.name != "__pycache__"
]
