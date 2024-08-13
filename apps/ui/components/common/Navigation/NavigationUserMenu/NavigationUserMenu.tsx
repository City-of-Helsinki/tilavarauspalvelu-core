import React from "react";
import {
  IconLinkExternal,
  IconSignout,
  Navigation as HDSNavigation,
} from "hds-react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import styled, { css } from "styled-components";
import { useSession } from "~/hooks/auth";
import { signIn, signOut } from "common/src/browserHelpers";
import { NavigationUserMenuUserCard } from "./NavigationUserMenuUserCard";
import { MenuItem } from "../types";

const StyledUserMenu = styled(HDSNavigation.User)<{
  $active?: boolean;
}>`
  @media (min-width: ${(props) => props.theme.spacing.m}) {
    /* stylelint-disable -- Using HDS naming convention to overwrite styles */
    #userDropdown-menu {
      left: auto;
      right: 0;
    }
    /* stylelint-enable */
  }
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
  $dividerAfter?: boolean;
  icon?: JSX.Element;
}>`
  &:last-of-type {
    padding-bottom: 0;
  }

  cursor: pointer;
  display: flex;
  padding-block: ${(props) => props.theme.spacing.xs};
  color: ${(props) => props.theme.colors.black.dark};
  text-decoration: none;

  @media (min-width: ${(props) => props.theme.breakpoints.m}) {
    &:last-of-type {
      padding-bottom: ${(props) => props.theme.spacing.xs};
    }
    padding-left: ${(props) => props.theme.spacing.s};
  }

  & > span {
    margin: 0 !important;
  }

  & > svg {
    margin-left: ${(props) => props.theme.spacing.xs};
  }

  ${({ $divider, $dividerAfter }) =>
    $divider &&
    css`
      position: relative;
      ${$dividerAfter
        ? "margin-bottom"
        : "margin-top"}: var(--spacing-m) !important;

      &:after {
        content: "";
        ${$dividerAfter ? "border-bottom" : "border-top"}: 1px solid ${(
          props
        ) => props.theme.colors.black.light};
        position: absolute;
        width: 100%;
        ${$dividerAfter ? "bottom" : "top"}: calc(var(--spacing-xs) * -1);

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

const constructName = (firstName?: string, lastName?: string) =>
  firstName || lastName ? `${firstName} ${lastName}` : undefined;

export function NavigationUserMenu({
  apiBaseUrl,
  profileLink,
}: {
  apiBaseUrl: string;
  profileLink: string;
}) {
  const router = useRouter();
  // TODO refactor this to fetch the user on SSR (and pass it to this component)
  const { isAuthenticated, user } = useSession();
  const { t } = useTranslation();
  const isAdAuthenticated = user?.isAdAuthenticated;
  const isActive = userMenuItems
    .map((item) => item.path)
    .includes(router.pathname);

  const { firstName, lastName } = user ?? {};
  const userName = constructName(firstName, lastName);
  const showProfileLink =
    !!profileLink && isAuthenticated && !isAdAuthenticated;
  return (
    // hack to deal with hds navigation eating data-testids
    <div data-testid="navigation__user-menu">
      <StyledUserMenu
        userName={userName}
        authenticated={isAuthenticated}
        label={t("common:login")}
        onSignIn={() => signIn(apiBaseUrl)}
        closeOnItemClick
        $active={isActive}
      >
        <NavigationUserMenuUserCard
          user={{ name: userName, email: user?.email }}
        />
        {showProfileLink && (
          <NavigationUserMenuItem
            href={profileLink}
            icon={<IconLinkExternal aria-hidden />}
            label={t("navigation:profileLinkLabel")}
            data-testid="navigation__user-profile-link"
            target="_blank"
            rel="noopener noreferrer"
            $divider
            $dividerAfter
          />
        )}
        {userMenuItems.map((item) => (
          <NavigationUserMenuItem
            href={item.path}
            key={item.path}
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
              // TODO cmd / shift + click doesn't open link in new tab (would require replacing with Link component)
              e.preventDefault();
              router.push(item.path, item.path, { locale: router.locale });
            }}
            data-testid={`navigation__user-${item.title}`}
          >
            {t(`navigation:Item.${item.title}`)}
          </NavigationUserMenuItem>
        ))}
        <NavigationUserMenuItem
          href="#"
          onClick={() => signOut(apiBaseUrl)}
          icon={<IconSignout aria-hidden />}
          label={t("common:logout")}
          data-testid="navigation__user-logout"
          $divider
        />
      </StyledUserMenu>
    </div>
  );
}
