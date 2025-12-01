import { gql } from "@apollo/client";
import { TermsOfUseTypeChoices, useTermsOfUseQuery } from "../../gql/gql-types";
import { genericTermsVariant } from "../modules/const";
import { filterNonNullable } from "../modules/helpers";

/**
 * Hook that fetches the generic booking terms of use from the API
 * @returns The first generic booking terms object or null if not found
 */
export function useGenericTerms() {
  const { data } = useTermsOfUseQuery({
    variables: {
      termsType: TermsOfUseTypeChoices.Generic,
      pk: genericTermsVariant.BOOKING,
    },
  });

  const genericTerms = filterNonNullable(data?.termsOfUse?.edges?.map((n) => n?.node));
  return genericTerms.find(() => true) ?? null;
}

export const TERMS_OF_USE_QUERY = gql`
  query TermsOfUse($termsType: TermsOfUseTypeChoices, $pk: String!) {
    termsOfUse(termsType: $termsType, pk: [$pk]) {
      edges {
        node {
          id
          ...TermsOfUseFields
        }
      }
    }
  }
`;
