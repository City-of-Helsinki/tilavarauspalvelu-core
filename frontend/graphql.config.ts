import type { IGraphQLConfig } from "graphql-config";

const scalars = {
  DateTime: "string",
  Date: "string",
  // Python decimal is a string but it allows numbers also for mutations
  // using number in mutation has two benefits:
  // - we don't have to toNumber(val).toString() for all values
  // - removes server errors from passing "" as a value (which can't be type checked on client)
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
  // Avoid optionals is good because it removes undefined so objects have to be strict supersets
  // e.g. { name: string | null, value: number | null } doesn't allow { name: "foo" } object
  // with optionals { name: string | undefined, value: number | undefined }
  // would allow { name: "foo" }
  // or even { notName: "bar" } (or any object when all values are optional)
  avoidOptionals: {
    field: true,
    inputValue: false,
    object: false,
    defaultValue: false,
  },
  immutableTypes: true,
  skipTypename: true,
  defaultScalarType: "unknown",
  strictScalars: true,
  scalars,
  // Apollo Client 4 exports the React hooks and their types from a separate entry point
  apolloReactCommonImportFrom: "@apollo/client/react",
  // A wrapper of @apollo/client/react, so the proxy middleware can import the generated file (see the wrapper)
  apolloReactHooksImportFrom: "@ui/modules/apollo/reactHooks",
  // Apollo Client 4 removed the types these use (MutationFunction and BaseMutationOptions)
  withMutationFn: false,
  withMutationOptionsType: false,
};

const schema = "../tilavaraus.graphql";
const plugins = ["typescript", "typescript-operations", "typescript-react-apollo"] as const;

const config: IGraphQLConfig = {
  projects: {
    ui: {
      schema,
      documents: "packages/ui/**/!(*.d|gql-types|*.test).{ts,tsx}",
      extensions: {
        codegen: {
          config: gqlConfig,
          generates: {
            "packages/ui/gql/gql-types.ts": {
              plugins,
            },
          },
        },
      },
    },
    staff: {
      schema,
      documents: "apps/staff/**/!(*.d|gql-types|*.test).{ts,tsx}",
      extensions: {
        codegen: {
          config: gqlConfig,
          generates: {
            "apps/staff/gql/gql-types.ts": {
              plugins,
            },
          },
        },
      },
    },
    customer: {
      schema,
      documents: "apps/customer/**/!(*.d|gql-types|*.test).{ts,tsx}",
      extensions: {
        codegen: {
          config: gqlConfig,
          generates: {
            "apps/customer/gql/gql-types.ts": {
              plugins,
            },
          },
        },
      },
    },
  },
};

export default config;
