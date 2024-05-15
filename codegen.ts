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
  avoidOptionals: {
    field: false,
    inputValue: false,
    object: false,
    defaultValue: false,
  },
  defaultScalarType: "unknown",
  // nonOptionalTypename: true,
  scalars,
};

const schema = "http://localhost:8000/graphql/";
const plugins = [
  "typescript",
  "typescript-operations",
  "typescript-react-apollo",
];

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
