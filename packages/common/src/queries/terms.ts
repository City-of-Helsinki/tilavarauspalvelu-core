import { gql } from "@apollo/client";

// Only the text part since that's normally only needed on client side
export const TERMS_OF_USE_FRAGMENT = gql`
  fragment TermsOfUseFragment on TermsOfUseType {
    textFi
    textEn
    textSv
  }
`;

// TODO see if we can remove the type and name fields from most of the queries
// the filter should be enough for the type
// the name should only be used on the admin side
export const TERMS_OF_USE = gql`
  ${TERMS_OF_USE_FRAGMENT}
  query TermsOfUse($termsType: TermsType) {
    termsOfUse(termsType: $termsType) {
      edges {
        node {
          pk
          nameFi
          nameEn
          nameSv
          termsType
          ...TermsOfUseFragment
        }
      }
    }
  }
`;
