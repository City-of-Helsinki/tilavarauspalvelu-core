# Backend ORM

> Also read the [backend architecture](./backend-architecture.md).

Rules for code that reaches the database. They apply when you write code and when you review it.

## Queries in loops

- Fetch related data before the loop with `select_related`, `prefetch_related`, or one query keyed into a dict.
- Write in bulk after the loop with `bulk_create`, `bulk_update`, or `queryset.update()`.
  Read `Bulk writes` first.
- Add many-to-many rows with one `add(*objects)` call, or with `bulk_create` on the through model.
- Move filtering, sorting, counting, and summing into the query when the database can do it.
- Use `.iterator(chunk_size=...)` for large result sets that the code reads once.

## Hidden queries

- A prefetch cache serves `.all()`, `.count()` and `.exists()`. A `.filter()`, `.exclude()` or `.order_by()`
  on a prefetched relation makes a new query. `.first()` makes a new query when the relation has no ordering.
  Use `Prefetch(..., to_attr=...)` or work on the prefetched list in Python.
- A field removed with `.only()` or `.defer()` makes one query per row when the code reads it.
- Read a foreign key id with `obj.fk_id`, not `obj.fk.id`.
- Evaluate a queryset once. Use `len()` on a queryset that the code iterates later.
  Use `.exists()` or `.count()` on a queryset that the code only checks.
- `refresh_from_db()`, `get()`, and `get_or_create()` inside a loop make one query per row.
- A plain `@property` or method that reads a relation makes queries per row in a list. See `Lookup properties`.

## Lookup properties

