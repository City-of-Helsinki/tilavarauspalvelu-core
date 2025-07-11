import { TermsType, useTermsOfUseQuery } from "../../gql/gql-types";
import { filterNonNullable } from "../helpers";
import { genericTermsVariant } from "../const";
import { gql } from "@apollo/client";

export function useGenericTerms() {
  const { data } = useTermsOfUseQuery({
    variables: {
      termsType: TermsType.GenericTerms,
    },
  });

  const genericTerms = filterNonNullable(data?.termsOfUse?.edges?.map((n) => n?.node)).find(
    (n) => n.pk === genericTermsVariant.BOOKING
  );

  return genericTerms;
}

export const TERMS_OF_USE_QUERY = gql`
  query TermsOfUse($termsType: TermsType) {
    termsOfUse(termsType: $termsType) {
      edges {
        node {
          id
          ...TermsOfUseFields
        }
      }
    }
  }
`;
