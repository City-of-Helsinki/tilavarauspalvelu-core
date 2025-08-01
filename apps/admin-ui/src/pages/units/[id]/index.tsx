import { Button, ButtonVariant, IconPlusCircleFill, Notification, NotificationSize } from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { UserPermissionChoice, useUnitPageQuery } from "@gql/gql-types";
import { formatAddress } from "@/common/util";
import { ExternalLink } from "@/component/ExternalLink";
import { base64encode, filterNonNullable, ignoreMaybeArray, toNumber } from "common/src/helpers";
import { Error404 } from "@/component/Error404";
import { ReservationUnitList } from "@lib/units/[id]/ReservationUnitList";
import { getReservationUnitUrl, getSpacesResourcesUrl } from "@/common/urls";
import { CenterSpinner, Flex, fontBold, fontMedium, H1, H2, H3 } from "common/styled";
import { gql } from "@apollo/client";
import Link from "next/link";
import { useRouter } from "next/router";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { AuthorizationChecker } from "@/component/AuthorizationChecker";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { type GetServerSidePropsContext } from "next";
import { PUBLIC_URL, NOT_FOUND_SSR_VALUE } from "@/common/const";

const Image = styled.img`
  clip-path: circle(50% at 50% 50%);
  width: 9rem;
  height: 9rem;
`;
const Heading = styled.div`
  flex-grow: 1;
`;

const Address = styled.div<{ $disabled?: boolean }>`
  font-size: var(--fontsize-body-s);
  line-height: 26px;
  ${fontMedium};

  ${({ $disabled }) => $disabled && "opacity: 0.4;"}
`;

const ResourceUnitCount = styled.div`
  ${fontBold};
  padding: var(--spacing-s) 0;
  font-size: var(--fontsize-heading-xs);
`;

const StyledBoldButton = styled(Button)`
  ${fontBold};
  span {
    color: var(--color-black);
  }
`;

const EmptyContainer = styled(Flex).attrs({
  $alignItems: "center",
  $justifyContent: "center",
})`
  background-color: var(--color-silver-medium-light);
  min-height: 20rem;
`;

function Unit({ unitPk }: { unitPk: number }): JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();

  const typename = "UnitNode";
  const id = base64encode(`${typename}:${unitPk}`);
  const { data, loading: isLoading } = useUnitPageQuery({
    variables: { id },
    fetchPolicy: "network-only",
  });

  const { unit } = data ?? {};
  const hasSpacesResources = Boolean(unit?.spaces?.length);

  if (isLoading) {
    return <CenterSpinner />;
  }

  // TODO separate invalid route and no unit found errors
  if (!unit) {
    return <Error404 />;
  }

  const reservationUnits = filterNonNullable(unit.reservationUnits);

  const UNIT_REGISTRY_LINK = `https://asiointi.hel.fi/tprperhe/TPR/UI/ServicePoint/ServicePointEdit/`;
  const address = formatAddress(unit, "");

  return (
    <>
      <Flex $direction="row" $alignItems="center">
        <Image src={`${PUBLIC_URL}/images/unit-placeholder.jpg`} />
        <Heading>
          <H1 $noMargin>{unit?.nameFi}</H1>
          {address !== "" ? <Address>{address}</Address> : <Address $disabled>{t("unit:noAddress")}</Address>}
        </Heading>
        <Link href={getSpacesResourcesUrl(unitPk)}>{t("unit:showSpacesAndResources")}</Link>
      </Flex>
      {!hasSpacesResources ? (
        <Notification type="alert" label={t("unit:noSpacesResourcesTitle")} size={NotificationSize.Large}>
          {t("unit:noSpacesResources")} <Link href={getSpacesResourcesUrl(unitPk)}>{t("unit:createSpaces")}</Link>
        </Notification>
      ) : null}
      <ExternalLink href={`${UNIT_REGISTRY_LINK}${unit.tprekId}`}>{t("unit:maintainOpeningHours")}</ExternalLink>
      <H2 $noMargin>{t("unit:reservationUnitTitle")}</H2>
      <Flex $direction="row" $justifyContent="space-between">
        {reservationUnits.length > 0 ? (
          <ResourceUnitCount>
            {t("unit:reservationUnits", {
              count: reservationUnits.length,
            })}
          </ResourceUnitCount>
        ) : (
          <div />
        )}
        <StyledBoldButton
          disabled={!hasSpacesResources}
          variant={ButtonVariant.Supplementary}
          iconStart={<IconPlusCircleFill />}
          onClick={() => {
            router.push(getReservationUnitUrl(null, unitPk));
          }}
        >
          {t("unit:reservationUnitCreate")}
        </StyledBoldButton>
      </Flex>
      {reservationUnits.length > 0 ? (
        <ReservationUnitList reservationUnits={reservationUnits} unitId={unitPk ?? 0} />
      ) : (
        <EmptyContainer>
          <H3 as="p">{t("unit:noReservationUnitsTitle")}</H3>
        </EmptyContainer>
      )}
    </>
  );
}

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<PageProps, { notFound: boolean }>;
export default function Page(props: PropsNarrowed): JSX.Element {
  return (
    <AuthorizationChecker apiUrl={props.apiBaseUrl} permission={UserPermissionChoice.CanManageReservationUnits}>
      <Unit unitPk={props.pk} />
    </AuthorizationChecker>
  );
}

export async function getServerSideProps({ locale, query }: GetServerSidePropsContext) {
  const pk = toNumber(ignoreMaybeArray(query.id));

  if (pk == null || pk <= 0) {
    return NOT_FOUND_SSR_VALUE;
  }

  return {
    props: {
      pk,
      ...(await getCommonServerSideProps()),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export const UNIT_PAGE_QUERY = gql`
  query UnitPage($id: ID!) {
    unit(id: $id) {
      id
      pk
      nameFi
      tprekId
      shortDescriptionFi
      reservationUnits {
        ...ReservationUnitCard
      }
      ...NewResourceUnitFields
    }
  }
`;
