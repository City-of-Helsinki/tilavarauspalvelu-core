import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { IconGroup, Notification } from "hds-react";
import styled from "styled-components";
import { AxiosError } from "axios";
import trim from "lodash/trim";
import sortBy from "lodash/sortBy";
import { ContentContainer, IngressContainer } from "../../styles/layout";
import withMainMenu from "../withMainMenu";
import { H1, H2, H3 } from "../../styles/typography";
import {
  getApplicationRound,
  getParameters,
  getReservationUnits,
} from "../../common/api";
import {
  ApplicationRound as ApplicationRoundType,
  Parameter,
  ReservationUnit as ReservationUnitType,
} from "../../common/types";
import Loader from "../Loader";
import LinkPrev from "../LinkPrev";
import TimeframeStatus from "./TimeframeStatus";
import { breakpoints, Strong } from "../../styles/util";
import { ReactComponent as RecurringReservationIcon } from "../../images/icon_recurring-reservation.svg";
import Accordion from "../Accordion";
import { formatDate, localizedValue, parseAgeGroups } from "../../common/util";
import i18n from "../../i18n";

interface IRouteParams {
  applicationRoundId: string;
}

const Wrapper = styled.div`
  width: 100%;
`;

const Title = styled(H1)`
  margin: var(--spacing-layout-xl) 0 var(--spacing-layout-xl);
`;

const Details = styled.div`
  max-width: ${breakpoints.l};

  > div {
    &.block {
      @media (min-width: ${breakpoints.l}) {
        display: block;
      }
    }

    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    margin-bottom: var(--spacing-m);

    ${Strong} {
      font-size: var(--fontsize-heading-xs);
    }
  }

  @media (min-width: ${breakpoints.l}) {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-m);
    padding-left: var(--spacing-layout-m);
  }
`;

const ReservationUnitCount = styled(H2).attrs({
  as: "div",
})`
  margin-bottom: var(--spacing-3-xs);
`;

const StyledAccordion = styled(Accordion).attrs({
  style: {
    "--header-font-size": "var(--fontsize-heading-m)",
  } as React.CSSProperties,
})`
  h2.heading {
    padding: 0 var(--spacing-m);
  }
`;

const AccordionContent = styled.div`
  @media (min-width: ${breakpoints.m}) {
    padding-left: var(--spacing-layout-xl);
  }
`;

const TitleBox = styled.div`
  ${H3} {
    margin-bottom: var(--spacing-2-xs);
  }

  div {
    margin-bottom: var(--spacing-2-xs);
  }

  margin-bottom: var(--spacing-layout-l);
`;

const BasketWrapper = styled.div`
  max-width: ${breakpoints.l};
`;

const BasketHeading = styled.div`
  ${Strong} {
    margin-right: var(--spacing-l);
  }

  position: relative;
  font-size: var(--fontsize-heading-xs);

  svg {
    position: absolute;
    left: -5rem;
  }
`;

const BasketTitle = styled.span`
  font-weight: 400;
  font-family: var(--tilavaraus-admin-font);
`;

const Basket = styled.div`
  margin-bottom: var(--spacing-xl);

  span {
    margin-bottom: var(--spacing-2-xs);

    &:nth-of-type(even) {
      margin-bottom: var(--spacing-xs);
    }

    display: block;
    padding-left: var(--spacing-m);
  }

  @media (min-width: ${breakpoints.m}) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-l);

    span {
      margin: 0 !important;
    }
  }
`;

const ReservationUnits = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  font-size: var(--fontsize-heading-xs);

  @media (min-width: ${breakpoints.m}) {
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-l);
  }
`;

const ReservationUnit = styled.div`
  margin-bottom: var(--spacing-3-xl);

  div {
    margin-bottom: var(--spacing-2-xs);
  }
