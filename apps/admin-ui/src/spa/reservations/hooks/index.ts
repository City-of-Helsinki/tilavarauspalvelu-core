import { useTranslation } from "react-i18next";
import {
  type ReservationQuery,
  useUpdateRecurringReservationMutation,
  useUpdateStaffReservationMutation,
  type ReservationSeriesUpdateMutationInput,
  ReserveeType,
  CustomerTypeChoice,
  type Maybe,
  type ReservationStaffModifyMutationInput,
} from "@gql/gql-types";
import { errorToast, successToast } from "common/src/common/toast";

export type MutationInputParams = Omit<
  ReservationStaffModifyMutationInput,
  "pk"
> & {
  seriesName?: string;
  workingMemo?: string;
};
type ReservationType = NonNullable<ReservationQuery["reservation"]>;

/// Combines regular and recurring reservation change mutation
export function useStaffReservationMutation({
  reservation,
  onSuccess,
}: {
  reservation: Pick<ReservationType, "pk" | "recurringReservation">;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();

  const [mutation] = useUpdateStaffReservationMutation();

  const [recurringMutation] = useUpdateRecurringReservationMutation();

  const handleSuccess = (isRecurring: boolean) => {
    const trKey = `Reservation.EditPage.${
      isRecurring ? "saveSuccessRecurring" : "saveSuccess"
    }`;
    successToast({ text: t(trKey) });
    onSuccess();
  };
  const handleError = () => {
    errorToast({ text: t("Reservation.EditPage.saveError") });
  };

  const editStaffReservation = async (vals: MutationInputParams) => {
    const { seriesName, workingMemo, ...rest } = vals;

    try {
      if (reservation.recurringReservation?.pk != null) {
        const { purposePk, ageGroupPk, homeCityPk, type, ...details } = rest;
        const reserveeType = convertReserveeType(rest.reserveeType);
        const reservationDetails = {
          ...details,
          purpose: purposePk,
          ageGroup: ageGroupPk,
          homeCity: homeCityPk,
          reserveeType,
        };

        const input: ReservationSeriesUpdateMutationInput = {
          name: seriesName,
          pk: reservation.recurringReservation.pk,
          description: workingMemo,
          ageGroup: rest.ageGroupPk,
          reservationDetails,
        };
        const res = await recurringMutation({
          variables: {
            input,
          },
        });

        if (res.errors) {
          handleError();
          return;
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
    } catch (e) {
      handleError();
    }
  };

  return editStaffReservation;
}

function convertReserveeType(
  type?: Maybe<CustomerTypeChoice>
): ReserveeType | undefined {
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
