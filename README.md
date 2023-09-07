# tilavarauspalvelu-ui
- [End user UI](ui/)
- [Admin UI](admin-ui/)
- [Common UI components](common/)

## Making a release
Draft a new release in https://github.com/City-of-Helsinki/tilavarauspalvelu-ui/releases - `ui` and `admin-ui` pipelines will pick up releases named `release-*`.

Include a changelog if applicable.

## Prerequisites

1. Node 18 (`nvm use`)
1. pnpm

## Scripts

Running scripts in the repo root uses turborepo to run the commands to all packages.

You can target commands using:
```
# only that package
pnpm {command} --filter {package_name}

# only that package and it's dependencies
pnpm {command} --filter {package_name}...
```

Start both frontends in dev mode
``` sh
pnpm dev
```

Lint all packages
``` sh
pnpm lint
# automatic fixing
pnpm lint:fix
```

Stylelint all packages
``` sh
pnpm lint:css
```

Typecheck all packages
``` sh
pnpm tsc
```

Build all packages
```
pnpm build
```

Test all packages
```
pnpm test
```

Generate SSL certificates for localhost
```
pnpm generate-certificate
```

## Repo structure

Main applications that don't depend on each other, can be built, and ran.
```
/apps
```

Dependencies that are used by multiple applications
```
/packages
```

## FAQ

### What's a server issue

How do you know it's server side? it's in the terminal logs not in the browser network request / logs.

In general for a basic page render that requires data
Nextjs does everything twice: it renders twice, it fetches twice, one on the server (SSR), one on the client (hydration).
On the server it uses Node, on the client it uses the browser.

Especially for fetch this is an issue since the native fetch in Node is rather quirky,
unlike browser APIs.

### Node 18 fetch failed server side

Using Node 18+ and getting Apollo fetch failed error or some other server side fetch exception?
Using http://localhost:XXXX as a backend?

Replace localhost with 127.0.0.1

#### Explanation

Node18 uses IPv6 as default so either we have to tell it to use IPv4 or change to 127.0.0.1 to explicitly
tell it that we are connecting to IPv4 address and not to :1.

127.0.0.1 is the prefered solution because it's not brittle unlike using dns resolution or env flags.
No module or node update should ever break it untill IPv4 is no longer supported.

### Other fetch problems with Node18+

Prefer 127.0.0.1 over localhost if that doesn't help then:

Turn off experimental fetch in the start script.
For example MSW requires this for local testing (non Docker), might help with other libraries also,
primarily those that manipulate or intercept requests.

```
"NODE_OPTIONS='--no-experimental-fetch' {cmd} ...
```

### Other server issues

Try downgrading node to 16, if it helps post a bug ticket.