We use [django-lookup-property](https://mrthearman.github.io/django-lookup-property/llms.txt).
A lookup property defines a value once as an ORM expression. It works as a Python property and in queries.

- Use `@lookup_property` for a value that the code reads in Python and also filters, orders, or annotates on.
  Replace a plain `@property` that has a separate queryset annotation or filter for the same value.
- Filter with `L(...)`: `.filter(L(name=value))`, `.filter(L(relation__name=value))`, or inside `Q`.
- In lists and loops, annotate the value with `.annotate(name=L("name"))`.
  The annotation replaces the Python code, so a property that reads relations does not make a query per row.
- In GraphQL, expose it with `AnnotatedField(..., expression=L("name"))`.
- When a subquery has an `OuterRef` to a lookup property, wrap the whole subquery in `L`, not only the `OuterRef`.
- For a multi-valued relation (reverse foreign key or many-to-many), use an aggregate or `Exists`.
  Without one, the property has many values for one row.
- Use `concrete=True` only when almost every fetch of the model needs the value.
  It adds the expression to every query on the model.
- An `.override` replaces the generated Python code. Check that the override gives the same result as the expression.
  Without an override, check the generated code with `Model.name.func_source`.

## Query correctness

- Two aggregates over different multi-valued joins multiply each other and give wrong numbers.
  Use a subquery for each aggregate.
- One `.filter()` with two conditions on a multi-valued relation matches one related row.
  Two chained `.filter()` calls can match two different related rows. Check which one the code means.
- A join to a multi-valued relation can return the same row many times. Check for a missing `.distinct()`.
- Use `Exists` instead of `Count(...) > 0`.
- A `Subquery` must return one row and one column. Check for `[:1]` or a unique filter, and `.values(...)`.

## Bulk writes

- `bulk_create`, `bulk_update` and `queryset.update()` do not call `save()`,
  and they do not send `pre_save` or `post_save`.
- `queryset.delete()` does not call the model's `delete()`. It still sends `pre_delete` and `post_delete`.
- For these writes, check the receivers in `tilavarauspalvelu/signals.py` and the model's `save()`.
  If they do work that must happen, do that work in bulk in the same code path.
- Models with an `AuditLogger` get their audit log from signals. A bulk write on these models writes no audit log.
  Treat this as a correctness issue, because these models hold personal data and payments.
- `queryset.update()` does not set `auto_now` fields. Set them in the update.
- `bulk_create` skips `full_clean()` and model validators. Validate before the write.
- `queryset.delete()` loads the rows into memory when the model has delete signals or Python-side cascades.
- Use `save(update_fields=[...])` when the code changes only some fields.
  A plain `save()` writes every column and can overwrite a parallel change.

## Concurrency and transactions

Users compete for the same slots. Correctness matters more than speed for payments, double bookings,
access codes and personal data.

- Use `F()` expressions for changes based on the current value, not read-modify-write in Python.
- Use `select_for_update()` inside `transaction.atomic()` when two requests can change the same rows.
- Run side effects such as emails, Celery tasks and integration calls with `transaction.on_commit()`
  when they are inside a transaction.
- `get_or_create` and `update_or_create` are safe against races only with a unique constraint behind them.

## GraphQL optimizer

The API uses `graphene-django-query-optimizer`. It builds one queryset from the GraphQL query.

- In `optimize_<field>` methods and in `pre_optimization_hook`, add work to the `optimizer` argument:
  - `optimizer.annotations[name] = expression` and `optimizer.aliases[name] = expression`.
  - `optimizer.only_fields.append(field)`.
  - `optimizer.get_or_set_child_optimizer(...)` for relations.
- Return the queryset unchanged from these methods. This includes `annotate()`, `alias()`, `select_related()`,
  `prefetch_related()`, `only()` and queryset flags. When another node reaches this node through a
  foreign key, the optimizer runs the method on a throwaway queryset and keeps only the data in the optimizer.
  An entry in `optimizer.annotations` makes the optimizer use a prefetch for the relation, so the annotation is kept.
- A prefetch runs the related node's `filter_queryset`. A join does not. So a new annotation on a related node
  can hide related objects that the user is not allowed to see. Code that reads the relation, such as
  `section.application`, then fails with `RelatedObjectDoesNotExist` instead of a permission error.
  Test the change with a user who can see the parent node but not the related node.
- A custom resolver must declare every field it reads. Use `AnnotatedField`, `MultiField`, or an `optimize_<field>` method.
  Otherwise, it makes queries per row.
- Permission checks and `restricted_fields` that read a relation need that relation in the optimizer.
  Add it in `pre_optimization_hook` with a child optimizer.
- Serializer `validate_*` methods and mutation flows that query once per input item are `Queries in loops`.

## Django admin

- `list_display` with related fields needs `list_select_related`.
- A foreign key to a large table, such as reservations, needs `raw_id_fields` or `autocomplete_fields`.
  A plain select loads every row.
- Check `search_fields` and `list_filter` that span joins, and inlines that make a query per row.

## Migrations

Fit a data migration to the production data size. See the scale in `AGENTS.md`.
If you do not know the size of a table, ask the user.

- Use `apps.get_model()`. Historical models have no custom methods, querysets, managers or lookup properties.
  Code imported from the app breaks when the app changes later.
- Use `queryset.update()` or one `bulk_update` per batch instead of `save()` per row.
  The `Bulk writes` rules apply.
- Read large tables with `.iterator(chunk_size=...)`.
- Give `RunPython` a reverse function, or `migrations.RunPython.noop` when no reverse is needed.
- On large tables, create indexes with `AddIndexConcurrently` in a migration with `atomic = False`.
- A column type change rewrites the whole table and locks it. Avoid it on large tables, or plan the downtime.
- Check that new filter and ordering fields on hot paths have an index.

## Background tasks and exports

- The `Queries in loops` and `Hidden queries` rules apply to Celery tasks in `tilavarauspalvelu/tasks.py`,
  management commands, and exports.
- Read large data sets with `.iterator(chunk_size=...)`, so the whole set is not in memory at once.

## Test data

Test data must be fast to create. This applies to factories in `tests/factories/`,
to tests, and to `tilavarauspalvelu/management/commands/data_creation/`.

- Create only the related objects that the test needs. Check factory defaults and sub-factories for extra objects.
- For many rows, use `.build()` and one `bulk_create` instead of `.create()` in a loop.
  The `Bulk writes` rules apply.
