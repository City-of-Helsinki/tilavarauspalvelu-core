import { IconLocation } from "hds-react";
import React from "react";
import { H1 } from "common/src/common/typography";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { UnitByPkType } from "common/types/gql-types";
import { parseAddress } from "../../common/util";
import { Container, ContentContainer } from "../../styles/layout";
import LinkPrev from "../LinkPrev";

interface IProps {
  title: string;
  unit: UnitByPkType;
  link?: string;
  state?: JSX.Element | string;
}

const Wrapper = styled.div`
  margin-bottom: var(--spacing-m);
  max-width: var(--container-width-l);
`;
const Name = styled.div`
  font-size: var(--fontsize-heading-m);
  font-family: var(--tilavaraus-admin-font-bold);
  margin-bottom: var(--spacing-xs);
`;

const TitleRow = styled.div`
  display: flex;
  align-items: flex-start;
`;

const Address = styled.span`
  line-height: 26px;
`;

const LocationIcon = styled(IconLocation)`
  margin: 2px var(--spacing-s) 2px 0;
`;

const Label = styled(Address)`
  font-family: var(--tilavaraus-admin-font-bold);
`;

const SubPageHead = ({ title, unit, link, state }: IProps): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Wrapper>
      <ContentContainer>
        <LinkPrev route={link || `/unit/${unit.pk}`} />
      </ContentContainer>
      <ContentContainer>
        <Container>
          <TitleRow>
            <H1 style={{ flexGrow: 1 }} $legacy>
              {title}
            </H1>
            <div style={{ marginTop: "2em" }}>{state}</div>
          </TitleRow>
        </Container>
        <div style={{ display: "flex" }}>
          <LocationIcon />
          <div>
            <Name>{unit.nameFi}</Name>
            <Label>{t("Unit.address")}</Label>:{" "}
            {unit.location ? (
              <Address>{parseAddress(unit.location)}</Address>
            ) : null}
          </div>
        </div>
      </ContentContainer>
    </Wrapper>
  );
};

export default SubPageHead;
