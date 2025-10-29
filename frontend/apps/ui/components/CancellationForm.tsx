import React from "react";
import styled from "styled-components";
import { useForm } from "react-hook-form";
import { Button, ButtonVariant, IconCross, LoadingSpinner } from "hds-react";
import { useTranslation } from "next-i18next";
import { AutoGrid, ButtonContainer, Flex, fontMedium } from "common/src/styled";
import { breakpoints } from "common/src/modules/const";
import { ControlledSelect } from "common/src/components/form";
import { ReservationCancelReasonChoice } from "@gql/gql-types";
import { ButtonLikeLink } from "common/src/components/ButtonLikeLink";
import TermsBox from "common/src/components/TermsBox";
import { AccordionWithState } from "./Accordion";
import { Sanitize } from "common/src/components/Sanitize";

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

export type CancelFormValues = {
  reason: ReservationCancelReasonChoice;
};

const FormWrapper = styled(Flex)`
  @media (min-width: ${breakpoints.m}) {
    grid-row: 2 / -1;
    grid-column: 1;
  }
`;

export function CancellationForm(props: {
  onNext: (values: CancelFormValues) => void;
  cancellationTerms: string | null;
  backLink: string;
  isLoading?: boolean;
  isDisabled?: boolean;
}): JSX.Element {
  const { onNext, isLoading, isDisabled, cancellationTerms, backLink } = props;
  const { t } = useTranslation();

  const reasons = Object.values(ReservationCancelReasonChoice)
    .map((r) => ({
      label: t(`reservations:cancel.reasons.${r}`),
      value: r,
    }))
    .filter((r) => r.value !== ReservationCancelReasonChoice.NotPaid);

  const form = useForm<CancelFormValues>();
  const { handleSubmit, watch, control } = form;

  return (
    <FormWrapper>
      {cancellationTerms != null && (
        <AccordionWithState heading={t("reservationUnit:cancellationTerms")} disableBottomMargin>
          <TermsBox body={<Sanitize html={cancellationTerms} />} />
        </AccordionWithState>
      )}
      <Form onSubmit={handleSubmit(onNext)}>
        <AutoGrid>
          <ControlledSelect
            id="reservation-cancel__reason"
            name="reason"
            control={control}
            label={t("reservations:cancel.reason")}
            options={reasons}
            required
            disabled={isDisabled}
          />
          <Actions>
            <ButtonLikeLink data-testid="reservation-cancel__button--back" href={backLink} size="large">
              <IconCross aria-hidden="true" />
              {t("common:stop")}
            </ButtonLikeLink>
            <Button
              type="submit"
              variant={isLoading ? ButtonVariant.Clear : ButtonVariant.Primary}
              iconStart={isLoading ? <LoadingSpinner small /> : undefined}
              disabled={isDisabled || isLoading || !watch("reason")}
              data-testid="reservation-cancel__button--cancel"
            >
              {t("reservations:cancel.reservation")}
            </Button>
          </Actions>
        </AutoGrid>
      </Form>
    </FormWrapper>
  );
}
