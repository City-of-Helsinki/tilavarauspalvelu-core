# Docker Compose setups with backend and frontend

This directory has Docker Compose setups that run the full service: the database, Redis,
the backend, the Celery worker and scheduler, the customer UI and the staff UI.
They are separate from `docker-compose.yml` in the repository root, which runs only the backend.

| Setup | File | Use |
|-------|------|-----|
| Development | `compose.dev.yml` | Run the local source code. The code reloads when a file changes. |

Run `just stack` to see the commands.

## Addresses

| Service | Address |
|---------|---------|
| Customer UI | http://localhost:3000 |
| Staff UI | http://localhost:3001/kasittely |
| Backend | http://localhost:8000 |

The setups and the root `docker-compose.yml` use the same ports. Run only one of them at a time.
The database and Redis do not have ports on the host. To open the database, run for example `docker compose --file docker/compose.dev.yml exec db psql -U tvp` in the repository root.

## Backend settings

The backend uses the `Docker` settings environment. This environment reads its settings only from a `.env` file.
It does not read container environment variables. The setups mount `backend.env` from this directory as `/tvp/.env`.
`just stack env` makes `backend.env` from `backend/.env.example` and adds the Docker settings, for example the database host.
Add the secrets you need, for example `TUNNISTAMO_ADMIN_SECRET` for login. To make the file again, remove it and run `just stack env`.

## Frontend settings

In the development setup, the frontends read `apps/<app>/.env.local` from the source code mount, as `next dev` does on the host.
`just stack env` runs `just setup`, which makes these files from the examples if they do not exist.
A variable in the container environment has priority over the same variable in a `.env` file.

## Development setup

```sh
just stack dev
```

This builds the images and stays in the foreground with the logs. Stop it with Ctrl+C.

- The backend mounts `backend/` as `/tvp`. Django runserver reloads the code when a file changes.
- The frontends mount `frontend/`. `next dev` reloads the code when a file changes.
- Compose watch rebuilds the backend image when `pyproject.toml`, `poetry.lock` or the Dockerfile changes.
- Compose watch restarts the backend, the worker and the scheduler when `backend.env` changes. This needs Docker Compose 2.32 or later.
- Celery does not reload code. After a change to task code, run `just stack dev-compose restart worker scheduler`.
- The `frontend-install` service installs the frontend dependencies and generates the GraphQL types. Then it stops.
  After a change to `pnpm-lock.yaml` or `tilavaraus.graphql`, run `just stack dev-install`.
- The containers keep their own `node_modules` and `.next` in volumes. The packages on the host can be for another platform.
- `backend/local_settings.py` applies, because the backend mounts the full `backend/` directory.

To add test data, run `just stack dev-manage create_test_data`.

## Network

The backend, the customer UI and the staff UI share one network namespace. The `net` service owns it and publishes the ports.
The frontends use one backend URL for the server side rendering and for the browser.
In the shared namespace, `http://localhost:8000` is the backend in both places.
