import React, { MouseEvent } from "react";
import { Navigation as HDSNavigation } from "hds-react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";

type LanguageOption = {
  label: string;
  value: string;
};

const languageOptions: LanguageOption[] = [
  { label: "Suomeksi", value: "fi" },
  { label: "English", value: "en" },
  { label: "Svenska", value: "sv" },
];

const NavigationLanguageSelection = () => {
  const { i18n } = useTranslation();
  const router = useRouter();

  const handleLanguageChange = (
    e: MouseEvent<HTMLAnchorElement>,
    language: string
  ) => {
    e.preventDefault();
    router.replace(router.pathname, router.asPath, {
      locale: language,
    });
  };

  return (
    <HDSNavigation.LanguageSelector
      label={i18n?.language?.toUpperCase()}
      className="navigation__language-selector--button"
    >
      {languageOptions.map((languageOption) => (
        <HDSNavigation.Item
          key={languageOption.value}
          lang={languageOption.value}
          label={languageOption.label}
          href="#"
          onClick={(e) => handleLanguageChange(e, languageOption.value)}
        />
      ))}
    </HDSNavigation.LanguageSelector>
  );
};

export { NavigationLanguageSelection };
