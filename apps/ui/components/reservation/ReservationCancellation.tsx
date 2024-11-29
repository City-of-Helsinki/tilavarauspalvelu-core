import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useForm } from "react-hook-form";
import { Button, IconArrowRight, IconCross, IconSignout } from "hds-react";
import { useTranslation } from "next-i18next";
import { fontMedium, H1 } from "common/src/common/typography";
import {
  useCancelReservationMutation,
  type ReservationQuery,
  type ReservationCancelReasonsQuery,
} from "@gql/gql-types";
import { IconButton } from "common/src/components";
import Sanitize from "../common/Sanitize";
import { getTranslation } from "@/modules/util";
import { ReservationInfoCard } from "./ReservationInfoCard";
import { signOut } from "common/src/browserHelpers";
import { ReservationPageWrapper } from "../reservations/styles";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";
import { errorToast } from "common/src/common/toast";
import { ControlledSelect } from "common/src/components/form";
import { AutoGrid, ButtonContainer, Flex } from "common/styles/util";
import { ButtonLikeLink } from "../common/ButtonLikeLink";
import { getReservationPath } from "@/modules/urls";
import TermsBox from "common/src/termsbox/TermsBox";
import { AccordionWithState } from "../Accordion";
import { breakpoints } from "common";

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

const Actions = styled(ButtonContainer).attrs({
  $justifyContent: "space-between",
})`
  grid-column: 1 / -1;
`;

const Form = styled.form`
  label {
    ${fontMedium};
  }
`;

function ReturnLinkList({ apiBaseUrl }: { apiBaseUrl: string }): JSX.Element {
  const { t } = useTranslation();
  return (
    <Flex $gap="none" $alignItems="flex-start">
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
    </Flex>
  );
}

type FormValues = {
  reason: number;
  description?: string;
};

const StyledInfoCard = styled(ReservationInfoCard)`
  @media (min-width: ${breakpoints.m}) {
    grid-row: 1 / span 2;
    grid-column: -1;
  }
`;

const Wrapper = styled(Flex)`
  @media (min-width: ${breakpoints.m}) {
    grid-row: 2 / -1;
    grid-column: 1 / span 2;
  }
`;

const TitleSection = styled.div`
  @media (min-width: ${breakpoints.m}) {
    grid-column: 1 / span 2;
  }
`;

export function ReservationCancellation(props: Props): JSX.Element {
  const { t, i18n } = useTranslation();
  const { apiBaseUrl } = props;

  const [isSuccess, setIsSuccess] = useState(false);

  const lang = convertLanguageCode(i18n.language);
  const reasons = props.reasons.map((node) => ({
    label: getTranslationSafe(node, "reason", lang),
    value: node?.pk ?? 0,
  }));

  const [cancelReservation, { loading }] = useCancelReservationMutation();

  const form = useForm<FormValues>();
  const { register, handleSubmit, watch, control } = form;

  useEffect(() => {
    register("reason", { required: true });
    register("description");
  }, [register]);

  const { reservation } = props;

  const reservationUnit = reservation?.reservationUnits?.[0] ?? null;
  const instructions = reservationUnit
    ? getTranslationSafe(
        reservationUnit,
        "reservationCancelledInstructions",
        lang
      )
    : null;

  const onSubmit = (formData: FormValues) => {
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
      // TODO redirect to a success page (or back to the reservation page with a toast is preferable)
      setIsSuccess(true);
      window.scrollTo(0, 0);
    } catch (e) {
      errorToast({
        text: t("reservations:reservationCancellationFailed"),
      });
    }
  };

  const title = !isSuccess
    ? t("reservations:cancelReservation")
    : t("reservations:reservationCancelledTitle");
  const ingress = !isSuccess
    ? t("reservations:cancelReservationBody")
    : t("reservations:reservationCancelledBody");

  const cancellationTerms =
    reservationUnit.cancellationTerms != null
      ? getTranslation(reservationUnit?.cancellationTerms, "text")
      : null;

  // TODO check that the reservation hasn't been cancelled already

  return (
    <ReservationPageWrapper>
      <TitleSection>
        <H1 $noMargin>{title}</H1>
        <p>{ingress}</p>
      </TitleSection>
      <StyledInfoCard reservation={reservation} type="confirmed" />
      <Wrapper>
        {!isSuccess ? (
          <>
            <p style={{ margin: 0 }}>{t("reservations:cancelInfoBody")}</p>
            {cancellationTerms != null && (
              <AccordionWithState
                heading={t("reservationUnit:cancellationTerms")}
                disableBottomMargin
              >
                <TermsBox body={<Sanitize html={cancellationTerms ?? ""} />} />
              </AccordionWithState>
            )}
            <Form onSubmit={handleSubmit(onSubmit)}>
              <AutoGrid>
                <ControlledSelect
                  name="reason"
                  control={control}
                  label={t("reservations:cancelReason")}
                  options={reasons}
                  required
                />
                <Actions>
                  <ButtonLikeLink
                    data-testid="reservation-cancel__button--back"
                    href={getReservationPath(reservation.pk)}
                  >
                    <IconCross aria-hidden="true" />
                    {t("reservations:cancelReservationCancellation")}
                  </ButtonLikeLink>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={!watch("reason")}
                    data-testid="reservation-cancel__button--cancel"
                    isLoading={loading}
                  >
                    {t("reservations:cancelReservation")}
                  </Button>
                </Actions>
              </AutoGrid>
            </Form>
          </>
        ) : (
          <>
            {isSuccess && instructions && <p>{instructions}</p>}
            <ReturnLinkList apiBaseUrl={apiBaseUrl} />
          </>
        )}
      </Wrapper>
    </ReservationPageWrapper>
  );
}
