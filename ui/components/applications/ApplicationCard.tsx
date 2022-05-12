import React, { useRef, useState } from "react";
import { useTranslation, TFunction } from "react-i18next";
import styled from "styled-components";
import { useRouter } from "next/router";
import { Card as HdsCard, Notification, Tag as HdsTag } from "hds-react";
import { parseISO } from "date-fns";
import { Application } from "../../modules/types";
import {
  isActive,
  applicationUrl,
  getReducedApplicationStatus,
  getTranslation,
} from "../../modules/util";
import { breakpoint } from "../../modules/style";
import ConfirmationModal, { ModalRef } from "../common/ConfirmationModal";
import { CenterSpinner } from "../common/common";
import { cancelApplication } from "../../modules/api";
import { MediumButton } from "../../styles/util";
import { ApplicationRoundType } from "../../modules/gql-types";

const Card = styled(HdsCard).attrs({
  style: {
    "--border-width": 0,
    "--padding-vertical": "var(--spacing-s)",
    "--padding-horizontal": "var(--spacing-s)",
  },
})`
  margin-bottom: var(--spacing-m);
  width: auto;
  grid-template-columns: 1fr;
  display: block;

  @media (min-width: ${breakpoint.m}) {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: var(--spacing-m);
  }
`;

const Tag = styled(HdsTag)`
  && {
    color: var(--color-white);
    background-color: var(--tilavaraus-blue);
    font-family: var(--font-regular);
  }
`;

const GreenTag = styled(Tag)`
  && {
    background-color: var(--tilavaraus-green);
  }
`;

const YellowTag = styled(Tag)`
  && {
    background-color: var(--tilavaraus-yellow);
    color: var(--color-black);
  }
`;

const Buttons = styled.div`
  font-family: var(--font-medium);
  font-size: var(--fontsize-body-s);
  margin-top: var(--spacing-m);
  display: flex;
  flex-direction: column-reverse;
  gap: var(--spacing-xs);

  @media (min-width: ${breakpoint.s}) {
    flex-direction: row;
    gap: var(--spacing-s);
  }

  @media (min-width: ${breakpoint.m}) {
    align-items: flex-end;
    justify-content: flex-end;
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

  @media (max-width: ${breakpoint.s}) {
    font-size: var(--fontsize-heading-m);
  }
`;

const Modified = styled.div`
  font-size: var(--fontsize-body-m);
  font-family: var(--font-regular);
  color: var(--color-black-70);
  margin-top: var(--spacing-l);

  @media (min-width: ${breakpoint.s}) {
    margin-top: var(--spacing-xl);
  }
`;

const StyledButton = styled(MediumButton)`
  white-space: nowrap;

  @media (max-width: ${breakpoint.s}) {
    width: 100%;
  }
`;
type Props = {
  application: Application;
  applicationRound: ApplicationRoundType;
};

const getApplicant = (application: Application, t: TFunction): string => {
  if (application.organisation) {
    return t("applicationCard:organisation", {
      type: t(`applicationCard:applicantType.${application.applicantType}`),
      name: application.organisation?.name || t("applicationCard:noName"),
    });
  }
  if (application.contactPerson) {
    return t("applicationCard:person");
  }

  return "";
};

const ApplicationCard = ({
  application,
  applicationRound,
}: Props): JSX.Element | null => {
  const [state, setState] = useState<"ok" | "cancelling" | "error">("ok");
  const { t } = useTranslation();
  const router = useRouter();
  const editable = isActive(
    applicationRound?.applicationPeriodBegin,
    applicationRound?.applicationPeriodEnd
  );

  const reducedApplicationStatus = getReducedApplicationStatus(
    application.status
  );

  let C = Tag;
  if (reducedApplicationStatus === "draft") {
    C = YellowTag;
  }
  if (reducedApplicationStatus === "sent") {
    C = GreenTag;
  }

  const cancel = async () => {
    setState("cancelling");
    try {
      await cancelApplication(application.id as number);
      router.reload();
    } catch (e) {
      setState("error");
    }
  };

  const modal = useRef<ModalRef>();
  return (
    <Card border key={application.id}>
      <div>
        <C>{t(`applicationCard:status.${reducedApplicationStatus}`)}</C>
        <RoundName>{getTranslation(applicationRound, "name")}</RoundName>
        <Applicant>
          {application.applicantType !== null
            ? getApplicant(application, t)
            : ""}
        </Applicant>
        <Modified>
          {application.lastModifiedDate
            ? t("applicationCard:saved", {
                date: parseISO(application.lastModifiedDate),
              })
            : ""}
        </Modified>
        {state === "error" ? (
          <Notification size="small">
            {t("applicationCard:cancelFailed")}
          </Notification>
        ) : null}
      </div>
      <Buttons>
        {state === "cancelling" ? (
          <CenterSpinner />
        ) : (
          editable && (
            <StyledButton
              aria-label={t("applicationCard:cancel")}
              onClick={() => {
                modal?.current?.open();
              }}
              variant="secondary"
            >
              {t("applicationCard:cancel")}
            </StyledButton>
          )
        )}
        <StyledButton
          aria-label={t("applicationCard:edit")}
          disabled={!editable}
          onClick={() => {
            router.push(`${applicationUrl(application.id as number)}/page1`);
          }}
          variant="primary"
        >
          {t("applicationCard:edit")}
        </StyledButton>
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
};

export default ApplicationCard;
