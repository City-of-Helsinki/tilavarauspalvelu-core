import { IconGroup, IconLocation } from "hds-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { UnitType } from "../../../common/gql-types";
import { parseAddress } from "../../../common/util";
import { ContentContainer, IngressContainer } from "../../../styles/layout";
import LinkPrev from "../../LinkPrev";

interface IProps {
  title: string;
  unit: UnitType;
  maxPersons?: number;
  surfaceArea?: number;
}

const Wrapper = styled.div`
  margin-bottom: var(--spacing-m);
`;
const Name = styled.div`
  font-size: var(--fontsize-heading-l);
  font-family: var(--tilavaraus-admin-font-bold);
  margin-bottom: var(--spacing-xs);
`;

const Address = styled.div`
  font-size: var(--fontsize-body-s);
  line-height: 26px;
`;

const Ingress = styled.div`
  display: flex;
  gap: var(--spacing-m);
`;

const Props = styled.div`
  padding: var(--spacing-xs) 0;
  grid-template-columns: 1fr 1fr;

  @media (min-width: ${breakpoints.s}) {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: var(--spacing-m);
  }
`;

const Prop = styled.div<{ $disabled: boolean }>`
  display: flex;
  align-items: center;
  gap: var(--spacing-2-xs);
  font-family: var(--tilavaraus-admin-font-medium);
  font-weight: 500;
  margin-bottom: var(--spacing-xs);

  ${({ $disabled }) => $disabled && "opacity: 0.4;"}
`;

const Head = ({
  title,
  unit,
  surfaceArea,
  maxPersons,
}: IProps): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Wrapper>
      <ContentContainer>
        <LinkPrev route={`/unit/${unit?.pk}`} />
      </ContentContainer>
      <IngressContainer>
        <Ingress>
          <div>
            <Name>{title}</Name>
            <Address>
              {unit?.location
                ? parseAddress(unit?.location)
                : t("SpaceEditor.noAddress")}
            </Address>
            <Props>
              <Prop $disabled={!unit}>
                <IconLocation />{" "}
                {unit ? (
                  <Link to={`/unit/${unit?.pk}`}>{unit?.nameFi}</Link>
                ) : (
                  t("SpaceEditor.noUnit")
                )}
              </Prop>
              <Prop $disabled={!maxPersons}>
                <IconGroup /> {maxPersons || t("SpaceEditor.noMaxPersons")}
              </Prop>
              <Prop $disabled={!surfaceArea}>
                {`${
                  surfaceArea
                    ? t("SpaceEditor.area", { surfaceArea })
                    : t("SpaceEditor.noSurfaceArea")
                }`}
              </Prop>
            </Props>
          </div>
        </Ingress>
      </IngressContainer>
    </Wrapper>
  );
};

export default Head;
