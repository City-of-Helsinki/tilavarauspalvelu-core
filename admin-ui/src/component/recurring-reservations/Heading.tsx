import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { BasicLink, breakpoints } from "../../styles/util";
import { H3 } from "../../styles/typography";
import SecondaryNavigation from "../SecondaryNavigation";
import { ReactComponent as IconList } from "../../images/icon_list.svg";
import { prefixes } from "../../common/urls";

interface IProps {
  hideAllRoundsLink?: boolean;
}

const Wrapper = styled.div`
  padding: var(--spacing-m) var(--spacing-m) 0 var(--spacing-m);
  border-bottom: 1px solid var(--color-silver);
`;

const Top = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const Subheading = styled(H3)`
  margin-top: var(--spacing-4-xs);
`;

const Bottom = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  padding-bottom: var(--spacing-m);

  @media (min-width: ${breakpoints.m}) {
    flex-wrap: nowrap;
  }
`;

function Heading({ hideAllRoundsLink }: IProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Wrapper>
      <Top>
        <Subheading>{t("common.youthServices")}</Subheading>
      </Top>
      <Bottom>
        <SecondaryNavigation items={[]} />
        {!hideAllRoundsLink && (
          <BasicLink
            to={`${prefixes.recurringReservations}/application-rounds`}
          >
            <IconList style={{ marginTop: "-2px" }} />{" "}
            {t("ApplicationRound.browseAllApplicationRounds")}
          </BasicLink>
        )}
      </Bottom>
    </Wrapper>
  );
}

export default Heading;
