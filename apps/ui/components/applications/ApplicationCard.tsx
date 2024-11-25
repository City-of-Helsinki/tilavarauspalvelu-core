import React, { useState } from "react";
import { useTranslation, type TFunction } from "next-i18next";
import styled from "styled-components";
import {
  Button,
  IconArrowRight,
  IconCheck,
  IconCogwheel,
  IconCross,
  IconPen,
  IconQuestionCircle,
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
import StatusLabel from "common/src/components/StatusLabel";
import { type StatusLabelType } from "common/src/tags";
import { getApplicationPath } from "@/modules/urls";

const StyledButton = styled(Button).attrs({
  variant: "secondary",
  size: "small",
})`
  white-space: nowrap;

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

function getApplicationStatusLabelProps(
  status?: Maybe<ApplicationStatusChoice>
): { type: StatusLabelType; icon: JSX.Element } {
  switch (status) {
    case ApplicationStatusChoice.Draft:
      return {
        type: "draft",
        icon: <IconPen aria-hidden="true" />,
      };
    case ApplicationStatusChoice.ResultsSent:
      return {
        type: "success",
        icon: <IconCheck aria-hidden="true" />,
      };
    case ApplicationStatusChoice.Handled:
    case ApplicationStatusChoice.InAllocation:
    case ApplicationStatusChoice.Received:
      return {
        type: "info",
        icon: <IconCogwheel aria-hidden="true" />,
      };
    // These two should never be shown to the client, so they are shown as any other unexpected status
    case ApplicationStatusChoice.Cancelled:
    case ApplicationStatusChoice.Expired:
    default:
      return {
        type: "neutral",
        icon: <IconQuestionCircle aria-hidden="true" />,
      };
  }
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

  const labelProps = getApplicationStatusLabelProps(application.status);

  const tags = [
    <StatusLabel
      type={labelProps.type}
      icon={labelProps.icon}
      key="status-label"
    >
      {t(`applicationCard:status.${application.status}`)}
    </StatusLabel>,
  ];

  const buttons = [
    <StyledButton
      aria-label={t("applicationCard:cancel")}
      onClick={() => setIsWaitingForDelete(true)}
      isLoading={isLoading}
      disabled={!editable}
      iconRight={<IconCross aria-hidden="true" />}
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
      <IconPen aria-hidden="true" />
    </ButtonLikeLink>,
    <ButtonLikeLink
      href={getApplicationPath(application.pk, "view")}
      disabled={application.pk == null}
      key="view"
      width="full"
    >
      {t("applicationCard:view")}
      <IconArrowRight aria-hidden="true" />
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
