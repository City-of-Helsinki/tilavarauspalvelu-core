import React, { useState } from "react";
import { Button, ButtonVariant, LoadingSpinner, Notification } from "hds-react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { gql } from "@apollo/client";
import { filterNonNullable } from "common/src/helpers";
import { ConfirmationDialog } from "common/src/components/ConfirmationDialog";
import {
  ApplicationRoundStatusChoice,
  type ApplicationRoundAdminFragment,
  useEndAllocationMutation,
  ApplicationRoundReservationCreationStatusChoice,
  type ApplicationRoundQuery,
  UserPermissionChoice,
  useSendResultsMutation,
} from "@gql/gql-types";
import { type ApolloQueryResult } from "@apollo/client";
import { useCheckPermission } from "@/hooks";
import { isApplicationRoundInProgress } from "@/helpers";
import { useDisplayError } from "common/src/hooks";

const StyledNotification = styled(Notification)`
  margin-right: auto;
  max-width: 852px;
`;

export function ReviewEndAllocation({
  applicationRound,
  refetch,
}: {
  applicationRound: ApplicationRoundAdminFragment;
  refetch: () => Promise<ApolloQueryResult<ApplicationRoundQuery>>;
}): JSX.Element {
  const [waitingForHandle, setWaitingForHandle] = useState(false);

  const isInProgress = isApplicationRoundInProgress(applicationRound);

  const { t } = useTranslation();

  const [mutation] = useEndAllocationMutation();
  const [sendResults] = useSendResultsMutation();
  const displayError = useDisplayError();

  const handleEndAllocation = async () => {
    try {
      const res = await mutation({
        variables: { pk: applicationRound.pk ?? 0 },
      });
      if (res.data?.setApplicationRoundHandled?.pk) {
        setWaitingForHandle(false);
      }
    } catch (err) {
      displayError(err);
    }
    // refetch even on errors (if somebody else has ended the allocation)
    refetch();
  };

  const handleSendResults = async () => {
    try {
      await sendResults({
        variables: { pk: applicationRound.pk ?? 0 },
      });
    } catch (err) {
      displayError(err);
    }
    refetch();
  };

  const hasFailed =
    applicationRound.reservationCreationStatus ===
    ApplicationRoundReservationCreationStatusChoice.Failed;

  const isHandled =
    applicationRound.status === ApplicationRoundStatusChoice.Handled;
  const isResultsSent =
    applicationRound.status === ApplicationRoundStatusChoice.ResultsSent;

  const showSendResults = isHandled && !isInProgress;
  // TODO futher work: (separate spec)
  // - what if results are sent? what should we show or not show?
  const modalTitle = showSendResults
    ? t("ApplicationRound.confirmation.sendResultsTitle")
    : t("ApplicationRound.confirmation.endAllocationTitle");
  const modalContent = showSendResults
    ? t("ApplicationRound.confirmation.sendResultsMessage")
    : t("ApplicationRound.confirmation.endAllocationMessage");
  const modalAcceptLabel = showSendResults
    ? t("ApplicationRound.confirmation.sendResultsAccept")
    : t("ApplicationRound.confirmation.endAllocationAccept");
  const moddalCancelLabel = t(
    "ApplicationRound.confirmation.endAllocationCancel"
  );

  // TODO add resultsSentBody
  // requires refoctoring this a bit so we don't do multiple ternaries
  const infoBody = showSendResults
    ? t("ApplicationRound.info.handledBody")
    : t("ApplicationRound.info.allocatedBody");
  const infoButton = hasFailed
    ? t("ApplicationRound.info.failedBtn")
    : showSendResults
      ? t("ApplicationRound.info.sendResultsBtn")
      : t("ApplicationRound.info.createBtn");

  const units = filterNonNullable(
    applicationRound.reservationUnits.flatMap((ru) => ru.unit?.pk)
  );
  const { hasPermission: canEndAllocation } = useCheckPermission({
    units,
    permission: UserPermissionChoice.CanManageApplications,
    requireAll: true,
  });

  return (
    <StyledNotification type={hasFailed ? "error" : "info"} label={infoBody}>
      <Button
        variant={isInProgress ? ButtonVariant.Clear : ButtonVariant.Primary}
        iconStart={isInProgress ? <LoadingSpinner small /> : undefined}
        onClick={() => setWaitingForHandle(true)}
        disabled={
          hasFailed || isResultsSent || !canEndAllocation || isInProgress
        }
      >
        {infoButton}
      </Button>
      {waitingForHandle && (
        <ConfirmationDialog
          isOpen={waitingForHandle}
          onAccept={showSendResults ? handleSendResults : handleEndAllocation}
          onCancel={() => setWaitingForHandle(false)}
          heading={modalTitle}
          content={modalContent}
          acceptLabel={modalAcceptLabel}
          cancelLabel={moddalCancelLabel}
        />
      )}
    </StyledNotification>
  );
}

export const END_ALLOCATION_MUTATION = gql`
  mutation EndAllocation($pk: Int!) {
    setApplicationRoundHandled(input: { pk: $pk }) {
      pk
    }
  }
`;

export const SEND_RESULTS_MUTATION = gql`
  mutation SendResults($pk: Int!) {
    setApplicationRoundResultsSent(input: { pk: $pk }) {
      pk
    }
  }
`;
