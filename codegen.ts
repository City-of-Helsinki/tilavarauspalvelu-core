import type { IGraphQLConfig } from "graphql-config";

const scalars = {
  DateTime: "string",
  Date: "string",
  Decimal: "string",
  Duration: "number",
  JSON: "string",
  Long: "number",
  Time: "string",
  TimeString: "string",
  Upload: "unknown",
  UUID: "string",
  Void: "unknown",
  GraphQLStringOrFloat: "string",
  Hash: "unknown",
};

const gqlConfig = {
  // TODO should change to true, but requires refactoring (not just type changes)
  // why avoidOptionals is good? because it doesn't allow passing an invalid query result / fragment to a component
  // generated fragments helps a lot with that, but there are still cases where it fails.
  // With this on you have to explicitly set the field to null to pass it to a component or
  // you know, query it properly from the server like you should in 99% of cases.
  avoidOptionals: {
    field: false,
    inputValue: false,
    object: false,
    defaultValue: false,
  },
  // TODO this would improve linting fragments but it causes some issues in type generation
  // experimentalFragmentVariables: true,
  skipTypename: true,
  defaultScalarType: "unknown",
  scalars,
};

const schema = "http://localhost:8000/graphql/";
const plugins = [
  "typescript",
  "typescript-operations",
  "typescript-react-apollo",
] as const;

const config: IGraphQLConfig = {
  projects: {
    common: {
      schema,
      documents: "packages/common/**/!(*.d|gql-types).{ts,tsx}",
      extensions: {
        codegen: {
          config: gqlConfig,
          generates: {
            "packages/common/gql/gql-types.ts": {
              plugins,
            },
            'tilavaraus.graphql': {
              plugins: ['schema-ast'],
              config: {
                includeDirectives: true
              },
            },
          },
          hooks: {
            afterOneFileWrite: ["prettier --write"],
          },
        },
      },
    },
    "admin-ui": {
      schema,
      documents: "apps/admin-ui/**/!(*.d|gql-types).{ts,tsx}",
      extensions: {
        codegen: {
          config: gqlConfig,
          generates: {
            "apps/admin-ui/gql/gql-types.ts": {
              plugins,
            },
          },
          hooks: {
            afterOneFileWrite: ["prettier --write"],
          },
        },
      },
    },
    ui: {
      schema,
      documents: "apps/ui/**/!(*.d|gql-types).{ts,tsx}",
      extensions: {
        codegen: {
          config: gqlConfig,
          generates: {
            "apps/ui/gql/gql-types.ts": {
              plugins,
            },
          },
          hooks: {
            afterOneFileWrite: ["prettier --write"],
          },
        },
      },
    },
  },
};

export default config;
