import { Notification, Select } from "hds-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { GetStaticProps } from "next";
import styled from "styled-components";
import { getApplicationRounds, saveApplication } from "../modules/api";
import { useApiDataNoParams } from "../hooks/useApiData";
import { breakpoint } from "../modules/style";
import { Application, OptionType } from "../modules/types";
import { applicationRoundState, deepCopy } from "../modules/util";
import { AccordionWithState as Accordion } from "../components/common/Accordion";
import Loader from "../components/common/Loader";
import { minimalApplicationForInitialSave } from "../modules/application/applicationInitializer";
import ApplicationPage from "../components/application/ApplicationPage";
import { MediumButton } from "../styles/util";
import RequireAuthentication from "../components/common/RequireAuthentication";

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale)),
    },
  };
};

const Container = styled.div`
  margin-top: var(--spacing-layout-m);
  padding-bottom: var(--spacing-layout-xl);
  font-size: var(--fontsize-body-m);
  gap: var(--spacing-l);
  display: grid;
  grid-template-columns: 1fr 382px;

  @media (max-width: ${breakpoint.l}) {
    grid-template-columns: 1fr;
  }
`;

const Preformatted = styled.div`
  margin-top: var(--spacing-s);
  width: (--container-width-m);
  white-space: break-spaces;
`;

