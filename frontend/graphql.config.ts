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
};

const schema = "../tilavaraus.graphql";

// Since version 6, typescript-operations writes the enum and input types that the operations use.
// The typescript plugin writes all schema types, which the code also imports (for example `ReservationNode`).
// Both plugins in one file declare these types two times. So the typescript plugin writes its own file,
// and the operations file imports from it and re-exports it. Code imports everything from `gql-types.ts`.
function codegenProject(dir: string) {
  return {
    schema,
    documents: `${dir}/**/!(*.d|gql-types|gql-schema-types|*.test).{ts,tsx}`,
    extensions: {
      codegen: {
        config: gqlConfig,
        generates: {
          [`${dir}/gql/gql-schema-types.ts`]: {
            plugins: ["typescript"],
          },
          [`${dir}/gql/gql-types.ts`]: {
            plugins: [
              { add: { content: 'export * from "./gql-schema-types";' } },
              "typescript-operations",
              "typescript-react-apollo",
            ],
            config: {
              importSchemaTypesFrom: `${dir}/gql/gql-schema-types.ts`,
            },
          },
        },
      },
    },
  };
}

const config: IGraphQLConfig = {
  projects: {
    ui: codegenProject("packages/ui"),
    staff: codegenProject("apps/staff"),
    customer: codegenProject("apps/customer"),
  },
};

export default config;
