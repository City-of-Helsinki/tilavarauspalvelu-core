import React from "react";
import { useTranslation } from "next-i18next";
import { signIn } from "common/src/browserHelpers";
import { useSession } from "@/hooks/auth";
import { Button, ButtonSize } from "hds-react";

type Props = {
  apiBaseUrl: string;
  componentIfAuthenticated: JSX.Element;
  isActionDisabled?: boolean;
  returnUrl?: string;
};

export function LoginFragment({
  apiBaseUrl,
  componentIfAuthenticated,
  isActionDisabled,
  returnUrl,
}: Props): JSX.Element {
  // TODO pass the isAuthenticated from SSR and remove the hook
  const { isAuthenticated } = useSession();
  const { t } = useTranslation();

  const handleClick = () => {
    signIn(apiBaseUrl, returnUrl);
  };

  if (isAuthenticated) {
    return componentIfAuthenticated;
  }

  return (
    <Button
      onClick={handleClick}
      className="login-fragment__button--login"
      disabled={isActionDisabled}
      size={ButtonSize.Small}
    >
      {t("reservationCalendar:loginAndReserve")}
    </Button>
  );
}
