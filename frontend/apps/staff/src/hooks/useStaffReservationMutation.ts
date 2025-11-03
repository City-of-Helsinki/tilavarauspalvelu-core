import { ApolloError, gql } from "@apollo/client";
import { useTranslation } from "next-i18next";
import { successToast } from "ui/src/components/toast";
import { useDisplayError } from "ui/src/hooks";
import {
  type Maybe,
  type ReservationSeriesUpdateMutationInput,
  ReserveeType,
  type UpdateStaffReservationMutationVariables,
  type UseStaffReservationFragment,
  useUpdateReservationSeriesMutation,
  useUpdateStaffReservationMutation,
} from "@gql/gql-types";

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
  const [recurringMutation] = useUpdateReservationSeriesMutation();

  const handleSuccess = (isRecurring: boolean) => {
    const trKey = `reservation:EditPage.${isRecurring ? "saveSuccessRecurring" : "saveSuccess"}`;
    successToast({ text: t(trKey) });
    onSuccess();
  };

  const editStaffReservation = async (vals: MutationInputParams) => {
    const { seriesName, workingMemo, ...rest } = vals;

    try {
      if (reservation.reservationSeries?.pk != null) {
        const { type, ...details } = rest;
        const reserveeType = convertReserveeType(rest.reserveeType);
        const reservationDetails = {
          ...details,
          reserveeType,
        };

        const input: ReservationSeriesUpdateMutationInput = {
          name: seriesName,
          pk: reservation.reservationSeries.pk,
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

function convertReserveeType(type?: Maybe<ReserveeType>): ReserveeType | undefined {
  if (type == null) {
    return undefined;
  }
  switch (type) {
    case ReserveeType.Company:
      return ReserveeType.Company;
    case ReserveeType.Individual:
      return ReserveeType.Individual;
    case ReserveeType.Nonprofit:
      return ReserveeType.Nonprofit;
    default:
      return undefined;
  }
}

export const USE_STAFF_RESERVATION_FRAGMENT = gql`
  fragment UseStaffReservation on ReservationNode {
    id
    pk
    reservationSeries {
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
  mutation UpdateReservationSeries($input: ReservationSeriesUpdateMutationInput!) {
    updateReservationSeries(input: $input) {
      pk
    }
  }
`;
