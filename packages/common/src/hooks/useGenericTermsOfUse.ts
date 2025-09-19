import { TermsOfUseTypeChoices, useTermsOfUseQuery } from "../../gql/gql-types";
import { genericTermsVariant } from "../const";
import { gql } from "@apollo/client";

export function useGenericTermsOfUse() {
  const { data } = useTermsOfUseQuery({
    variables: {
      termsType: TermsOfUseTypeChoices.GenericTerms,
      pk: genericTermsVariant.BOOKING,
    },
  });

  return data?.allTermsOfUse.find(() => true) ?? null;
}

export const TERMS_OF_USE_QUERY = gql`
  query TermsOfUse(
    # Filter
    $termsType: TermsOfUseTypeChoices
    $pk: String!
  ) {
    allTermsOfUse(filter: { termsType: $termsType, pk: [$pk] }) {
      id
      ...TermsOfUseFields
    }
  }
`;