`;

function Criteria(): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [applicationRound, setApplicationRound] =
    useState<ApplicationRoundType | null>(null);
  const [ageGroups, setAgeGroups] = useState<Parameter[] | null>(null);
  const [purposes, setPurposes] = useState<Parameter[] | null>(null);
  const [cities, setCities] = useState<Parameter[] | null>(null);
  const [reservationUnits, setReservationUnits] = useState<
    ReservationUnitType[] | null
  >(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const applicationRoundId = Number(
    useParams<IRouteParams>().applicationRoundId
  );
  const { t } = useTranslation();

  useEffect(() => {
    const fetchParameters = async () => {
      try {
        const ageGroupsResult = await getParameters("age_group");
        const purposesResult = await getParameters("purpose");
        const citiesResult = await getParameters("city");

        setAgeGroups(ageGroupsResult);
        setPurposes(purposesResult);
        setCities(citiesResult);

        setIsLoading(false);
      } catch (error) {
        const msg = "errors.errorFetchingData";
        setErrorMsg(msg);
        setIsLoading(false);
      }
    };

    fetchParameters();
  }, []);

  useEffect(() => {
    const fetchApplicationRound = async () => {
      setErrorMsg(null);
      setIsLoading(true);

      try {
        const result = await getApplicationRound({
          id: applicationRoundId,
        });
        setApplicationRound(result);
        setIsLoading(false);
      } catch (error) {
        const msg =
          (error as AxiosError).response?.status === 404
            ? "errors.applicationRoundNotFound"
            : "errors.errorFetchingData";
        setErrorMsg(msg);
        setIsLoading(false);
      }
    };

    fetchApplicationRound();
  }, [applicationRoundId]);

  useEffect(() => {
    const fetchReservationUnits = async () => {
      setErrorMsg(null);
      setIsLoading(true);

      try {
        const result = applicationRound
          ? await getReservationUnits({
              applicationRound: applicationRound.id,
            })
          : null;
        setReservationUnits(result);
        setIsLoading(false);
      } catch (error) {
        const msg = "errors.errorFetchingData";
        setErrorMsg(msg);
        setIsLoading(false);
      }
    };

    fetchReservationUnits();
  }, [applicationRound]);

  const baskets = sortBy(
    applicationRound?.applicationRoundBaskets,
    "orderNumber"
  );

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Wrapper>
      {applicationRound && ageGroups && purposes && cities && reservationUnits && (
        <>
          <ContentContainer>
            <LinkPrev />
          </ContentContainer>
          <IngressContainer>
            <Title>{applicationRound.name}</Title>
            <Details>
              <div>
                <TimeframeStatus
                  applicationPeriodBegin={
                    applicationRound.applicationPeriodBegin
                  }
                  applicationPeriodEnd={applicationRound.applicationPeriodEnd}
                />
              </div>
              <div>
                <RecurringReservationIcon aria-hidden />{" "}
                <Strong>{t("HeadingMenu.recurringReservations")}</Strong>
              </div>
              <div className="block">
                <ReservationUnitCount>
                  {applicationRound.reservationUnitIds.length}
                </ReservationUnitCount>
                <div>{t("ApplicationRound.attachedReservationUnits")}</div>
              </div>
            </Details>
          </IngressContainer>
          <ContentContainer>
            <StyledAccordion
              heading={t("ApplicationRound.searchAndUsageTimeRanges")}
              defaultOpen
            >
              <AccordionContent>
                <TitleBox>
                  <H3>{t("ApplicationRound.applicationPeriodTitle")}</H3>
                  <div>
                    {t("common.begins")}{" "}
                    {formatDate(applicationRound.applicationPeriodBegin)}
                  </div>
                  <div>
                    {t("common.ends")}{" "}
                    {formatDate(applicationRound.applicationPeriodEnd)}
                  </div>
                </TitleBox>
                <TitleBox>
                  <H3>{t("ApplicationRound.reservationPeriodTitle")}</H3>
                  <div>
                    {t("common.begins")}{" "}
                    {formatDate(applicationRound.reservationPeriodBegin)}
                  </div>
                  <div>
                    {t("common.ends")}{" "}
                    {formatDate(applicationRound.reservationPeriodEnd)}
                  </div>
                </TitleBox>
              </AccordionContent>
            </StyledAccordion>
            <StyledAccordion
              heading={t("ApplicationRound.summaryOfCriteriaAndBaskets")}
              defaultOpen
            >
              <AccordionContent>
                <H3>{t("ApplicationRound.preferredAllocationGroups")}</H3>
                {baskets.length < 1
                  ? "-"
                  : baskets.map((basket) => {
                      const getPurposesStr = (): string => {
                        let result = "";
                        basket.purposeIds.forEach((pId: number): void => {
                          const purpose = purposes.find((n) => n.id === pId);
                          result += purpose ? `${purpose.name}, ` : "";
                        });
                        return result ? trim(result, ", ") : "-";
                      };

                      const getCustomerTypeStr = (): string => {
                        let result = "";
                        basket.customerType.forEach((type: string): void => {
                          result += `${t(
                            `Application.applicantTypes.${type}`
                          )}, `;
                        });
                        return result ? trim(result, ", ") : "-";
                      };

                      const getAgeGroupsStr = (): string => {
                        let result = "";
                        basket.ageGroupIds.forEach((aId: number): void => {
                          const ageGroup = ageGroups.find((n) => n.id === aId);
                          result += ageGroup
                            ? `${parseAgeGroups(ageGroup)}, `
                            : "";
                        });

                        return result ? trim(result, ", ") : "-";
                      };

                      const getCityStr = (): string | undefined => {
                        const city = cities.find(
                          (n) => n.id === basket.homeCityId
                        );
                        return city ? city.name : "-";
                      };

                      return (
                        <BasketWrapper key={basket.name}>
                          <Accordion
                            defaultOpen
                            heading={
                              <BasketHeading>
                                <IconGroup aria-hidden />
                                <Strong>{basket.orderNumber}.</Strong>
                                <BasketTitle>{basket.name}</BasketTitle>
                              </BasketHeading>
                            }
                          >
                            <Basket>
                              <Strong>{t("Basket.purpose")}</Strong>
                              <span>{getPurposesStr()}</span>
                              <Strong>{t("Basket.customerType")}</Strong>
                              <span>{getCustomerTypeStr()}</span>
                              <Strong>{t("Basket.ageGroup")}</Strong>
                              <span>{getAgeGroupsStr()}</span>
                              <Strong>{t("Basket.homeCity")}</Strong>
                              <span>{getCityStr()}</span>
                            </Basket>
                          </Accordion>
                        </BasketWrapper>
                      );
                    })}
              </AccordionContent>
            </StyledAccordion>
            <StyledAccordion
              heading={t("ApplicationRound.usedReservationUnits")}
              defaultOpen
            >
              <AccordionContent>
                <ReservationUnits>
                  {reservationUnits?.map((reservationUnit) => {
                    const getSpaceNames = (ru: ReservationUnitType): string => {
                      let result = "";
                      ru.spaces.forEach((space) => {
                        const name = localizedValue(space.name, i18n.language);
                        result += `${name}, `;
                      });

                      return result ? trim(result, ", ") : "-";
                    };

                    return (
                      <ReservationUnit key={reservationUnit.id}>
                        <div>
                          <Strong>
                            {localizedValue(
                              reservationUnit.unit?.name.fi,
                              i18n.language
                            )}
                          </Strong>
                        </div>
                        <div>{getSpaceNames(reservationUnit)}</div>
                      </ReservationUnit>
                    );
                  })}
                </ReservationUnits>
              </AccordionContent>
            </StyledAccordion>
          </ContentContainer>
        </>
      )}
      {errorMsg && (
        <Notification
          type="error"
          label={t("errors.functionFailed")}
          position="top-center"
          autoClose={false}
          dismissible
          closeButtonLabelText={t("common.close")}
          displayAutoCloseProgress={false}
          onClose={() => setErrorMsg(null)}
        >
          {t(errorMsg)}
        </Notification>
      )}
    </Wrapper>
  );
}

export default withMainMenu(Criteria);
