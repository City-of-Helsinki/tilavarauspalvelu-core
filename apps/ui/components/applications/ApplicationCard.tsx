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
import { breakpoints } from "common/src/common/style";
import {
  ApplicantTypeChoice,
  ApplicationStatusChoice,
  type Maybe,
  useCancelApplicationMutation,
  type ApplicationsQuery,
} from "@gql/gql-types";
import { formatDateTime } from "@/modules/util";
import { getApplicationRoundName } from "@/modules/applicationRound";
import { ButtonLikeLink } from "@/components/common/ButtonLikeLink";
import { ConfirmationDialog } from "common/src/components/ConfirmationDialog";
import Card from "common/src/components/Card";
import { getApplicationPath } from "@/modules/urls";
import { ApplicationStatusLabel } from "common/src/components/statuses";

const StyledButton = styled(Button)`
  @media (max-width: ${breakpoints.s}) {
    width: 100%;
  }
`;

type ApplicationType = NonNullable<
  NonNullable<
    NonNullable<ApplicationsQuery["applications"]>["edges"][0]
  >["node"]
>;
type Props = {
  application: ApplicationType;
  // TODO refactor the action callback (it's not a good idea in general, but especially error callback)
  actionCallback: (string: "error" | "cancel") => Promise<void>;
};

// TODO should use a name fragment
function getApplicant(application: ApplicationType, t: TFunction): string {
  if (application.applicantType === ApplicantTypeChoice.Individual) {
    return t("applicationCard:person");
  }
  if (application.organisation) {
    return t("applicationCard:organisation", {
      type: t(
        `applicationCard:applicantType.${application.applicantType?.toLocaleLowerCase()}`
      ),
      name: application.organisation?.nameFi || t("applicationCard:noName"),
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

export function ApplicationCard({
  application,
  actionCallback,
}: Props): JSX.Element {
  const { t } = useTranslation();
  const [isWaitingForDelete, setIsWaitingForDelete] = useState(false);

  const [mutation, { loading: isLoading }] = useCancelApplicationMutation({
    variables: {
      input: {
        pk: application.pk ?? 0,
      },
    },
    onCompleted: () => {
      actionCallback("cancel");
    },
    onError: () => {
      actionCallback("error");
    },
  });

  const cancel = async () => {
    await mutation();
    setIsWaitingForDelete(false);
  };

  const { applicationRound } = application;

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
      heading={getApplicationRoundName(applicationRound)}
      headingLevel={3}
      text={
        application.applicantType != null ? getApplicant(application, t) : ""
      }
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
