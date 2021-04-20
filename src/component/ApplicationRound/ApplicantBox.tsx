import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Application as ApplicationType } from "../../common/types";
import { formatNumber } from "../../common/util";
import { H2 } from "../../styles/typography";
import { BasicLink, StatusDot, Strong } from "../../styles/util";
import { ReactComponent as IconCustomers } from "../../images/icon_customers.svg";

interface IProps {
  application: ApplicationType;
}

const Wrapper = styled.div`
  padding: var(--spacing-xl) var(--spacing-xl) var(--spacing-xl)
    var(--spacing-m);
  background-color: #f0f1f4;
  display: grid;
  grid-template-columns: 44px auto;
  grid-gap: 1.25rem;
`;

const IconWrapper = styled.div`
  background-color: var(--color-white);
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  svg {
    transform: scale(1.1);
  }
`;

const Heading = styled(H2)`
  font-size: 1.375rem;
  margin: var(--spacing-2-xs) 0 var(--spacing-m);
`;

const P = styled.div`
  margin: var(--spacing-2-xs) 0 0;
  line-height: var(--lineheight-s);
`;

const Members = styled.div`
  margin: var(--spacing-m) 0;
  line-height: var(--lineheight-l);
`;

const Status = styled.div`
  display: flex;
  align-content: center;
  position: relative;
  left: -1.75rem;
  margin-top: var(--spacing-s);

  a {
    text-decoration: underline;
  }

  ${StatusDot} {
    margin-right: var(--spacing-xs);
  }
`;

function ApplicantBox({ application }: IProps): JSX.Element {
  const { t } = useTranslation();

  const contactPerson = `${application?.contactPerson?.firstName || ""} ${
    application?.contactPerson?.lastName || ""
  }`.trim();

  let details;
  switch (application.applicantType) {
    case "individual":
      details = (
        <>
          <Heading>{contactPerson}</Heading>
          {t("Application.applicantType")}:{" "}
          {t(`Application.applicantTypes.${application.applicantType}`)}
          <P>
            {t("Application.contactPerson")}: {contactPerson}
          </P>
        </>
      );
      break;
    default:
      details = (
        <>
          <Heading>{application?.organisation?.name}</Heading>
          {t("Application.applicantType")}:{" "}
          {t(`Application.applicantTypes.${application.applicantType}`)}
          <P>
            {t("Application.contactPerson")}: {contactPerson}
          </P>
          {application?.organisation?.activeMembers && (
            <Members>
              <div>
                <Strong>{t("Organisation.activeParticipants")}</Strong>
              </div>
              <div>
                {formatNumber(
                  application?.organisation?.activeMembers,
                  t("common.volumeUnit")
                )}
              </div>
            </Members>
          )}
        </>
      );
  }
  return (
    <Wrapper>
      <IconWrapper>
        <IconCustomers />
      </IconWrapper>
      <div>
        {details}
        <Status>
          <StatusDot status="review_done" size={16} />
          <BasicLink to={`/application/${application.id}`}>
            {t("Applicant.inAllocation")}
          </BasicLink>
        </Status>
      </div>
    </Wrapper>
  );
}

export default ApplicantBox;
