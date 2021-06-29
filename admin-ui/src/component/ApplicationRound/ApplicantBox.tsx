import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Application as ApplicationType } from "../../common/types";
import { H2 } from "../../styles/typography";
import { BasicLink, StatusDot } from "../../styles/util";
import { ReactComponent as IconCustomers } from "../../images/icon_customers.svg";

interface IProps {
  application: ApplicationType;
  type?: string;
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

const Status = styled.div`
  display: flex;
  align-content: center;
  position: relative;
  left: -1.75rem;
  margin-top: var(--spacing-xl);

  a {
    text-decoration: underline;
  }

  ${StatusDot} {
    margin-right: var(--spacing-xs);
  }
`;

function ApplicantBox({ application, type }: IProps): JSX.Element {
  const { t } = useTranslation();

  const contactPerson = `${application?.contactPerson?.firstName || ""} ${
    application?.contactPerson?.lastName || ""
  }`.trim();

  const applicantType = type || application.applicantType;

  let details;
  switch (applicantType) {
    case "individual":
      details = (
        <>
          <Heading>{application.applicantName}</Heading>
          {t("Application.applicantType")}:{" "}
          {t(`Application.applicantTypes.individual`)}
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
