import { TermsOfUseTypeChoices, useTermsOfUseQuery } from "../../gql/gql-types";
import { filterNonNullable } from "../helpers";
import { genericTermsVariant } from "../const";
import { gql } from "@apollo/client";

export function useGenericTerms() {
  const { data } = useTermsOfUseQuery({
    variables: {
      termsType: TermsOfUseTypeChoices.GenericTerms,
    },
  });

  const genericTerms = filterNonNullable(data?.allTermsOfUse).find(
    (n) => n.pk === genericTermsVariant.BOOKING
  );

  return genericTerms;
}

export const TERMS_OF_USE_QUERY = gql`
  query TermsOfUse($termsType: TermsOfUseTypeChoices) {
    allTermsOfUse(filter: { termsType: $termsType }) {
      id
      ...TermsOfUseFields
    }
  }
`;
