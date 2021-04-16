import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { AccordionWithState as Accordion } from '../../component/Accordion';
import Container from '../../component/Container';
import Head from '../Head';

type Props = {
  breadCrumbText: string;
};

const Preformatted = styled.div`
  margin-top: var(--spacing-s);
  width: (--container-width-m);
  white-space: break-spaces;
`;

const Sent = ({ breadCrumbText }: Props): JSX.Element => {
  const { t } = useTranslation();

  return (
    <>
      <Head
        heading={t('Application.sent.heading')}
        breadCrumbText={breadCrumbText}
      />
      <Container main>
        <Accordion heading={t('Application.sent.faq1Question')}>
          <Preformatted>{`HAKEMUKSESI ON NYT VASTAANOTETTU

Voit halutessasi täydentää hakemustasi ennen hakuajan päättymistä. Tarvittaessa poista tarpeettomat hakemukset, sillä VIIMEKSI SAAPUNUT hakemus katsotaan voimassa olevaksi.

Lähetetyn hakemuksen tunnistat sinisestä KÄSITTELYSSÄ-symbolista. Paperisia käyttövuoroanomuksia tai myöhässä tulleita hakemuksia ei käsitellä.

Päätökset vuoroista pyritään antamaan kuukauden kuluessa hakukierroksen päättymisestä. Kun hakemuksesi on käsitelty, saat viestin hakemuksella ilmoittamaasi sähköpostiosoitteeseen.

Saatuasi päätöksen, ota yhteyttä siihen toimipisteeseen, josta vuoro on myönnetty. Sovi toimipisteen kanssa avainten noutamisesta ja perehdytyksestä tilojen käyttöön. Luovutamme tilat omavalvontakäyttöön vain perehdytyksen saaneelle henkilölle.

Jos sinulle ei myönnetty vakiovuoroa hakemiisi tiloihin, voit tiedustella vapaaksi jääneitä aikoja suoraan muilta nuorisotaloiltamme. Muutoksenhakua ja hinnan kohtuullistamista tulee hakea kahden viikon kuluessa päätöksen antamisesta.`}</Preformatted>
        </Accordion>
        <Accordion heading={t('Application.sent.faq2Question')}>
          <Preformatted>
            {`Myönnetyistä vakiovuoroista lähetetään hakijalle päätös ja varausvahvistus. Kun hakemuksesi on käsitelty, sinulle myönnetyt vuorot näkyvät varausjärjestelmässä. Maksulliset vuorot laskutetaan sopimuksen mukaisesti. Muutosta tai kohtuullistamista myönnettyyn käyttövuoroon tulee hakea viimeistään kahden viikon kuluessa varausvahvistuksen saapumisesta.
`}
          </Preformatted>
        </Accordion>
        <Accordion heading={t('Application.sent.faq3Question')}>
          <Preformatted>{`Päätökseen tyytymätön voi hakea hinnan kohtuullistamista kirjallisesti aluepäälliköltä viimeistään kahden viikon kuluessa varausvahvistuksen saapumisesta. Aluepäällikkö voi perustellusta syystä päättää hinnan kohtuullistamisesta viranhaltijan päätöspöytäkirjassaan vuoronsaajan sitä kirjallisesti hakiessa Kohtuullistamislomakkeella. Kohtuullistamispyyntö osoitetaan siihen toimipisteeseen, josta käyttövuoro on myönnetty.

Tilavarauksessa sovelletaan voimassa olevia toimialakohtaisia hinnoitteluperiaatteita. Mahdolliset lisäpalvelut eivät sisälly tilan hintaan ja niistä voidaan veloittaa erikseen.

Jos et käytä vakiovuoroasi kauden aikana, MUISTATHAN PERUA VUOROSI JOKA KERTA. Jos haluat peruuttaa vakiovuoron kesken sopimuskauden, peruutus tulee tehdä kirjallisesti siihen toimipisteeseen, jonne vuoro on myönnetty. Jos vakituinen käyttövuoro on jäänyt peruuttamatta kaksi kertaa peräkkäin, on nuorisopalveluilla oikeus perua vuoro myöntökauden loppuun saakka.`}</Preformatted>
        </Accordion>
      </Container>
    </>
  );
};

export default Sent;
