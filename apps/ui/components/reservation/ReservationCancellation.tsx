import React, { useEffect, useState } from "react";
import styled from "styled-components";
import router from "next/router";
import { Controller, useForm } from "react-hook-form";
import { IconArrowRight, IconCross, IconSignout, Select } from "hds-react";
import { useTranslation } from "next-i18next";
import { OptionType } from "common/types/common";
import { breakpoints } from "common/src/common/style";
import NotificationBox from "common/src/common/NotificationBox";
import { fontMedium } from "common/src/common/typography";
import {
  useCancelReservationMutation,
  type ReservationQuery,
  type ReservationCancelReasonsQuery,
} from "@gql/gql-types";
import { IconButton, ShowAllContainer } from "common/src/components";
import Sanitize from "../common/Sanitize";
import { getSelectedOption, getTranslation } from "@/modules/util";
import { BlackButton, MediumButton, Toast } from "@/styles/util";
import { ReservationInfoCard } from "./ReservationInfoCard";
import { Paragraph } from "./styles";
import { signOut } from "common/src/browserHelpers";
import {
  BylineSection,
  Heading,
  HeadingSection,
  ReservationPageWrapper,
} from "../reservations/styles";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";

type CancelReasonsQ = NonNullable<
  ReservationCancelReasonsQuery["reservationCancelReasons"]
>;
type CancelReasonsEdge = NonNullable<CancelReasonsQ["edges"]>;
type CancelReasonsNode = NonNullable<
  NonNullable<CancelReasonsEdge[number]>["node"]
>;
type NodeT = ReservationQuery["reservation"];
type Props = {
  apiBaseUrl: string;
  reasons: CancelReasonsNode[];
  reservation: NonNullable<NodeT>;
};

const TermsContainer = styled(ShowAllContainer)`
  .ShowAllContainer__ToggleButton {
    color: var(--color-bus);
  }
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-m);
  margin-top: var(--spacing-xl);
  justify-content: space-between;

  @media (min-width: ${breakpoints.s}) {
    flex-direction: row;

    button {
      max-width: 300px;
    }
  }
`;

const ContentSection = styled.div`
  grid-column: 1 / -1;
  grid-row: 3 / -1;

  @media (min-width: ${breakpoints.l}) {
    grid-column: 1 / span 4;
    grid-row: 2 / -1;
  }
`;

const Form = styled.form`
  margin-top: var(--spacing-m);

  label {
    ${fontMedium};
  }
`;

const StyledSelect = styled(Select<OptionType>)`
  margin-bottom: var(--spacing-l);

  @media (min-width: ${breakpoints.l}) {
    width: 50%;
  }
`;

const ReturnLinkContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-top: var(--spacing-3-xl);
`;

function ReturnLinkList({ apiBaseUrl }: { apiBaseUrl: string }): JSX.Element {
  const { t } = useTranslation();
  return (
    <ReturnLinkContainer>
      <IconButton
        href="/reservations"
        label={t("reservations:gotoReservations")}
        icon={<IconArrowRight aria-hidden />}
      />
      <IconButton
        href="/"
        label={t("common:gotoFrontpage")}
        icon={<IconArrowRight aria-hidden />}
      />
      <IconButton
        icon={<IconSignout aria-hidden />}
        onClick={() => signOut(apiBaseUrl)}
        label={t("common:logout")}
      />
    </ReturnLinkContainer>
  );
}

// TODO there is also pages/reservation/cancel.tsx (what is that?)
export function ReservationCancellation(props: Props): JSX.Element {
  const { t, i18n } = useTranslation();
  const { apiBaseUrl } = props;

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formState, setFormState] = useState<"unsent" | "sent">("unsent");

  const lang = convertLanguageCode(i18n.language);
  const reasons = props.reasons.map((node) => ({
    label: getTranslationSafe(node, "reason", lang),
    value: node?.pk ?? 0,
  }));

  const [cancelReservation, { loading }] = useCancelReservationMutation();

  const { register, handleSubmit, getValues, setValue, watch, control } =
    useForm();

  useEffect(() => {
    register("reason", { required: true });
    register("description");
  }, [register]);

  const { reservation } = props;

  const reservationUnit = reservation?.reservationUnit?.[0] ?? null;
  const instructions = reservationUnit
    ? getTranslationSafe(
        reservationUnit,
        "reservationCancelledInstructions",
        lang
      )
    : null;

  const onSubmit = (formData: { reason?: number; description?: string }) => {
    if (!reservation.pk || !formData.reason) {
      return;
    }
    const { reason, description } = formData;
    try {
      cancelReservation({
        variables: {
          input: {
            pk: reservation.pk,
            cancelReason: reason,
            cancelDetails: description,
          },
        },
      });
      setFormState("sent");
      // TODO Why?
      window.scrollTo(0, 0);
    } catch (e) {
      setErrorMsg(t("reservations:reservationCancellationFailed"));
    }
  };

  const title =
    formState === "unsent"
      ? t("reservations:cancelReservation")
      : t("reservations:reservationCancelledTitle");
  const ingress =
    formState === "unsent"
      ? t("reservations:cancelReservationBody")
      : t("reservations:reservationCancelledBody");

  const cancellationTerms =
    reservationUnit?.cancellationTerms != null
      ? getTranslation(reservationUnit?.cancellationTerms, "text")
      : null;

  return (
    <>
      <ReservationPageWrapper>
        <HeadingSection>
          <Heading>{title}</Heading>
          <p>{ingress}</p>
        </HeadingSection>
        <BylineSection>
          <ReservationInfoCard reservation={reservation} type="confirmed" />
        </BylineSection>
        <ContentSection>
          {formState === "unsent" ? (
            <>
              <p>{t("reservations:cancelInfoBody")}</p>
              <TermsContainer
                showAllLabel={t("reservations:showCancellationTerms")}
                showLessLabel={t("reservations:hideCancellationTerms")}
                maximumNumber={0}
              >
                {cancellationTerms != null && (
                  <NotificationBox
                    heading={t("reservationUnit:cancellationTerms")}
                    body={<Sanitize html={cancellationTerms} />}
                  />
                )}
              </TermsContainer>
              <Form onSubmit={handleSubmit(onSubmit)}>
                <Controller
                  name="reason"
                  control={control}
                  render={() => (
                    <StyledSelect
                      id="reservation__button--cancel-reason"
                      label={t("reservations:cancelReason")}
                      onChange={(val: OptionType) => {
                        setValue("reason", val.value);
                      }}
                      options={[...reasons]}
                      placeholder={t("common:select")}
                      value={getSelectedOption(getValues("reason"), reasons)}
                      required
                    />
                  )}
                />
                <Actions>
                  <BlackButton
                    variant="secondary"
                    iconLeft={<IconCross aria-hidden />}
                    onClick={() => router.back()}
                    data-testid="reservation-cancel__button--back"
                  >
                    {t("reservations:cancelReservationCancellation")}
                  </BlackButton>
                  <MediumButton
                    variant="primary"
                    type="submit"
                    disabled={!watch("reason")}
                    data-testid="reservation-cancel__button--cancel"
                    isLoading={loading}
                  >
                    {t("reservations:cancelReservation")}
                  </MediumButton>
                </Actions>
              </Form>
            </>
          ) : (
            <>
              {formState === "sent" && instructions && (
                <Paragraph style={{ margin: "var(--spacing-xl) 0" }}>
                  {instructions}
                </Paragraph>
              )}
              <ReturnLinkList apiBaseUrl={apiBaseUrl} />
            </>
          )}
        </ContentSection>
      </ReservationPageWrapper>
      {errorMsg && (
        <Toast
          type="error"
          label={t("common:error.error")}
          position="top-center"
          autoClose={false}
          displayAutoCloseProgress={false}
          onClose={() => setErrorMsg(null)}
          dismissible
          closeButtonLabelText={t("common:error.closeErrorMsg")}
        >
          {errorMsg}
        </Toast>
      )}
    </>
  );
}
