import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import { CreateGraphQLMocksReturn } from "./test.gql.utils";

export function MockedGraphQLProvider({
  mocks,
  children,
}: {
  mocks: CreateGraphQLMocksReturn;
  children: React.ReactNode;
}) {
  return (
    <MockedProvider
      mocks={mocks}
      addTypename={false}
      // Have to cache bypass (setting cache to InMemoryCache is not enough)
      // NOTE if copying this approach any override in the query will take precedence
      // so for query specific fetchPolicies an alternative approach to cache is required
      defaultOptions={{
        watchQuery: { fetchPolicy: "no-cache" },
        query: { fetchPolicy: "no-cache" },
        mutate: { fetchPolicy: "no-cache" },
      }}
    >
      {children}
    </MockedProvider>
  );
}
