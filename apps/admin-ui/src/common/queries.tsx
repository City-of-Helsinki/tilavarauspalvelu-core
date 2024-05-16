import { gql } from "@apollo/client";
import {
  IMAGE_FRAGMENT,
  LOCATION_FRAGMENT,
} from "common/src/queries/fragments";
import {
  RESERVATION_UNIT_COMMON_FRAGMENT,
  RESOURCE_FRAGMENT,
  SPACE_COMMON_FRAGMENT,
  SPACE_FRAGMENT,
} from "./fragments";

export const SPACES_QUERY = gql`
  ${SPACE_COMMON_FRAGMENT}
  query Spaces {
    spaces(onlyWithPermission: true) {
      edges {
        node {
          ...SpaceCommonFields
          unit {
            pk
            nameFi
          }
        }
      }
    }
  }
`;

export const RESOURCES_QUERY = gql`
  ${RESOURCE_FRAGMENT}
  query Resources {
    resources(onlyWithPermission: true) {
      edges {
        node {
          locationType
          ...ResourceFields
        }
      }
    }
  }
`;

export const DELETE_SPACE = gql`
  mutation DeleteSpace($input: SpaceDeleteMutationInput!) {
    deleteSpace(input: $input) {
      deleted
    }
  }
`;

export const UNIT_QUERY = gql`
  ${SPACE_FRAGMENT}
  ${RESERVATION_UNIT_COMMON_FRAGMENT}
  ${IMAGE_FRAGMENT}
  ${LOCATION_FRAGMENT}
  query Unit($id: ID!) {
    unit(id: $id) {
      pk
      nameFi
      tprekId
      shortDescriptionFi
      reservationunitSet {
        ...ReservationUnitCommonFields
        isArchived
        resources {
          pk
        }
        isDraft
        purposes {
          pk
          nameFi
        }
        images {
          ...ImageFragment
        }
      }
      spaces {
        ...SpaceFields
      }
      location {
        ...LocationFields
        longitude
        latitude
      }
    }
  }
`;

export const UNIT_WITH_SPACES_AND_RESOURCES = gql`
  ${SPACE_COMMON_FRAGMENT}
  ${LOCATION_FRAGMENT}
  query UnitWithSpacesAndResources($id: ID!) {
    unit(id: $id) {
      pk
      nameFi
      spaces {
        ...SpaceCommonFields
        resourceSet {
          pk
          nameFi
        }
      }
      location {
        ...LocationFields
      }
    }
  }
`;

export const DELETE_RESOURCE = gql`
  mutation DeleteResource($input: ResourceDeleteMutationInput!) {
    deleteResource(input: $input) {
      deleted
    }
  }
`;

// TODO backend should add: onlyWithHandlingPermission parameter for this query (replaces the onlyWithPermission)
export const HANDLING_COUNT_QUERY = gql`
  query HandlingData($beginDate: Date!) {
    reservations(
      state: "REQUIRES_HANDLING"
      beginDate: $beginDate
      onlyWithPermission: true
    ) {
      edges {
        node {
          pk
        }
      }
    }

    units(onlyWithPermission: true) {
      edges {
        node {
          pk
        }
      }
      totalCount
    }
  }
`;
