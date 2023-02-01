import {
  IconCalendar,
  IconDownload,
  IconMenuHamburger,
  Notification,
} from "hds-react";
import React, { useState } from "react";
import { useTranslation, TFunction } from "next-i18next";
import styled from "styled-components";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { GetServerSideProps } from "next";
import { Application, RecurringReservation } from "common/types/common";
import { breakpoints } from "common/src/common/style";
import {
  getApplication,
  getApplicationRound,
  getRecurringReservations,
} from "../../modules/api";
import { ApiData, useApiData } from "../../hooks/useApiData";
import { SubHeading } from "../../modules/style/typography";
import { parseDate } from "../../modules/util";
import Back from "../../components/common/Back";
import Loader from "../../components/common/Loader";
import { TwoColumnContainer } from "../../components/common/common";
import { isBrowser } from "../../modules/const";
import { MediumButton } from "../../styles/util";
import RequireAuthentication from "../../components/common/RequireAuthentication";

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale)),
    },
  };
};

const Container = styled.div`
  padding: var(--spacing-l) var(--spacing-m) var(--spacing-m);
  max-width: var(--container-width-xl);
  margin: 0 auto var(--spacing-2-xl) auto;
  height: 100%;

  @media (max-width: ${breakpoints.m}) {
    padding: var(--spacing-s);
  }
`;

const RoundName = styled.div`
  font-size: var(--fontsize-heading-xl);
  font-family: var(--font-bold);

  @media (max-width: ${breakpoints.s}) {
    font-size: var(--fontsize-heading-l);
  }
`;

const ResolutionDescription = styled.div`
  margin-top: var(--spacing-s);
  font-family: var(--font-regular);
  font-size: var(--fontsize-body-l);
`;

const Applicant = styled.div`
  font-family: var(--font-regular);
  font-size: var(--fontsize-body-m);
  margin-top: var(--spacing-xs);
  margin-bottom: var(--spacing-s);
`;

const Modified = styled.div`
  font-size: var(--fontsize-body-m);
  font-family: var(--font-regular);
`;

const Buttons = styled.div`
  justify-self: end;

  @media (max-width: ${breakpoints.s}) {
    width: 100%;
  }
`;
const ToggleButton = styled(MediumButton)`
  margin-top: var(--spacing-m);

  @media (max-width: ${breakpoints.s}) {
    width: 100%;
  }
`;

const getApplicant = (application: Application, t: TFunction): string => {
  if (application?.organisation) {
    return t("applicationCard:organisation", {
      type: t(`applicationCard:applicantType.${application.applicantType}`),
      name: application.organisation?.name || t("applicationCard:noName"),
    });
  }
  if (application?.contactPerson) {
    return t("applicationCard:person");
  }

  return "";
};

const modified = (
  application: ApiData<Application, unknown>,
  t: TFunction
): JSX.Element => {
  return (
    <Modified>
      {application.data?.lastModifiedDate
        ? t("applicationCard:saved", {
            date: parseDate(application.data?.lastModifiedDate),
          })
        : ""}
    </Modified>
  );
};

const Reservations = (): JSX.Element | null => {
  const router = useRouter();
  const { applicationId } = router.query;

  const [isCalendar, setIsCalendar] = useState(false);
  const [status, setStatus] = useState<"init" | "loading" | "done" | "error">(
    "init"
  );

  const { t } = useTranslation();

  const application = useApiData(getApplication, Number(applicationId));

  const applicationRound = useApiData(
    getApplicationRound,
    application.data ? { id: application.data.applicationRoundId } : undefined
  );

  const reservations = useApiData(
    getRecurringReservations,
    Number(applicationId)
  );

  if (!isBrowser) return null;

  const hasReservations = reservations.data?.length;

  const reservationsResultText = t(
    hasReservations
      ? "reservations:resultWithReservations"
      : "reservations:resultWithoutReservations"
  );
  return (
    <RequireAuthentication>
      <Container>
        <Back label="reservations:back" />
        <Loader datas={[application, applicationRound, reservations]}>
          <RoundName>{applicationRound.data?.name}</RoundName>
          <Applicant>
            {getApplicant(application.data as Application, t)}
          </Applicant>
          {modified(application, t)}
          <TwoColumnContainer>
            <div>
              <SubHeading>{t("reservations:titleResolution")}</SubHeading>
              <ResolutionDescription>
                {reservationsResultText}
              </ResolutionDescription>

              {status === "error" ? (
                <Notification
                  type="error"
                  label={t("reservations:errorGeneratingPDF")}
                  position="top-center"
                  displayAutoCloseProgress={false}
                  autoClose
                  onClose={() => setStatus("done")}
                >
                  {t("reservations:errorGeneratingPDF")}
                </Notification>
              ) : (
                <ToggleButton
                  theme="black"
                  variant="secondary"
                  iconLeft={<IconDownload />}
                  isLoading={status === "loading"}
                  loadingText={t("reservations:generating")}
                  onClick={() => {
                    setStatus("loading");
                    setTimeout(() => {
                      import("../../components/pdf/util").then(
                        ({ download }) => {
                          download(
                            application.data as Application,
                            reservations.data as RecurringReservation[],
                            applicationRound.data?.approvedBy || null,
                            setStatus
                          );
                        }
                      );
                    }, 0);
                  }}
                >
                  {t("reservations:download")}
                </ToggleButton>
              )}
            </div>
            {hasReservations ? (
              <Buttons>
                <ToggleButton
                  theme="black"
                  aria-pressed={isCalendar}
                  variant={(isCalendar && "secondary") || "primary"}
                  iconLeft={<IconMenuHamburger />}
                  onClick={() => setIsCalendar(false)}
                >
                  {t("reservations:showList")}
                </ToggleButton>
                <ToggleButton
                  theme="black"
                  variant={(isCalendar && "primary") || "secondary"}
                  aria-pressed={!isCalendar}
                  onClick={() => setIsCalendar(true)}
                  iconLeft={<IconCalendar />}
                >
                  {t("reservations:showCalendar")}
                </ToggleButton>
              </Buttons>
            ) : null}
          </TwoColumnContainer>
        </Loader>
      </Container>
    </RequireAuthentication>
  );
};

export default Reservations;
