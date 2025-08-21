import { TermsOfUseTypeChoices, useTermsOfUseQuery } from "../../gql/gql-types";
import { filterNonNullable } from "../helpers";
import { genericTermsVariant } from "../const";
import { gql } from "@apollo/client";

export function useGenericTermsOfUse() {
  const { data } = useTermsOfUseQuery({
    variables: {
      termsType: TermsOfUseTypeChoices.GenericTerms,
    },
  });

  return filterNonNullable(data?.allTermsOfUse).find((n) => n.pk === genericTermsVariant.BOOKING);
}

export const TERMS_OF_USE_QUERY = gql`
  query TermsOfUse(
    # Filter
    $termsType: TermsOfUseTypeChoices
  ) {
    allTermsOfUse(filter: { termsType: $termsType }) {
      id
      ...TermsOfUseFields
    }
  }
`;
