import { IconLocation } from "hds-react";
import React from "react";
import { H1, fontMedium } from "common/src/common/typography";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { type UnitWithSpacesAndResourcesQuery } from "@gql/gql-types";
import { parseAddress } from "../../common/util";

// TODO should use a fragment that is shared by both UnitQuery and UnitWithSpacesAndResourcesQuery
type UnitType = NonNullable<UnitWithSpacesAndResourcesQuery["unit"]>;
interface IProps {
  title: string;
  unit: UnitType;
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-m);
`;

const Name = styled.div`
  font-size: var(--fontsize-heading-s);
  ${fontMedium}
`;

const Address = styled.span`
  line-height: 26px;
`;

const LocationIcon = styled(IconLocation)`
  margin: 2px var(--spacing-s) 2px 0;
`;

const Label = styled(Address)`
  ${fontMedium}
`;

const AddressSection = styled.div`
  display: flex;
  align-items: center;
`;

export function SubPageHead({ title, unit }: IProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Wrapper>
      <H1 style={{ flexGrow: 1, margin: 0 }} $legacy>
        {title}
      </H1>
      <AddressSection>
        <LocationIcon />
        <div>
          <Name>{unit?.nameFi}</Name>
          <Label>{t("Unit.address")}</Label>:{" "}
          {unit?.location ? (
            <Address>{parseAddress(unit.location)}</Address>
          ) : null}
        </div>
      </AddressSection>
    </Wrapper>
  );
}
