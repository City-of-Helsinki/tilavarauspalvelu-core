import React from "react";
import { useTranslation } from "next-i18next";
import type { LogoProps } from "hds-react";
import { Logo as HDSLogo, logoFi, LogoSize, logoSv } from "hds-react";

function logoSrcFromLanguage(language: string) {
  if (language === "sv") {
    return logoSv;
  }
  return logoFi;
}

export function Logo({
  size = LogoSize.Medium,
  style,
}: Pick<LogoProps, "size"> & { style?: React.CSSProperties }): JSX.Element {
  const { t, i18n } = useTranslation();
  return <HDSLogo src={logoSrcFromLanguage(i18n.language)} alt={t("common:helsinkiCity")} size={size} style={style} />;
}
