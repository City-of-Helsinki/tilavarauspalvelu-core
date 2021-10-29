import React from "react";
import styled from "styled-components";
import { useLocalStorage } from "react-use";
import { useTranslation } from "next-i18next";
import Container from "./Container";
import { breakpoint } from "../../modules/style";
import { MediumButton } from "../../styles/util";

type MessageType = {
  id: number;
  content: string;
};

const Banner = styled.div`
  background-color: var(--color-suomenlinna-medium-light);
  font-size: var(--fontsize-body-l);
`;

const Message = styled.div`
  margin-bottom: var(--spacing-s);
`;

const Content = styled.div`
  margin-top: var(--spacing-s);

  @media (max-width: ${breakpoint.s}) {
    margin-top: var(--spacing-l);
  }
`;

const messages = [
  /* {
    id: 1,
    content:
      'Esimerkkinotifikaatio',
  }, */
] as MessageType[];

const ServiceNotification = (): JSX.Element | null => {
  const { t } = useTranslation();

  const [seenMessageIds, setSeenMessageIds] = useLocalStorage(
    "seenMessageIds",
    [] as number[]
  );

  const unseenMessages = messages.filter(
    (m) => seenMessageIds?.indexOf(m.id) === -1
  );

  const displayMessage = unseenMessages.find(() => true);

  if (displayMessage) {
    return (
      <Banner>
        <Container>
          <Content
            onClick={() => {
              setSeenMessageIds([...(seenMessageIds || []), displayMessage.id]);
            }}
          >
            <Message>{displayMessage.content}</Message>
            <MediumButton>{t("common:close")}</MediumButton>
          </Content>
        </Container>
      </Banner>
    );
  }

  return null;
};

export default ServiceNotification;
