import { gql } from "@apollo/client";

export const IMAGE_FRAGMENT = gql`
  fragment ImageFragment on ReservationUnitImageType {
    imageUrl
    largeUrl
    mediumUrl
    smallUrl
    imageType
  }
`;
