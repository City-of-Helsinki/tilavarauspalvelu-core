## Prerequisites

1. Node 16 (`nvm use`)
1. Yarn

## Available Scripts

### When GQL API changes, update local schema from core running at localhost:

```
yarn update-schema
```

### When GQL API changes, update API types from local schema:

```
yarn generate-gql-types
```

### Generate dummy certificates for local ui

```
yarn generate-certificate
```
