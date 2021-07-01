import React, { useEffect } from "react";
import { Navigation as HDSNavigation } from "hds-react";
import { useTranslation } from "next-i18next";
import { useLocalStorage } from "react-use";
import { useRouter } from "next/router";
import styled from "styled-components";
import { TFunction } from "i18next";
import { applicationsUrl } from "../../modules/util";
import { authEnabled, isBrowser } from "../../modules/const";
import { breakpoint } from "../../modules/style";
import { UserProfile } from "../../modules/types";

interface LanguageOption {
  label: string;
  value: string;
}

const languageOptions: LanguageOption[] = [{ label: "Suomeksi", value: "fi" }];

const StyledNavigation = styled(HDSNavigation)`
  --header-background-color: var(
    --tilavaraus-header-background-color
  ) !important;

  color: var(--tilavaraus-header-color);

  @media (max-width: ${breakpoint.s}) {
    position: fixed !important;
    z-index: 10 !important;
  }
`;

const PreContent = styled.div`
  @media (max-width: ${breakpoint.s}) {
    margin-top: var(--spacing-layout-m);
  }
`;

const DEFAULT_LANGUAGE = "fi";

type Props = {
  profile: UserProfile | null;
  logout?: () => void;
};

const getUserName = (profile: UserProfile | null, t: TFunction) => {
  if (profile === null) {
    return "";
  }
  if (!profile.given_name && !profile.family_name) {
    return t("userNoName");
  }

  return `${profile?.given_name || ""} ${profile?.family_name || ""}`;
};

const Navigation = ({ profile, logout }: Props): JSX.Element => {
  const { t, i18n } = useTranslation(["common", "navigation"]);
  const router = useRouter();
  const [language, setLanguage] = useLocalStorage<string>(
    "userLocale",
    i18n.language
  );

  const formatSelectedValue = (lang = DEFAULT_LANGUAGE): string =>
    lang.toUpperCase();

  useEffect(() => {
    /* if (language) {
      i18n.changeLanguage(language);
    } */
  }, [language, i18n]);

  return (
    <>
      <StyledNavigation
        title={t("common:applicationName")}
        onTitleClick={() => router.push("/")}
        menuToggleAriaLabel="Menu"
        skipTo="#main"
        skipToContentLabel={t("navigation:skipToMainContent")}
      >
        <HDSNavigation.Row variant="inline">
          <HDSNavigation.Item
            label={t("navigation:Item.reservationUnitSearch")}
            onClick={() => router.push("/search")}
          />
          <HDSNavigation.Item
            label={t("navigation:Item.spaceReservation")}
            onClick={() => router.push("/")}
          />
          {profile ? (
            <HDSNavigation.Item
              label={t("navigation:Item.applications")}
              onClick={() => router.push(applicationsUrl)}
            />
          ) : (
            <span />
          )}
        </HDSNavigation.Row>
        <HDSNavigation.Actions>
          <HDSNavigation.User
            userName={getUserName(profile, t)}
            authenticated={Boolean(profile)}
            label={t("common:login")}
            onSignIn={() => {
              router.push(applicationsUrl);
            }}
          >
            <HDSNavigation.Item
              label={t("common:logout")}
              onClick={() => logout && logout()}
            />
          </HDSNavigation.User>
          <HDSNavigation.LanguageSelector label={formatSelectedValue(language)}>
            {languageOptions.map((languageOption) => (
              <HDSNavigation.Item
                key={languageOption.value}
                label={languageOption.label}
                onClick={(
                  e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>
                ): void => {
                  e.preventDefault();
                  setLanguage(languageOption.value);
                }}
              />
            ))}
          </HDSNavigation.LanguageSelector>
        </HDSNavigation.Actions>
      </StyledNavigation>
      <PreContent />
    </>
  );
};

const NavigationWithProfileAndLogout = (): JSX.Element => {
  if (!isBrowser || !authEnabled) {
    return <Navigation profile={null} />;
  }

  const WithOidc = require("./WithOidc").default;

  return (
    <WithOidc
      render={(props: {
        profile: UserProfile | null;
        logout: (() => void) | undefined;
      }) => <Navigation profile={props.profile} logout={props.logout} />}
    />
  );
};

export default NavigationWithProfileAndLogout;
