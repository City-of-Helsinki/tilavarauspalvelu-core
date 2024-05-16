import { TermsType, useTermsOfUseQuery } from "../../gql/gql-types";
import { filterNonNullable } from "../helpers";
import { genericTermsVariant } from "../const";

export function useGenericTerms() {
  const { data } = useTermsOfUseQuery({
    variables: {
      termsType: TermsType.GenericTerms,
    },
  });

  const genericTerms = filterNonNullable(
    data?.termsOfUse?.edges?.map((n) => n?.node)
  ).find((n) => n.pk === genericTermsVariant.BOOKING);

  return genericTerms;
}
