import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { BasicLink, breakpoints } from "../../styles/util";

interface IProps {
  applicationRoundId: string;
}

const Wrapper = styled.div`
  font-size: var(--fontsize-body-s);
  margin-top: var(--spacing-m);

  @media (min-width: ${breakpoints.l}) {
    display: flex;
    justify-content: flex-end;
  }
`;

const NaviItem = styled(BasicLink)`
  &:first-of-type {
    margin-left: 0;
  }

  margin-left: 2rem;
`;

function ApplicationRoundNavi({ applicationRoundId }: IProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Wrapper>
      <NaviItem to="#">{t("Application.showAllApplications")} TODO</NaviItem>
      <NaviItem to={`/applicationRound/${applicationRoundId}/criteria`}>
        {t("ApplicationRound.roundCriteria")} TODO
      </NaviItem>
    </Wrapper>
  );
}

export default ApplicationRoundNavi;
