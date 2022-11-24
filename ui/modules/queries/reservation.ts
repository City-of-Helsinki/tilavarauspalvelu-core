import { gql } from "@apollo/client";

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

export const LIST_RESERVATIONS = gql`
  query listReservations(
    $before: String
    $after: String
    $first: Int
    $last: Int
    $begin: DateTime
    $end: DateTime
    $state: [String]
    $user: ID
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
      reserveePhone
      reserveeType
      begin
      end
      calendarUrl
      user {
        email
      }
      state
      price
      priceNet
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
        }
      }
    }
  }
`;
