import React from "react";
import { IconSignout, Navigation as HDSNavigation } from "hds-react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import styled, { css } from "styled-components";
import { MenuItem } from "../NavigationMenu";
import { NavigationUserMenuUserCard } from "./NavigationUserMenuUserCard";
import {
  authenticationIssuer,
  authenticationLogoutApiRoute,
} from "../../../../modules/const";

const StyledUserMenu = styled(HDSNavigation.User)<{
  $active?: boolean;
}>`
  ${({ $active }) =>
    $active &&
    css`
      &:after {
        content: "";
        position: absolute;
        bottom: -20px;
        width: 100%;
        border-bottom: 3px solid var(--color-bus);
        z-index: -1;
      }
    `}
`;

const NavigationUserMenuItem = styled(HDSNavigation.Item)<{
  $divider?: boolean;
  icon?: JSX.Element;
}>`
  cursor: pointer;
  display: flex;
  padding-block: ${(props) => props.theme.spacing.xs};
  padding-inline: ${(props) => props.theme.spacing.s};
  color: ${(props) => props.theme.colors.black.dark};
  text-decoration: none;

  &:hover {
    background: ${(props) => props.theme.colors.blue.medium};
    color: ${(props) => props.theme.colors.white.dark};
  }

  & > span {
    margin: 0 !important;
  }

  & > svg {
    margin-left: ${(props) => props.theme.spacing.xs};
  }

  ${({ $divider }) =>
    $divider &&
    css`
      position: relative;
      margin-top: var(--spacing-xs) !important;

      &:after {
        content: "";
        border-top-style: solid;
        border-top-width: 1px;
        border-top-color: ${(props) => props.theme.colors.black.light};
        position: absolute;
        width: 100%;
        top: 0;

        @media (min-width: ${(props) => props.theme.breakpoints.m}) {
          width: 80%;
        }
      }
    `}

  ${({ icon }) =>
    icon &&
    css`
      & > span:first-of-type {
        order: 2;
        padding-left: var(--spacing-xs);
      }
    `}
`;

const userMenuItems: MenuItem[] = [
  {
    title: "reservations",
    path: "/reservations",
  },
  {
    title: "applications",
    path: "/applications",
  },
];

const NavigationUserMenu = () => {
  const router = useRouter();
  const session = useSession();
  const { t } = useTranslation();

  const user = session.data?.user;
  const isActive = userMenuItems
    .map((item) => item.path)
    .includes(router.pathname);

  const handleSignIn = () => {
    signIn(authenticationIssuer, {
      callbackUrl: window.location.href,
    });
  };

  const handleSignOut = () => {
    signOut({ redirect: true, callbackUrl: authenticationLogoutApiRoute });
  };

  return (
    <StyledUserMenu
      userName={user?.name ?? ""}
      authenticated={session.status === "authenticated"}
      label={t("common:login")}
      onSignIn={handleSignIn}
      $active={isActive}
    >
      {user ? (
        <>
          <NavigationUserMenuUserCard user={user} />
          {userMenuItems.map((item) => (
            <NavigationUserMenuItem
              href="#"
              key={item.path}
              onClick={() =>
                router.push(item.path, item.path, { locale: router.locale })
              }
            >
              {t(`navigation:Item.${item.title}`)}
            </NavigationUserMenuItem>
          ))}
        </>
      ) : null}

      <NavigationUserMenuItem
        href="#"
        onClick={handleSignOut}
        icon={<IconSignout aria-hidden />}
        label={t("common:logout")}
        $divider={!!user}
      />
    </StyledUserMenu>
  );
};

export { NavigationUserMenu };
