import { gql } from "@apollo/client";

export const TERMS_OF_USE = gql`
  query TermsOfUse($termsType: TermsType) {
    termsOfUse(termsType: $termsType) {
      edges {
        node {
          pk
          nameFi
          nameEn
          nameSv
          textFi
          textEn
          textSv
          termsType
        }
      }
    }
  }
`;
