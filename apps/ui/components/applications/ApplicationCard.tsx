import React, { useRef } from "react";
import { useTranslation, type TFunction } from "next-i18next";
import styled from "styled-components";
import {
  Card as HdsCard,
  IconArrowRight,
  IconCross,
  IconPen,
  Tag as HdsTag,
} from "hds-react";
import { parseISO } from "date-fns";
import { useMutation } from "@apollo/client";
import { breakpoints } from "common/src/common/style";
import {
  type Mutation,
  type ApplicationNode,
  type MutationCancelApplicationArgs,
  ApplicantTypeChoice,
  ApplicationStatusChoice,
  Maybe,
} from "common/types/gql-types";
import { applicationUrl } from "@/modules/util";
import { BlackButton } from "@/styles/util";
import { getApplicationRoundName } from "@/modules/applicationRound";
import { CANCEL_APPLICATION_MUTATION } from "@/modules/queries/application";
import ConfirmationModal, {
  ModalRef,
} from "@/components/common/ConfirmationModal";
import { ButtonLikeLink } from "@/components/common/ButtonLikeLink";
import ClientOnly from "common/src/ClientOnly";

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

const Tag = styled(HdsTag)<{ $style: "normal" | "yellow" | "green" }>`
  && {
    color: ${({ $style }) =>
      $style === "yellow" ? "var(--color-black)" : "var(--color-white)"};
    background-color: ${({ $style }) =>
      $style === "green"
        ? "var(--tilavaraus-green)"
        : $style === "yellow"
          ? "var(--tilavaraus-yellow)"
          : "var(--tilavaraus-blue)"};
    font-family: var(--font-regular);
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

type Props = {
  application: ApplicationNode;
  // TODO refactor the action callback (it's not a good idea in general, but especially error callback)
  actionCallback: (string: "error" | "cancel") => Promise<void>;
};

function getApplicant(application: ApplicationNode, t: TFunction): string {
  if (application.applicantType === ApplicantTypeChoice.Individual) {
    return t("applicationCard:person");
  }
  if (application.organisation) {
    return t("applicationCard:organisation", {
      type: t(
        `applicationCard:applicantType.${application.applicantType?.toLocaleLowerCase()}`
      ),
      name: application.organisation?.name || t("applicationCard:noName"),
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

function getApplicationStatusColour(
  status?: Maybe<ApplicationStatusChoice>
): "normal" | "yellow" | "green" {
  switch (status) {
    case ApplicationStatusChoice.ResultsSent:
      return "green";
    case ApplicationStatusChoice.InAllocation:
    case ApplicationStatusChoice.Handled:
      return "normal";
    case ApplicationStatusChoice.Received:
      return "green";
    case ApplicationStatusChoice.Cancelled:
    case ApplicationStatusChoice.Expired:
    case ApplicationStatusChoice.Draft:
      return "yellow";
    default:
      return "normal";
  }
}

function ApplicationCard({ application, actionCallback }: Props): JSX.Element {
  const { t } = useTranslation();
  const modal = useRef<ModalRef>();

  const [mutation, { loading: isLoading }] = useMutation<
    Mutation,
    MutationCancelApplicationArgs
  >(CANCEL_APPLICATION_MUTATION, {
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

  const cancel = () => {
    mutation();
  };

  const { applicationRound } = application;

  const editable = isEditable(application.status);

  const style = getApplicationStatusColour(application.status);

  return (
    <Card border key={application.pk} data-testid="applications__card--wrapper">
      <div>
        <Tag $style={style}>
          {t(`applicationCard:status.${application.status}`)}
        </Tag>
        <RoundName>{getApplicationRoundName(applicationRound)}</RoundName>
        <Applicant>
          {application.applicantType != null
            ? getApplicant(application, t)
            : ""}
        </Applicant>
        {/* Causes hydration mismatch */}
        <ClientOnly>
          <Modified>
            {application.lastModifiedDate
              ? t("applicationCard:saved", {
                  date: parseISO(application.lastModifiedDate),
                })
              : ""}
          </Modified>
        </ClientOnly>
      </div>
      <Buttons>
        <StyledButton
          aria-label={t("applicationCard:cancel")}
          onClick={() => {
            // TODO modal.open scrolls the page to the top
            modal?.current?.open();
          }}
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
      <ConfirmationModal
        id="application-card-modal"
        heading={t("applicationCard:cancelHeading")}
        content={t("applicationCard:cancelContent")}
        ref={modal}
        onOk={cancel}
        cancelLabel={t("common:close")}
      />
    </Card>
  );
}

export default ApplicationCard;
