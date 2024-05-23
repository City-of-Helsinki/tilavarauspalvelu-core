import { gql } from "@apollo/client";
import {
  APPLICANT_FRAGMENT,
  APPLICANT_NAME_FRAGMENT,
  APPLICATION_SECTION_COMMON_FRAGMENT,
  APPLICATION_SECTION_UI_FRAGMENT,
} from "common/src/queries/application";

export const SPACE_COMMON_FRAGMENT = gql`
  fragment SpaceCommonFields on SpaceNode {
    id
    pk
    nameFi
    parent {
      id
      pk
      nameFi
    }
    surfaceArea
    maxPersons
  }
`;

export const RESOURCE_FRAGMENT = gql`
  fragment ResourceFields on ResourceNode {
    id
    pk
    nameFi
    space {
      id
      nameFi
      unit {
        id
        nameFi
        pk
      }
    }
  }
`;

export const SPACE_FRAGMENT = gql`
  ${SPACE_COMMON_FRAGMENT}
  ${RESOURCE_FRAGMENT}
  fragment SpaceFields on SpaceNode {
    ...SpaceCommonFields
    code
    resourceSet {
      ...ResourceFields
    }
    children {
      id
      pk
    }
  }
`;

export const RESERVATION_UNIT_COMMON_FRAGMENT = gql`
  fragment ReservationUnitCommonFields on ReservationUnitNode {
    id
    pk
    nameFi
    maxPersons
    surfaceArea
    reservationUnitType {
      id
      nameFi
    }
  }
`;

export const UNIT_NAME_FRAGMENT = gql`
  fragment UnitNameFields on UnitNode {
    id
    pk
    nameFi
    serviceSectors {
      id
      pk
      nameFi
    }
  }
`;

// NOTE this is for allocation only (it includes the application name)
// for regular application queries we don't need to query the name through the application relation
export const APPLICATION_SECTION_ADMIN_FRAGMENT = gql`
  ${APPLICANT_NAME_FRAGMENT}
  ${APPLICATION_SECTION_COMMON_FRAGMENT}
  fragment ApplicationSection on ApplicationSectionNode {
    ...ApplicationSectionCommon
    purpose {
      id
      pk
      nameFi
    }
    application {
      id
      pk
      status
      ...ApplicationName
    }
    reservationUnitOptions {
      id
      reservationUnit {
        id
        pk
        nameFi
        unit {
          id
          pk
          nameFi
        }
      }
    }
  }
`;

// TODO what does admin side require from UIFragment?
export const APPLICATION_ADMIN_FRAGMENT = gql`
  ${APPLICANT_FRAGMENT}
  ${APPLICATION_SECTION_UI_FRAGMENT}
  fragment ApplicationAdmin on ApplicationNode {
    pk
    id
    status
    lastModifiedDate
    ...Applicant
    applicationRound {
      id
      pk
      nameFi
    }
    applicationSections {
      id
      ...ApplicationSectionUI
      allocations
      reservationUnitOptions {
        id
        rejected
        allocatedTimeSlots {
          pk
          id
        }
      }
    }
  }
`;
