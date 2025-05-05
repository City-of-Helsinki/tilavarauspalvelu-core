import React, { useEffect } from "react";
import styled from "styled-components";
import { useForm } from "react-hook-form";
import { Button, ButtonVariant, IconCross, LoadingSpinner } from "hds-react";
import { useTranslation } from "next-i18next";
import { AutoGrid, ButtonContainer, Flex, fontMedium } from "common/styled";
import { breakpoints } from "common/src/const";
import { type CancelReasonFieldsFragment } from "@gql/gql-types";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";
import { ControlledSelect } from "common/src/components/form";
import { ButtonLikeLink } from "./common/ButtonLikeLink";
import TermsBox from "common/src/termsbox/TermsBox";
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
  reason: number;
};

const FormWrapper = styled(Flex)`
  @media (min-width: ${breakpoints.m}) {
    grid-row: 2 / -1;
    grid-column: 1;
  }
`;

export function CancellationForm(props: {
  onNext: (values: CancelFormValues) => void;
  cancelReasons: CancelReasonFieldsFragment[];
  cancellationTerms: string | null;
  backLink: string;
  isLoading?: boolean;
  isDisabled?: boolean;
}): JSX.Element {
  const {
    cancelReasons,
    onNext,
    isLoading,
    isDisabled,
    cancellationTerms,
    backLink,
  } = props;
  const { t, i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);

  const reasons = cancelReasons.map((node) => ({
    label: getTranslationSafe(node.reasonTranslations, lang),
    value: node?.pk ?? 0,
  }));

  const form = useForm<CancelFormValues>();
  const { register, handleSubmit, watch, control } = form;

  // TODO can we remove this? should be auto registered when the form is created
  // should we add zod schema for the required fields?
  useEffect(() => {
    register("reason", { required: true });
  }, [register]);

  return (
    <FormWrapper>
      {cancellationTerms != null && (
        <AccordionWithState
          heading={t("reservationUnit:cancellationTerms")}
          disableBottomMargin
        >
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
            <ButtonLikeLink
              data-testid="reservation-cancel__button--back"
              href={backLink}
              size="large"
            >
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
