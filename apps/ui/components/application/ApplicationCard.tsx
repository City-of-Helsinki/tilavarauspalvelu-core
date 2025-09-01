import React, { useState } from "react";
import { type TFunction, useTranslation } from "next-i18next";
import styled from "styled-components";
import { Button, ButtonSize, ButtonVariant, IconArrowRight, IconCross, IconPen, LoadingSpinner } from "hds-react";
import { breakpoints } from "common/src/const";
import {
  type ApplicationCardFragment,
  type ApplicationNameFragment,
  ApplicationStatusChoice,
  type Maybe,
  useCancelApplicationMutation,
} from "@gql/gql-types";
import { formatDateTime, toValidDateObject } from "common/src/date-utils";
import { getApplicationRoundName } from "@/modules/applicationRound";
import { ButtonLikeLink } from "@/components/common/ButtonLikeLink";
import { ConfirmationDialog } from "common/src/components/ConfirmationDialog";
import Card from "common/src/components/Card";
import { getApplicationPath } from "@/modules/urls";
import { ApplicationStatusLabel } from "common/src/components/statuses";
import { gql } from "@apollo/client";
import { convertLanguageCode } from "common/src/common/util";

const StyledButton = styled(Button)`
  @media (max-width: ${breakpoints.s}) {
    width: 100%;
  }
`;

function formatApplicant(
  t: TFunction,
  application: Pick<ApplicationNameFragment, "organisationName" | "applicantType" | "contactPersonFirstName">
): string {
  const type = formatApplicantType(t, application);
  if (application.organisationName) {
    return `${type}: ${application.organisationName}`;
  }

  return type;
}

function formatApplicantType(t: TFunction, application: Pick<ApplicationNameFragment, "applicantType">): string {
  const { applicantType } = application;
  if (!applicantType) {
    return "";
  }
  return t(`reservationApplication:reserveeTypes.labels.${applicantType}`);
}

function isEditable(status: Maybe<ApplicationStatusChoice> | undefined): boolean {
  if (status === ApplicationStatusChoice.Draft) {
    return true;
  }
  return status === ApplicationStatusChoice.Received;
}

type Props = {
  application: ApplicationCardFragment;
  // TODO refactor the action callback (it's not a good idea in general, but especially error callback)
  actionCallback: (string: "error" | "cancel") => Promise<void>;
};

export function ApplicationCard({ application, actionCallback }: Props): JSX.Element {
  const { t, i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);

  const [isWaitingForDelete, setIsWaitingForDelete] = useState(false);

  const [mutation, { loading: isLoading }] = useCancelApplicationMutation({
    variables: {
      input: {
        pk: application.pk ?? 0,
      },
    },
  });

  const cancel = async () => {
    try {
      await mutation();
      setIsWaitingForDelete(false);
      actionCallback("cancel");
    } catch (_) {
      actionCallback("error");
    }
  };

  const editable = isEditable(application.status);

  const tags = [<ApplicationStatusLabel status={application.status} user="customer" key="status" />];

  const buttons = [
    <StyledButton
      onClick={() => setIsWaitingForDelete(true)}
      size={ButtonSize.Small}
      variant={isLoading ? ButtonVariant.Clear : ButtonVariant.Secondary}
      iconEnd={isLoading ? <LoadingSpinner small /> : <IconCross />}
      disabled={!editable || isLoading}
      key="cancel"
    >
      {t("applicationCard:cancel")}
    </StyledButton>,
    <ButtonLikeLink
      disabled={!editable || application.pk == null || isLoading}
      href={editable ? getApplicationPath(application.pk, "page1") : ""}
      key="edit"
      width="full"
    >
      {t("applicationCard:edit")}
      <IconPen />
    </ButtonLikeLink>,
    <ButtonLikeLink
      href={getApplicationPath(application.pk, "view")}
      disabled={application.pk == null}
      key="view"
      width="full"
    >
      {t("applicationCard:view")}
      <IconArrowRight />
    </ButtonLikeLink>,
  ];

  return (
    <Card
      heading={getApplicationRoundName(application.applicationRound, lang)}
      headingLevel={3}
      text={formatApplicant(t, application)}
      tags={tags}
      buttons={buttons}
    >
      <br />
      {t("applicationCard:saved")} {formatDateTime(toValidDateObject(application.updatedAt), { locale: lang })}
      {isWaitingForDelete && (
        <ConfirmationDialog
          isOpen
          id="application-card-modal"
          heading={t("applicationCard:cancelHeading")}
          content={t("applicationCard:cancelContent")}
          onAccept={cancel}
          onCancel={() => setIsWaitingForDelete(false)}
          cancelLabel={t("common:close")}
          acceptLabel={t("common:ok")}
          variant="danger"
        />
      )}
    </Card>
  );
}

export const APPLICATION_CARD_FRAGMENT = gql`
  fragment ApplicationCard on ApplicationNode {
    id
    pk
    ...ApplicationName
    status
    updatedAt
    applicationRound {
      id
      nameFi
      nameEn
      nameSv
    }
  }
`;

export const CANCEL_APPLICATION_MUTATION = gql`
  mutation CancelApplication($input: ApplicationCancelMutationInput!) {
    cancelApplication(input: $input) {
      pk
    }
  }
`;
