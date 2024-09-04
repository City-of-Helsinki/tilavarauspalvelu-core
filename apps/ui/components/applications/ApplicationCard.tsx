import React, { useState } from "react";
import { useTranslation, type TFunction } from "next-i18next";
import styled from "styled-components";
import {
  Card as HdsCard,
  IconArrowRight,
  IconCheck,
  IconCogwheel,
  IconCross,
  IconEnvelope,
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
import { applicationUrl, formatDateTime } from "@/modules/util";
import { BlackButton } from "@/styles/util";
import { getApplicationRoundName } from "@/modules/applicationRound";
import { ButtonLikeLink } from "@/components/common/ButtonLikeLink";
import { ConfirmationDialog } from "common/src/components/ConfirmationDialog";
import StatusLabel, {
  type StatusLabelType,
} from "common/src/components/StatusLabel";

const Card = styled(HdsCard)`
  border-width: 0;
  padding-inline: var(--spacing-s);
  padding-block: var(--spacing-s);
  margin-bottom: var(--spacing-m);
  width: auto;
  grid-template-columns: 1fr;
  display: block;

  @media (min-width: ${breakpoints.m}) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-m);
  }
`;

const Buttons = styled.div`
  font-family: var(--font-medium);
  font-size: var(--fontsize-body-s);
  margin-top: var(--spacing-m);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);

  > * {
    flex-grow: 1;
    text-wrap: nowrap;
  }

  @media (width > ${breakpoints.s}) {
    flex-direction: row;
    gap: var(--spacing-s);
  }

  @media (width > ${breakpoints.m}) {
    flex-direction: column;
    align-items: flex-end;
    justify-content: flex-end;

    /* swapping flex-direction makes grow resize buttons vertically */
    > * {
      flex-grow: 0;
      width: 100%;
    }
  }

  @media (width > ${breakpoints.l}) {
    flex-direction: row;
  }
`;

const Applicant = styled.div`
  font-family: var(--font-regular);
  font-size: var(--fontsize-body-m);
  margin-top: var(--spacing-xs);
  margin-bottom: var(--spacing-s);
  padding-right: var(--spacing-m);
`;

const RoundName = styled.div`
  margin-top: var(--spacing-xs);
  font-size: var(--fontsize-heading-m);
  font-family: var(--font-bold);
  margin-bottom: 0;

  @media (max-width: ${breakpoints.s}) {
    font-size: var(--fontsize-heading-m);
  }
`;

const Modified = styled.div`
  font-size: var(--fontsize-body-m);
  font-family: var(--font-regular);
  color: var(--color-black-70);
  margin-top: var(--spacing-l);

  @media (min-width: ${breakpoints.s}) {
    margin-top: var(--spacing-xl);
  }
`;

const StyledButton = styled(BlackButton).attrs({
  variant: "secondary",
  size: "small",
})`
  white-space: nowrap;

  svg {
    min-width: 24px;
  }

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
        icon: <IconPen ariaHidden />,
      };
    case ApplicationStatusChoice.ResultsSent:
      return {
        type: "success",
        icon: <IconCheck ariaHidden />,
      };
    case ApplicationStatusChoice.InAllocation:
    case ApplicationStatusChoice.Handled:
      return {
        type: "info",
        icon: <IconCogwheel ariaHidden />,
      };
    case ApplicationStatusChoice.Received:
      return {
        type: "alert",
        icon: <IconEnvelope ariaHidden />,
      };
    // These two should never be shown to the client, so they are shown as any other unexpected status
    case ApplicationStatusChoice.Cancelled:
    case ApplicationStatusChoice.Expired:
    default:
      return {
        type: "neutral",
        icon: <IconQuestionCircle ariaHidden />,
      };
  }
}

function ApplicationCard({ application, actionCallback }: Props): JSX.Element {
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

  return (
    <Card border key={application.pk} data-testid="applications__card--wrapper">
      <div>
        <StatusLabel type={labelProps.type} icon={labelProps.icon}>
          {t(`applicationCard:status.${application.status}`)}
        </StatusLabel>
        <RoundName>{getApplicationRoundName(applicationRound)}</RoundName>
        <Applicant>
          {application.applicantType != null
            ? getApplicant(application, t)
            : ""}
        </Applicant>
        <Modified>
          {t("applicationCard:saved")}{" "}
          {formatDateTime(t, new Date(application.lastModifiedDate))}
        </Modified>
      </div>
      <Buttons>
        <StyledButton
          aria-label={t("applicationCard:cancel")}
          onClick={() => setIsWaitingForDelete(true)}
          isLoading={isLoading}
          disabled={!editable}
          iconRight={<IconCross aria-hidden />}
        >
          {t("applicationCard:cancel")}
        </StyledButton>
        <ButtonLikeLink
          disabled={!editable || application.pk == null || isLoading}
          href={
            editable && application.pk != null
              ? `${applicationUrl(application.pk ?? 0)}/page1`
              : ""
          }
          fontSize="small"
        >
          {t("applicationCard:edit")}
          <IconPen aria-hidden />
        </ButtonLikeLink>
        <ButtonLikeLink
          href={
            application.pk != null
              ? `${applicationUrl(application.pk ?? 0)}/view`
              : ""
          }
          disabled={application.pk == null}
          fontSize="small"
        >
          {t("applicationCard:view")}
          <IconArrowRight aria-hidden />
        </ButtonLikeLink>
      </Buttons>
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

export default ApplicationCard;
