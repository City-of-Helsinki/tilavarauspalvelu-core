import { TermsOfUseTypeChoices, useTermsOfUseQuery } from "../../gql/gql-types";
import { genericTermsVariant } from "../modules/const";
import { gql } from "@apollo/client";
import { filterNonNullable } from "../modules/helpers";

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
