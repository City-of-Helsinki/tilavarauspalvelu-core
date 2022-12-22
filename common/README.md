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

### Generate email .html templates

```
yarn generate-email-template
```

 - For previewing the .mjml templates from which the .html files are generated, install the MJML extension (mjmlio.vscode-mjml), make sure to get the correct one (by MJML).
 - To prevent headaches from prettier in formatting of .mjml files include the following in your vscode settings:
    ```
    "[mjml]": {
        "editor.defaultFormatter": "mjmlio.vscode-mjml"
    }
    ```
 - NOTE: NEVER! EVER! EVER! modify the .html files directly. If changes are required, change the .mjml files and re-generate the .html files