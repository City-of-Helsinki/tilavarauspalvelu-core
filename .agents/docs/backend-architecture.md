# Backend architecture

> Also read the [backend code style](./backend-code-style.md).

Follow this architecture for code under `backend/`.

```
backend/
├── config/                             # See `Project configuration`
│   ├── celery/                         # Celery app, beat schedule, and worker setup
│   ├── hooks/                          # Pre-commit hooks
│   ├── auth.py                         # Authentication backends
│   ├── middleware.py
│   ├── settings.py
│   └── urls.py                         # Every URL route
├── docker/                             # Images and entrypoints for deployment
├── locale/                             # Translation files
├── templates/                          # See `Templates`
│   ├── admin/                          # Extra pages for the Django admin
│   ├── email/                          # See `Email`
│   │   ├── html/
│   │   │   ├── partials/
│   │   │   └── <email_type>.jinja
│   │   └── text/                       # Same structure as `html/`
│   └── <document>/                     # Templates rendered as a page or a PDF
├── tests/                              # See `Tests`
│   ├── factories/                      # Test data factories
│   │   └── <model>.py
│   ├── test_<topic>/
│   │   ├── test_<sub_topic>/           # Optional split for large topics
│   │   ├── conftest.py                 # Fixtures for this topic only
│   │   ├── helpers.py                  # Helpers for this topic only
│   │   └── test_<behavior>.py
│   ├── conftest.py                     # Fixtures for every test
│   ├── helpers.py                      # Helpers for every test
│   └── plugins.py                      # Pytest plugins
├── tilavarauspalvelu/                  # The only Django app
│   ├── admin/                          # See `Admin layer`
│   │   ├── <model>/
│   │   │   ├── admin.py
│   │   │   ├── filters.py
│   │   │   └── form.py
│   │   └── helpers.py                  # Shared admin base classes
│   ├── api/                            # See `API layer`
│   │   ├── graphql/                    # See `GraphQL API`
│   │   │   ├── extensions/             # Converters for custom fields
│   │   │   ├── types/
│   │   │   │   └── <model>/
│   │   │   │       ├── filtersets.py
│   │   │   │       ├── mutations.py
│   │   │   │       ├── permissions.py
│   │   │   │       ├── serializers.py
│   │   │   │       └── types.py
│   │   │   ├── mutations.py            # Import every mutation class here, see its docstring for details
│   │   │   ├── queries.py              # Import every node here, see its docstring for details
│   │   │   └── schema.py               # Root query and mutation types
│   │   ├── rest/                       # See `REST endpoints`
│   │   ├── webhooks/                   # Endpoints that external services call
│   │   └── <consumer>/                 # Endpoints for one specific consumer, e.g. `gdpr/`
│   ├── integrations/                   # See `Integrations layer`
│   │   ├── <external_service>/
│   │   │   ├── <api_area>/             # Optional split for large services
│   │   │   ├── client.py
│   │   │   ├── exceptions.py
│   │   │   ├── service.py
│   │   │   └── typing.py
│   │   ├── email/                      # See `Email`
│   │   │   └── template_context/
│   │   └── <tool>.py                   # Wrappers for third-party tools, e.g. Sentry
│   ├── management/
│   │   └── commands/                   # Django management commands
│   │       └── data_creation/          # Test data for local development
│   ├── migrations/
│   ├── models/                         # See `Model layer`
│   │   ├── <model>/
│   │   │   ├── actions.py
│   │   │   ├── model.py
│   │   │   ├── queryset.py
│   │   │   └── validators.py
│   │   ├── __init__.py                 # Every model, imported so Django finds them
│   │   └── _base.py                    # Base querysets and managers
│   ├── services/                       # See `Services layer`
│   │   ├── <feature>/
│   │   └── <feature>.py
│   ├── templatetags/                   # Custom template filters
│   ├── constants.py
│   ├── dataclasses.py                  # Shared dataclasses
│   ├── enums.py                        # Every choice enum
│   ├── exceptions.py                   # Internal exceptions
│   ├── signals.py                      # Every signal receiver
│   ├── tasks.py                        # Every Celery task
│   ├── translation.py                  # Translated fields for each model
│   ├── typing.py                       # Shared type definitions and error codes
│   └── validators.py                   # Field validators that many models share
└── utils/                              # See `Utilities`
    ├── external_service/               # Base client and errors for every integration
    ├── fields/                         # Custom model, form, serializer, and filter fields
    └── <topic>.py
```

See `backend/tilavarauspalvelu/models/reservation` and
`backend/tilavarauspalvelu/api/graphql/types/reservation` for examples.

This is the general structure. It is not an exhaustive list of files and not
every package needs every file. Prefer the pre-defined locations when possible.
A module can become a package when it grows too large, e.g. `serializers.py` to `serializers/`.

## Project configuration

Django and Celery setup. No domain logic here.

## Model layer

One package per model. Every package has all four modules, even when some are empty.

- `model.py`: Fields, relations, and `Meta`. Keep logic out.
- `queryset.py`: The queryset and manager. Reusable filters, annotations, and bulk updates.
- `actions.py`: Behavior for one instance. Use it through `instance.actions`.
- `validators.py`: Checks for one instance that raise on failure. Use them through `instance.validators`.

Add each new model to `models/__init__.py`.
Add translated fields to `translation.py`. Add choice enums to `enums.py`.

## API layer

Outside interface. Keep it thin.
Delegate to the model layer, the services layer, or the integrations layer.

### GraphQL API

The main API for both frontends. One package under `types/` for each model or concept.

- `types.py`: The nodes.
- `filtersets.py`: Filtering and ordering for the nodes.
- `permissions.py`: Access rules for the nodes and mutations.
- `serializers.py`: Input validation and the mutation flow. Validate with model validators, then save, then call integrations.
- `mutations.py`: Mutation classes that connect a serializer and a permission.

Add new nodes to `queries.py` and new mutations to `mutations.py`. Expose them in `schema.py`.

### REST endpoints

Plain Django views for things GraphQL cannot do well.
Examples: file downloads, redirects, exports, and health checks.

## Admin layer

The Django admin. One package per model.
Staff use it for data that has no UI in the frontends.

## Services layer

Business logic that does not belong to one model and is not tied to one API.
One module or package per feature.

## Integrations layer

One package per external service.

- `client.py`: Low-level requests to the service. Build it on `utils/external_service`.
- `service.py`: The interface that the rest of the app uses.
- `exceptions.py`: Errors for this service. Subclass the errors in `utils/external_service`.
- `typing.py`: Request and response types.

Write clients and services as classes with class methods, e.g. `PindoraService`. Do not use module-level functions.
This is a design choice. Tests mock an integration with `tests/helpers.py::patch_method`.
It takes the method itself instead of a string path, so the type checker sees it and renames update it.
It does not work on module-level functions.

## Email

`integrations/email/` builds and sends every email.
`template_context/` builds the data for each email type.
Each email type has an HTML and a text template under `templates/email/`.

## Templates

Templates for emails, admin pages, and documents. Translations go in `locale/`.

## Tests

One directory per topic, e.g. a layer, an API, or an integration.
Add a `conftest.py` or a `helpers.py` to a topic only when its tests need them.
Put a fixture or a helper in the global `conftest.py` or `helpers.py` only when many topics use it.
Create test data with the factories in `factories/`. One module per model.

See [backend testing](./backend-testing.md).

## Utilities

Generic helpers with no domain logic. Examples: date handling, database functions, and custom fields.

## Dependency direction

`api/` and `admin/` depend on `models/`, `services/`, and `integrations/`.
Never the opposite. If you need to break this rule, stop and ask the user how to resolve it.
