import React from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import styled from "styled-components";
import { Application } from "../../modules/types";

const NavigationContainer = styled.nav`
  font-size: var(--fontsize-body-l);
  ul {
    padding: 0;
    list-style-type: none;
    font-family: var(--font-bold);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='80' width='100'%3E%3Cg fill='none' stroke='rgb(0,0,191)' stroke-width='3'%3E%3Cpath stroke-dasharray='4,4' d='M12 0 l0 80' /%3E%3C/g%3E%3C/svg%3E");
    background-repeat: repeat-y;
    li {
      margin-top: 1.5em;
    }
  }

  span {
    color: var(--color-black-90);
    display: flex;
    align-items: center;
  }

  a {
    text-decoration: none;
    :focus {
      outline: 2px solid var(--color-coat-of-arms);
    }
  }
`;

const Number = styled.div`
  background-color: var(--color-bus);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  color: var(--color-white);
  margin-right: 1em;
  text-align: center;
  line-height: 1.3;
  align-self: flex-end;
`;

type Props = {
  application?: Application;
};

const Stepper = ({ application }: Props): JSX.Element => {
  const { t } = useTranslation();
  let maxPage = -1;
  if (application) {
    if (
      application.applicationEvents.length > 0 &&
      application.applicationEvents[0].id
    ) {
      maxPage = 1;
    }
    if (
      application.applicationEvents?.[0]?.applicationEventSchedules.length > 0
    ) {
      maxPage = 2;
    }
    if (application.applicantType != null) {
      maxPage = 3;
    }
  }
  const pages = ["page1", "page2", "page3", "preview"];

  return (
    <NavigationContainer aria-label={t("common:applicationNavigationName")}>
      <ul>
        {pages.map((page, index) => (
          <li key={page}>
            {maxPage >= index ? (
              <Link href={`/application/${application.id}/${page}`}>
                <a>
                  <span>
                    <Number>{index + 1}</Number>
                    {t(`application:navigation.${page}`)}
                  </span>
                </a>
              </Link>
            ) : (
              <span>
                <Number>{index + 1}</Number>
                {t(`application:navigation.${page}`)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </NavigationContainer>
  );
};
export default Stepper;
