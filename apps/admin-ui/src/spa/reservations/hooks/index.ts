import { useTranslation } from "react-i18next";
import {
  useUpdateRecurringReservationMutation,
  useUpdateStaffReservationMutation,
  type ReservationSeriesUpdateMutationInput,
  ReserveeType,
  CustomerTypeChoice,
  type Maybe,
  type UpdateStaffReservationMutationVariables,
  type UseStaffReservationFragment,
} from "@gql/gql-types";
import { successToast } from "common/src/common/toast";
import { ApolloError, gql } from "@apollo/client";
import { useDisplayError } from "common/src/hooks";

type InputT = UpdateStaffReservationMutationVariables["input"];
type MemoT = UpdateStaffReservationMutationVariables["workingMemo"];
type ExtraParamsT = { seriesName?: string };

export type MutationInputParams = Omit<InputT, "pk"> & Omit<MemoT, "pk"> & ExtraParamsT;

type Props = {
  reservation: UseStaffReservationFragment;
  onSuccess: () => void;
};

/// Combines regular and recurring reservation change mutation
export function useStaffReservationMutation({ reservation, onSuccess }: Props) {
  const { t } = useTranslation();
  const displayError = useDisplayError();
  const [mutation] = useUpdateStaffReservationMutation();
  const [recurringMutation] = useUpdateRecurringReservationMutation();

  const handleSuccess = (isRecurring: boolean) => {
    const trKey = `Reservation.EditPage.${isRecurring ? "saveSuccessRecurring" : "saveSuccess"}`;
    successToast({ text: t(trKey) });
    onSuccess();
  };

  const editStaffReservation = async (vals: MutationInputParams) => {
    const { seriesName, workingMemo, ...rest } = vals;

    try {
      if (reservation.recurringReservation?.pk != null) {
        const { type, ...details } = rest;
        const reserveeType = convertReserveeType(rest.reserveeType);
        const reservationDetails = {
          ...details,
          reserveeType,
        };

        const input: ReservationSeriesUpdateMutationInput = {
          name: seriesName,
          pk: reservation.recurringReservation.pk,
          description: workingMemo,
          ageGroup: rest.ageGroup,
          reservationDetails,
        };
        const res = await recurringMutation({
          variables: {
            input,
          },
        });

        if (res.errors != null && res.errors.length > 0) {
          throw new ApolloError({ graphQLErrors: res.errors });
        }
        handleSuccess(true);
      } else {
        if (!reservation.pk) {
          throw new Error("No reservation pk");
        }
        const variables = {
          input: {
            ...rest,
            pk: reservation.pk,
          },
          workingMemo: {
            pk: reservation.pk,
            workingMemo,
          },
        };
        mutation({ variables });
        handleSuccess(false);
      }
    } catch (err) {
      displayError(err);
    }
  };

  return editStaffReservation;
}

function convertReserveeType(type?: Maybe<CustomerTypeChoice>): ReserveeType | undefined {
  if (type == null) {
    return undefined;
  }
  switch (type) {
    case CustomerTypeChoice.Business:
      return ReserveeType.Business;
    case CustomerTypeChoice.Individual:
      return ReserveeType.Individual;
    case CustomerTypeChoice.Nonprofit:
      return ReserveeType.Nonprofit;
    default:
      return undefined;
  }
}

export const USE_STAFF_RESERVATION_FRAGMENT = gql`
  fragment UseStaffReservation on ReservationNode {
    id
    pk
    recurringReservation {
      id
      pk
    }
  }
`;

export const UPDATE_STAFF_RESERVATION_MUTATION = gql`
  mutation UpdateStaffReservation(
    $input: ReservationStaffModifyMutationInput!
    $workingMemo: ReservationWorkingMemoMutationInput!
  ) {
    staffReservationModify(input: $input) {
      pk
    }
    updateReservationWorkingMemo(input: $workingMemo) {
      workingMemo
    }
  }
`;

export const UPDATE_STAFF_RECURRING_RESERVATION_MUTATION = gql`
  mutation UpdateRecurringReservation($input: ReservationSeriesUpdateMutationInput!) {
    updateReservationSeries(input: $input) {
      pk
    }
  }
`;
