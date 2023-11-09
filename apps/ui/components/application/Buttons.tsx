import React from "react";
import { useTranslation } from "next-i18next";
import { IconArrowRight } from "hds-react";
import { useRouter } from "next/router";
import { ButtonContainer } from "../common/common";
import { MediumButton } from "../../styles/util";

type Props = {
  applicationId: number;
};

const Buttons = ({ applicationId }: Props): JSX.Element => {
  const { t } = useTranslation();

  const router = useRouter();
  return (
    <ButtonContainer>
      <MediumButton
        variant="secondary"
        onClick={() => router.push(`/application/${applicationId}/page2`)}
      >
        {t("common:prev")}
      </MediumButton>
      <MediumButton
        id="button__application--next"
        iconRight={<IconArrowRight />}
        type="submit"
      >
        {t("common:next")}
      </MediumButton>
    </ButtonContainer>
  );
};

export default Buttons;
