import { gql } from "@apollo/client";
import { ReservationsReservationTypeChoices } from "common/types/gql-types";

export const CREATE_RESERVATION = gql`
  mutation createReservation($input: ReservationCreateMutationInput!) {
    createReservation(input: $input) {
      pk
      price
      errors {
        field
        messages
      }
    }
  }
`;

export const UPDATE_RESERVATION = gql`
  mutation updateReservation($input: ReservationUpdateMutationInput!) {
    updateReservation(input: $input) {
      reservation {
        pk
        calendarUrl
        state
        user {
          email
        }
        name
        description
        purpose {
          pk
        }
        numPersons
        ageGroup {
          pk
        }
        reserveeFirstName
        reserveeLastName
        reserveeOrganisationName
        reserveePhone
        reserveeEmail
        reserveeId
        reserveeIsUnregisteredAssociation
        reserveeAddressStreet
        reserveeAddressCity
        reserveeAddressZip
        billingFirstName
        billingLastName
        billingPhone
        billingEmail
        billingAddressStreet
        billingAddressCity
        billingAddressZip
        homeCity {
          pk
        }
        applyingForFreeOfCharge
        freeOfChargeReason
      }
      errors {
        field
        messages
      }
    }
  }
`;

export const DELETE_RESERVATION = gql`
  mutation deleteReservation($input: ReservationDeleteMutationInput!) {
    deleteReservation(input: $input) {
      deleted
      errors
    }
  }
`;

export const CANCEL_RESERVATION = gql`
  mutation cancelReservation($input: ReservationCancellationMutationInput!) {
    cancelReservation(input: $input) {
      pk
      cancelReasonPk
      cancelDetails
      state
      clientMutationId
      errors {
        field
        messages
      }
    }
  }
`;

export const CONFIRM_RESERVATION = gql`
  mutation confirmReservation($input: ReservationConfirmMutationInput!) {
    confirmReservation(input: $input) {
      pk
      state
      order {
        id
        pk
        checkoutUrl
        receiptUrl
      }
      errors {
        field
        messages
      }
    }
  }
`;

// NOTE hard coded NORMAL type so only ment to be used in client ui.
// reservationType valid values: "normal", "behalf", "staff", "blocked"
// even though the ReservationsReservationTypeChoices says they are uppercase
// NOTE bang user ID so this doesn't get abused (don't use it without a user)
export const LIST_RESERVATIONS = gql`
  query listReservations(
    $before: String
    $after: String
    $first: Int
    $last: Int
    $begin: DateTime
    $end: DateTime
    $state: [String]
    $user: ID!
    $reservationUnit: [ID]
    $orderBy: String
  ) {
    reservations(
      before: $before
      after: $after
      first: $first
      last: $last
      begin: $begin
      end: $end
      state: $state
      user: $user
      reservationUnit: $reservationUnit
      orderBy: $orderBy
      reservationType: "${ReservationsReservationTypeChoices.Normal.toLowerCase()}"
    ) {
      edges {
        node {
          pk
          name
          begin
          end
          state
          price
          bufferTimeBefore
          bufferTimeAfter
          orderUuid
          isBlocked
          reservationUnits {
            pk
            nameFi
            nameEn
            nameSv
            unit {
              nameFi
              nameEn
              nameSv
              location {
                addressStreetFi
                addressStreetEn
                addressStreetSv
              }
            }
            cancellationRule {
              canBeCancelledTimeBefore
              needsHandling
            }
            images {
              imageType
              imageUrl
              mediumUrl
            }
            pricings {
              begins
              priceUnit
              pricingType
              lowestPrice
              highestPrice
              taxPercentage {
                value
              }
              status
            }
          }
        }
      }
    }
  }
`;

export const GET_RESERVATION = gql`
  query reservationByPk($pk: Int!) {
    reservationByPk(pk: $pk) {
      pk
      name
      description
      reserveeFirstName
      reserveeLastName
      reserveeEmail
      reserveePhone
      reserveeType
      reserveeId
      reserveeOrganisationName
      bufferTimeBefore
      bufferTimeAfter
      begin
      end
      calendarUrl
      user {
        email
      }
      state
      price
      priceNet
      taxPercentageValue
      orderStatus
      orderUuid
      reservationUnits {
        pk
        nameFi
        nameEn
        nameSv
        reservationPendingInstructionsFi
        reservationPendingInstructionsEn
        reservationPendingInstructionsSv
        reservationConfirmedInstructionsFi
        reservationConfirmedInstructionsEn
        reservationConfirmedInstructionsSv
        reservationCancelledInstructionsFi
        reservationCancelledInstructionsEn
        reservationCancelledInstructionsSv
        termsOfUseFi
        termsOfUseEn
        termsOfUseSv
        serviceSpecificTerms {
          textFi
          textEn
          textSv
        }
        cancellationTerms {
          textFi
          textEn
          textSv
        }
        paymentTerms {
          textFi
          textEn
          textSv
        }
        pricingTerms {
          textFi
          textEn
          textSv
        }
        unit {
          pk
          tprekId
          nameFi
          nameEn
          nameSv
          location {
            latitude
            longitude
            addressStreetFi
            addressStreetEn
            addressStreetSv
            addressZip
            addressCityFi
            addressCityEn
            addressCitySv
          }
        }
        cancellationRule {
          canBeCancelledTimeBefore
          needsHandling
        }
        spaces {
          pk
          nameFi
          nameEn
          nameSv
        }
        metadataSet {
          supportedFields
          requiredFields
        }
        images {
          imageUrl
          largeUrl
          mediumUrl
          smallUrl
          imageType
        }
        pricings {
          begins
          priceUnit
          pricingType
          lowestPrice
          highestPrice
          taxPercentage {
            value
          }
          status
        }
        minPersons
        maxPersons
        metadataSet {
          id
          name
          pk
          supportedFields
          requiredFields
        }
      }
      purpose {
        pk
        nameFi
        nameEn
        nameSv
      }
      ageGroup {
        pk
        minimum
        maximum
      }
      homeCity {
        pk
        name
      }
      numPersons
      isHandled
    }
  }
`;

export const GET_RESERVATION_CANCEL_REASONS = gql`
  query getReservationCancelReasons {
    reservationCancelReasons {
      edges {
        node {
          pk
          reasonFi
          reasonEn
          reasonSv
        }
      }
    }
  }
`;

export const GET_CITIES = gql`
  query getCities {
    cities {
      edges {
        node {
          pk
          name
          nameFi
          nameEn
          nameSv
        }
      }
    }
  }
`;

export const ADJUST_RESERVATION_TIME = gql`
  mutation adjustReservationTime($input: ReservationAdjustTimeMutationInput!) {
    adjustReservationTime(input: $input) {
      pk
      state
      begin
      end
      errors {
        field
        messages
      }
    }
  }
`;

export const GET_ORDER = gql`
  query order($orderUuid: String!) {
    order(orderUuid: $orderUuid) {
      reservationPk
      status
      paymentType
      receiptUrl
      checkoutUrl
    }
  }
`;

export const REFRESH_ORDER = gql`
  mutation refreshOrder($input: RefreshOrderMutationInput!) {
    refreshOrder(input: $input) {
      orderUuid
      status
    }
  }
`;
