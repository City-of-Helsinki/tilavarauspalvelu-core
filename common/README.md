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
yarn generate-email-templates
```

 - Converts and translates (using `i18n/*.json`) the `templates/*.template.mjml` files to `html/*_{lang}.html` and `text-templates/*.template.txt` to `txt/*_{lang}.txt`.
 - Inside the templates, `${key}` is translated using the value of the `key` in the JSON files; `{{...}}` and `{%...%}` is intended for the Django template engine to interpret when the generated templates are used to render the actual emails, and are left as is by this command.
 - The text versions of the emails in the `text-templates` directory are translated (to the 'txt' directory) along with the .mjml to .html conversion but do not contain any other syntax that is handled by this command.
 - For previewing the .mjml templates from which the .html files are generated, install the MJML extension (mjmlio.vscode-mjml), make sure to get the correct one (by MJML).
 - To prevent headaches from prettier in formatting of .mjml files include the following in your vscode settings:
    ```
    "[mjml]": {
        "editor.defaultFormatter": "mjmlio.vscode-mjml"
    }
    ```
 - NOTE: NEVER! EVER! EVER! modify the generated .html/.txt files directly. If changes are required, change the .mjml files in the `templates` and the .txt files in the `text-templates` directory (and/or the translations in `i18n/`), and re-generate the .html/.txt files.
 - See further the documentation in Confluence (Finnish): https://helsinkisolutionoffice.atlassian.net/wiki/spaces/KAN/pages/8178106373/Email-pohjat
