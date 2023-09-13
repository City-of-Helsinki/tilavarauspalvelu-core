import { useTranslation } from "react-i18next";
import { useNotification } from "app/context/NotificationContext";
import { useMutation } from "@apollo/client";
import {
  ReservationsReservationStateChoices,
  type RecurringReservationUpdateMutationInput,
  type RecurringReservationUpdateMutationPayload,
  type ReservationStaffModifyMutationInput,
  type ReservationStaffModifyMutationPayload,
  type ReservationType,
  type ReservationWorkingMemoMutationInput,
} from "common/types/gql-types";
import { useRecurringReservations } from "../requested/hooks";
import {
  UPDATE_STAFF_RECURRING_RESERVATION,
  UPDATE_STAFF_RESERVATION,
} from "./queries";

/// Combines regular and recurring reservation change mutation
export const useStaffReservationMutation = ({
  reservation,
  onSuccess,
}: {
  reservation: ReservationType;
  onSuccess: () => void;
}) => {
  const { t } = useTranslation();
  const { notifyError, notifySuccess } = useNotification();
  const [mutation] = useMutation<
    { staffReservationModify: ReservationStaffModifyMutationPayload },
    {
      input: ReservationStaffModifyMutationInput;
      workingMemo: ReservationWorkingMemoMutationInput;
    }
  >(UPDATE_STAFF_RESERVATION);

  const { reservations } = useRecurringReservations(
    reservation.recurringReservation?.pk ?? undefined
  );

  const [recurringMutation] = useMutation<
    { staffReservationModify: RecurringReservationUpdateMutationPayload },
    {
      input: RecurringReservationUpdateMutationInput;
    }
  >(UPDATE_STAFF_RECURRING_RESERVATION);

  const handleSuccess = (isRecurring: boolean) => {
    const trKey = `Reservation.EditPage.${
      isRecurring ? "saveSuccessRecurring" : "saveSuccess"
    }`;
    notifySuccess(t(trKey));
    onSuccess();
  };
  const handleError = () => {
    notifyError(t("Reservation.EditPage.saveError"));
  };

  type MutationInputParams = ReservationStaffModifyMutationInput & {
    seriesName?: string;
    workingMemo?: string;
  };

  const editStaffReservation = async (input: MutationInputParams) => {
    const { seriesName, workingMemo, ...rest } = input;
    const isRecurring = !!reservation.recurringReservation?.pk;

    if (isRecurring) {
      // NOTE frontend filtering because of cache issues
      const pksToUpdate = reservations
        .filter((x) => new Date(x.begin) >= new Date())
        .filter(
          (x) => x.state === ReservationsReservationStateChoices.Confirmed
        )
        .map((x) => x.pk)
        .filter((x): x is number => x != null);

      const res = await recurringMutation({
        variables: {
          input: {
            name: seriesName,
            pk: reservation.recurringReservation?.pk ?? 0,
            description: workingMemo,
          },
        },
      });

      if (res.errors) {
        handleError();
        return;
      }

      const retryOnce = async (vars: {
        input: ReservationStaffModifyMutationInput;
        workingMemo: {
          pk: number;
          workingMemo?: string;
        };
      }) => {
        try {
          const res2 = await mutation({
            variables: vars,
          });
          return res2;
        } catch (err) {
          if (err != null && typeof err === "object" && "networkError" in err) {
            const res3 = await mutation({
              variables: vars,
            });
            return Promise.resolve(res3);
          }
          return Promise.reject(err);
        }
      };

      const promises = pksToUpdate.map((pk) =>
        retryOnce({
          input: { ...rest, pk },
          workingMemo: { pk, workingMemo },
        })
      );

      // NOTE 1000+ mutations takes a long time, do 10 to check if they are valid and early abort on errors.
      const [firstPass, secondPass] = [
        promises.slice(0, 10),
        promises.slice(10),
      ];

      await Promise.all(firstPass)
        .then(() => Promise.all(secondPass))
        .then(() => handleSuccess(true))
        .catch(handleError);
    } else {
      const variables = {
        input: rest,
        workingMemo: {
          pk: input.pk,
          workingMemo,
        },
      };

      // Retry once on network error
      try {
        await mutation({
          variables,
          onCompleted: () => handleSuccess(false),
        });
      } catch (err) {
        if (err != null && typeof err === "object" && "networkError" in err) {
          await mutation({
            variables,
            onCompleted: () => handleSuccess(false),
            onError: () => handleError(),
          });
        }
      }
    }
  };

  return editStaffReservation;
};