const Intro = (): JSX.Element => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [applicationRound, setApplicationRound] = useState(0);

  const history = useRouter();
  const { t } = useTranslation();

  const applicationRounds = useApiDataNoParams(getApplicationRounds, (rounds) =>
    rounds
      .filter(
        (ar) =>
          applicationRoundState(
            ar.applicationPeriodBegin,
            ar.applicationPeriodEnd
          ) === "active"
      )
      .map((ar) => ({ value: ar.id, label: ar.name }))
  );

  const createNewApplication = async (applicationRoundId: number) => {
    setSaving(true);

    try {
      const templateApplication = {
        ...deepCopy(minimalApplicationForInitialSave(applicationRoundId)),
      } as Application;

      const savedApplication = await saveApplication(templateApplication);
      if (savedApplication.id) {
        history.replace(`/application/${savedApplication.id}/page1`);
      }
    } catch (e) {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <RequireAuthentication>
      <ApplicationPage
        translationKeyPrefix="application:Intro"
        headContent={
          <Container>
            <Loader datas={[applicationRounds]}>
              <Select
                id="applicationRoundSelect"
                placeholder={t("common:select")}
                options={applicationRounds.transformed as OptionType[]}
                label=""
                onChange={(selection: OptionType): void => {
                  setApplicationRound(selection.value as number);
                }}
              />
              <MediumButton
                id="start-application"
                disabled={!applicationRound || saving}
                onClick={() => {
                  createNewApplication(applicationRound);
                }}
              >
                {t("application:Intro.startNewApplication")}
              </MediumButton>
            </Loader>
          </Container>
        }
      >
        <Accordion heading={t("application:Intro.faq1.question")}>
          <Preformatted>
            {`
Luo hakemus YHDISTYKSENÄ tai RYHMÄNÄ, jos haet vuoroa esim. järjestölle, bändille, tanssi- tai teatteriryhmälle, asukasyhdistykselle tai muuhun ryhmä- tai yhteisötoimintaan. Valinta tehdään hakemuksen lopussa kohdassa 3 ”Varaajan perustiedot”.

Hakijan tulee olla varausta tehdessään 15 vuotta täyttänyt. Omavalvontakäytössä sopijaosapuolen
tulee aina olla 18 vuotta täyttänyt ja täysivaltainen.

Tarkemman käyttöohjeen löydät `}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.hel.fi/static/liitteet-2019/KuVa/nuoriso/Vakiovuorojen_sahkoinen_hakuohje2021.pdf"
            >
              täältä
            </a>
            {`

NÄIN HAET VUOROA RYHMÄNÄ TAI JÄRJESTÖNÄ:

1. Valitse avoinna oleva haku ja tutustu hakuohjeisiin ja -ehtoihin. Yhdellä hakemuksella voit hakea useita tiloja tai vuoroja. Haettavat vuorot ja tilat valitaan kohdassa 1 ”Vakiovuoron perustiedot” ja kellonaika kohdassa 2 ” Vakiovuoron ajankohta”.

2. VAKIOVUORON TIEDOT
- Jos edustat nuorisjärjestöä tai -ryhmää, valitse käyttötarkoitukseksi ”HARRASTUSTOIMINTA” tai ”NUORISOJÄRJESTÖN TAI -RYHMÄN MUU TILAISUUS”.
- Liikuntaseurat: valitse käyttötarkoitukseksi ”LIIKUNTASEURAN HARJOITUSVUORO”
- Jos järjestämäsi toiminta EI OLE NUORISOTOIMINTAA, valitse parhaiten kuvaava käyttötarkoitus tai vaihtoehto ”muu toiminta”.

3. IKÄRYHMÄ
- Jos ryhmässäsi on sekä aikuisia että lapsia tai nuoria, valitse ikäryhmäksi ”29-65” vuotta.
- muskarit: valitse ikäryhmäksi ”1-7” vuotta.

4. TILATOIVEET
Lisää hakemukselle KAIKKI tilat, joista haluat anoa vakiovuoroa. Järjestä ne toivejärjestykseen nuolien avulla, ensisijaisin tila ylimmäiseksi.

5. KAUSI JA KESTO
Oletuskausi on valmiiksi annettu. Jos haluat hakea lyhyempää kautta, muuta aloitus- ja lopetuspäivää. Valitse vuoron kesto ja määrä viikossa. Huom! Valitse vuoron kesto siten, että ehdit tehdä alkuvalmistelun ja loppusiivouksen vuoron aikana.

6. AIKATOIVE
Valitse kalenterista KAIKKI ne ajankohdat, jolle vuorosi voidaan sijoittaa. Mitä useamman ajankohdan valitset, sitä helpommin löydämme sinulle vuoron toivomastasi tilasta.

7. Valitse ”LUON HAKEMUKSEN YHDISTYKSEN, JÄRJESTÖN, RYHMÄN TAI YHTEISÖN PUOLESTA”. Ilmoita yhteystiedot ja sähköpostiosoite. Huomaa, että kaikki hakemukseen liittyvät viestit lähetetään tähän sähköpostiin. Jos yhteystietosi muuttuvat kesken kauden, ota yhteyttä toimipisteeseen!

8. Tarkista hakemuksesi tiedot, lue ja hyväksy käyttöehdot ja lähetä hakemus. Hakemuksesi käsitellään hakuajan päätyttyä.
`}
          </Preformatted>
        </Accordion>
        <Accordion heading={t("application:Intro.faq2.question")}>
          <Preformatted>{`Voit täydentää hakemustasi ennen hakuajan päättymistä. Poista tarpeettomat hakemukset, sillä VIIMEISIN SAAPUNUT hakemus katsotaan voimassa olevaksi. Lähetetyn hakemuksen tunnistat
sinisestä KÄSITTELYSSÄ-symbolista. Paperisia käyttövuoroanomuksia tai myöhässä tulleita hakemuksia ei käsitellä.

Päätökset vuoroista pyritään antamaan kuukauden kuluessa hakukierroksen päättymisestä. Kun hakemuksesi on käsitelty, saat viestin hakemuksella ilmoittamaasi sähköpostiosoitteeseen.Saatuasi päätöksen, ota yhteyttä siihen toimipisteeseen, josta vuoro on myönnetty. Sovi toimipisteen kanssa avainten noutamisesta ja perehdytyksestä tilojen käyttöön. Luovutamme tilat omavalvontakäyttöön vain perehdytyksen saaneelle henkilölle.

Jos sinulle ei myönnetty vakiovuoroa hakemiisi tiloihin, voit tiedustella vapaaksi jääneitä aikoja suoraan muilta nuorisotaloiltamme. Muutoksenhakua ja hinnan kohtuullistamista tulee hakea kahden viikon kuluessa päätöksen antamisesta.`}</Preformatted>
        </Accordion>
        <Accordion heading={t("application:Intro.faq3.question")}>
          <Preformatted>
            {`Luo hakemus YKSITYISHENKILÖNÄ vain, jos haet vuoroa itsellesi, perheellesi tai järjestämääsi juhlaa tai tilaisuutta varten. Valinta tehdään hakemuksen lopussa kohdassa 3 ” Varaajan perustiedot”.

Luo hakemus YRITYKSENÄ, jos haet vuoroa yrityksesi tapahtumaa tai tilaisuutta varten. Valinta tehdään hakemuksen lopussa kohdassa 3 ” Varaajan perustiedot”.

Hakijan tulee olla varausta tehdessään 15 vuotta täyttänyt. Omavalvontakäytössä sopijaosapuolen tulee aina olla 18 vuotta täyttänyt ja täysivaltainen.

NÄIN HAET VUOROA YKSITYISHENKILÖNÄ TAI YRITYKSENÄ:
1. Valitse avoinna oleva haku ja tutustu hakuohjeisiin ja -ehtoihin. Yhdellä hakemuksella voit hakea useita tiloja tai vuoroja. Haettavat vuorot ja tilat valitaan kohdassa 1 ”Vakiovuoron perustiedot” ja kellonaika kohdassa 2 ” Vakiovuoron ajankohta”.

2. VAKIOVUORON TIEDOT
- Jos järjestämäsi toiminta EI OLE NUORISOTOIMINTAA valitse parhaiten kuvaava käyttötarkoitus tai vaihtoehto ”muu toiminta”

3. IKÄRYHMÄ
- Jos ryhmässäsi on sekä aikuisia että lapsia tai nuoria, valitse ikäryhmäksi ”29-65 vuotta”.

4. TILATOIVEET
Lisää hakemukselle KAIKKI tilat, josta haluat anoa vakiovuoroa. Järjestä ne toivejärjestykseen nuolilla, ensisijaisin tila ylimmäiseksi.

5. KAUSI JA KESTOOletuskausi on valmiiksi annettu. Jos haluat hakea lyhyempää kautta, muuta aloitus- ja lopetuspäivää. Valitse vuoron kesto ja määrä viikossa. Valitse vuoron kesto siten, että ehdit tehdä alkuvalmistelun ja loppusiivouksen vuoron aikana.

6. AIKATOIVE
Valitse kalenterista KAIKKI ne ajankohdat, jolle vuorosi voidaan sijoittaa. Mitä useamman ajankohdan valitset ja joustavampi olet, sitä helpommin löydämme sinulle vuoron toivomastasi tilasta.

7. Valitse ”LUON HAKEMUKSEN YKSITYISHENILÖNÄ” tai ”LUON HAKEMUKSEN
YRITYKSENÄ”. Ilmoita yhteystiedot ja sähköpostiosoite. Huomaa, että kaikki hakemukseen liittyvät viestit lähetetään tähän sähköpostiin. Jos yhteystietosi muuttuvat kesken kauden, ota yhteyttä toimipisteeseen!

8. Tarkista hakemuksesi tiedot, lue ja hyväksy käyttöehdot ja lähetä hakemus. Hakemuksesi käsitellään hakuajan päätyttyä.`}
          </Preformatted>
        </Accordion>
        <Container>
          <Loader datas={[applicationRounds]}>
            <MediumButton
              disabled={!applicationRound}
              onClick={() => {
                createNewApplication(applicationRound);
              }}
            >
              {t("application:Intro.startNewApplication")}
            </MediumButton>
          </Loader>
        </Container>
        {error ? (
          <Notification
            type="error"
            label={t("application:Intro.createFailedHeading")}
            position="top-center"
            autoClose
            displayAutoCloseProgress={false}
            onClose={() => setError(false)}
          >
            {t("application:Intro.createFailedContent")}
            {error}
          </Notification>
        ) : null}
      </ApplicationPage>
    </RequireAuthentication>
  );
};

export default Intro;
