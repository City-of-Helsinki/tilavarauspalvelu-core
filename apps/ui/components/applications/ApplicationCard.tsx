import React, { useState } from "react";
import { useTranslation, type TFunction } from "next-i18next";
import styled from "styled-components";
import {
  Button,
  ButtonSize,
  ButtonVariant,
  IconArrowRight,
  IconCross,
  IconPen,
  LoadingSpinner,
} from "hds-react";
import { breakpoints } from "common/src/const";
import {
  ApplicantTypeChoice,
  ApplicationStatusChoice,
  type Maybe,
  useCancelApplicationMutation,
  type ApplicationNameFragment,
  type ApplicationCardFragment,
} from "@gql/gql-types";
import { formatDateTime } from "@/modules/util";
import { ButtonLikeLink } from "@/components/common/ButtonLikeLink";
import { ConfirmationDialog } from "common/src/components/ConfirmationDialog";
import Card from "common/src/components/Card";
import { getApplicationPath } from "@/modules/urls";
import { ApplicationStatusLabel } from "common/src/components/statuses";
import { gql } from "@apollo/client";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";

const StyledButton = styled(Button)`
  @media (max-width: ${breakpoints.s}) {
    width: 100%;
  }
`;

function getApplicant(
  application: ApplicationNameFragment,
  t: TFunction
): string {
  if (application.applicantType === ApplicantTypeChoice.Individual) {
    return t("applicationCard:person");
  }
  if (application.organisation) {
    return t("applicationCard:organisation", {
      type: t(
        `applicationCard:applicantType.${application.applicantType?.toLocaleLowerCase()}`
      ),
      name:
        application.organisation?.nameTranslations.fi ||
        t("applicationCard:noName"),
    });
  }
  if (application.contactPerson) {
    return t("applicationCard:person");
  }

  return "";
}

function isEditable(
  status: Maybe<ApplicationStatusChoice> | undefined
): boolean {
  if (status === ApplicationStatusChoice.Draft) {
    return true;
  }
  if (status === ApplicationStatusChoice.Received) {
    return true;
  }
  return false;
}

type Props = {
  application: ApplicationCardFragment;
  // TODO refactor the action callback (it's not a good idea in general, but especially error callback)
  actionCallback: (string: "error" | "cancel") => Promise<void>;
};

export function ApplicationCard({
  application,
  actionCallback,
}: Props): JSX.Element {
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

  const tags = [
    <ApplicationStatusLabel
      status={application.status}
      user="customer"
      key="status"
    />,
  ];

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
      heading={getTranslationSafe(
        application.applicationRound.nameTranslations,
        lang
      )}
      headingLevel={3}
      text={getApplicant(application, t)}
      tags={tags}
      buttons={buttons}
    >
      <br />
      {t("applicationCard:saved")}{" "}
      {formatDateTime(t, new Date(application.lastModifiedDate))}
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
    lastModifiedDate
    applicationRound {
      id
      nameTranslations {
        fi
        en
        sv
      }
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
