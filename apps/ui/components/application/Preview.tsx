import React, { useState } from "react";
import { Checkbox } from "hds-react";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { useRouter } from "next/router";
import { ApplicationNode, TermsOfUseType } from "common/types/gql-types";
import { getTranslation } from "@/modules/util";
import { useOptions } from "@/hooks/useOptions";
import { MediumButton } from "@/styles/util";
import ApplicantInfoPreview from "./ApplicantInfoPreview";
import { CheckboxContainer, StyledNotification, Terms } from "./styled";
import { ButtonContainer, FormSubHeading } from "../common/common";
import { AccordionWithState as Accordion } from "../common/Accordion";
import { ApplicationEventList } from "./ApplicationEventList";

type Props = {
  application: ApplicationNode;
  // This only checks that the user accepts the terms of use, no form data modifications is done here
  onNext: () => void;
  tos: TermsOfUseType[];
};

const Preview = ({ onNext, application, tos }: Props): JSX.Element | null => {
  const [acceptTermsOfUse, setAcceptTermsOfUse] = useState(false);
  const router = useRouter();

  const { options } = useOptions();
  const citiesOptions = options.cityOptions;

  const { t } = useTranslation();

  const onSubmit = (): void => {
    onNext();
  };

  // application not saved yet
  if (!application.pk) {
    return (
      <>
        <h1>{t("application:preview.noData.heading")}</h1>
        <Link href="page1">{t("application:preview.noData.text")}</Link>
      </>
    );
  }

  const tos1 = tos.find((n) => n.pk === "generic1");
  const tos2 = tos.find((n) => n.pk === "KUVAnupa");

  return (
    <>
      <Accordion
        open
        id="basicInfo"
        heading={t("application:preview.basicInfoSubHeading")}
        theme="thin"
      >
        <ApplicantInfoPreview
          cities={citiesOptions}
          application={application}
        />
      </Accordion>
      <ApplicationEventList />
      <FormSubHeading>{t("reservationUnit:termsOfUse")}</FormSubHeading>
      {tos1 && <Terms tabIndex={0}>{getTranslation(tos1, "text")}</Terms>}
      <FormSubHeading>
        {t("application:preview.reservationUnitTerms")}
      </FormSubHeading>
      {tos2 && <Terms tabIndex={0}>{getTranslation(tos2, "text")}</Terms>}
      <CheckboxContainer>
        <Checkbox
          id="preview.acceptTermsOfUse"
          checked={acceptTermsOfUse}
          onChange={(e) => setAcceptTermsOfUse(e.target.checked)}
          label={t("application:preview.userAcceptsTerms")}
        />
      </CheckboxContainer>
      <StyledNotification
        label={t("application:preview.notification.processing")}
      >
        {t("application:preview.notification.body")}
      </StyledNotification>
      <ButtonContainer>
        <MediumButton
          variant="secondary"
          onClick={() => router.push(`${application.pk}/page3`)}
        >
          {t("common:prev")}
        </MediumButton>
        <MediumButton
          id="submit"
          onClick={onSubmit}
          disabled={!acceptTermsOfUse}
        >
          {t("common:submit")}
        </MediumButton>
      </ButtonContainer>
    </>
  );
};

export { Preview };
