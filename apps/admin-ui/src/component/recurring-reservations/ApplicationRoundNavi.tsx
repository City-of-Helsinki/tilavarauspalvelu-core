import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { ApplicationRoundStatus } from "../../common/types";
import {
  applicationRoundApplications,
  applicationRoundUrl,
} from "../../common/urls";
import { BasicLink } from "../../styles/util";

interface IProps {
  applicationRoundId: number;
  applicationRoundStatus?: ApplicationRoundStatus;
  hideAllApplications?: boolean;
}

const Wrapper = styled.div`
  font-size: var(--fontsize-body-s);
  margin-top: var(--spacing-m);

  @media (min-width: ${breakpoints.l}) {
    display: flex;
    justify-content: flex-end;
  }
`;

export const NaviItem = styled(BasicLink)`
  &:first-of-type {
    margin-left: 0;
  }

  margin-left: 2rem;
`;

function ApplicationRoundNavi({
  applicationRoundId,
  hideAllApplications,
  applicationRoundStatus,
}: IProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Wrapper>
      {applicationRoundStatus &&
        ["approved"].includes(applicationRoundStatus) && (
          <NaviItem
            to={`${applicationRoundUrl(applicationRoundId)}/resolution`}
          >
            {t("Application.showResolutions")}
          </NaviItem>
        )}
      {!hideAllApplications && (
        <NaviItem to={applicationRoundApplications(applicationRoundId)}>
          {t("Application.showAllApplications")}
        </NaviItem>
      )}
      <NaviItem to={`${applicationRoundUrl(applicationRoundId)}/criteria`}>
        {t("ApplicationRound.roundCriteria")}
      </NaviItem>
    </Wrapper>
  );
}

export default ApplicationRoundNavi;
