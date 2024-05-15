import {
  type QueryTermsOfUseArgs,
  type Query,
  TermsType,
} from "../../gql/gql-types";
import { useQuery } from "@apollo/client";
import { filterNonNullable } from "../helpers";
import { genericTermsVariant } from "../const";
import { TERMS_OF_USE_QUERY } from "../queries/queries";

export function useGenericTerms() {
  const { data } = useQuery<Query, QueryTermsOfUseArgs>(TERMS_OF_USE_QUERY, {
    variables: {
      termsType: TermsType.GenericTerms,
    },
  });

  const genericTerms = filterNonNullable(
    data?.termsOfUse?.edges?.map((n) => n?.node)
  ).find((n) => n.pk === genericTermsVariant.BOOKING);

  return genericTerms;
}
