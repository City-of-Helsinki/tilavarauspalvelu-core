import React from "react";
import { Button, ButtonSize } from "hds-react";
import { useTranslation } from "next-i18next";
import { signIn } from "ui/src/modules/browserHelpers";
import { getLocalizationLang } from "ui/src/modules/helpers";
import { useSession } from "@/hooks";

type Props = {
  apiBaseUrl: string;
  componentIfAuthenticated: JSX.Element;
  isActionDisabled?: boolean;
  returnUrl?: string;
  type: "application" | "reservation";
};

export function LoginFragment({
  apiBaseUrl,
  componentIfAuthenticated,
  isActionDisabled,
  returnUrl,
  type,
}: Readonly<Props>): JSX.Element {
  const { isAuthenticated } = useSession();
  const { t, i18n } = useTranslation();

  const handleClick = () => {
    signIn({
      apiBaseUrl,
      language: getLocalizationLang(i18n.language),
      client: "customer",
      returnUrl,
    });
  };

  if (isAuthenticated) {
    return componentIfAuthenticated;
  }

  return (
    <Button
      onClick={handleClick}
      className="login-fragment__button--login"
      disabled={isActionDisabled}
      size={type === "application" ? ButtonSize.Small : ButtonSize.Medium}
    >
      {type === "application" ? t("shoppingCart:loginAndApply") : t("shoppingCart:loginAndReserve")}
    </Button>
  );
}
