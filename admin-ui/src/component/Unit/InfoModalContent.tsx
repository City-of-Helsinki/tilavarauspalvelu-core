import React from "react";
import styled from "styled-components";
import { H1, H2 } from "common/src/common/typography";

const Content = styled.div`
  line-height: 26px;
  font-size: var(--fontsize-body-s);
`;

function InfoModalContent(): JSX.Element {
  return (
    <Content>
      <H1>Miten tila- ja resurssihierarkia sekä varausyksiköt toimivat</H1>
      <H2>Tilojen ja resurssien hallinta</H2>
      <p>
        Tilojen ja resurssien hallintanäkymä on listaus niistä huoneista ja
        tarvikkeista, joita toimipisteellä on tarjolla varattavaan käyttöön.
        Näkymää voi ajatella reseptin ainesosina, joista myöhemmin koostatte
        erilaisia yhdistelmiä, joita kutsutaan varausyksiköiksi.
      </p>

      <p>
        <strong>
          Tilojen ja resurssien hallintanäkymässä olennaista on, että
          erityisesti tilojen keskinäiset suhteet on määritetty huolella.
        </strong>{" "}
        Järjestelmän on tärkeää tietää, onko esimerkiksi talon yläkerta yksi
        tila, jonka tarvittaessa voitte jakaa kahdeksi tilaksi. Näin vältetään
        tilanne, jossa yläkertaa ei vuorojaossa myönnetä kenellekään, jos toinen
        puoli siitä on jo myönnetty toisaalle. Samalla saavutetaan tilanne,
        jossa toinen puoli yläkertaa on silti edelleen varattavissa.
      </p>

      <p>
        Huomaathan, että tiloja voi luoda sisäkkäin loputtomiin. Voit rakentaa
        alekkain esimerkiksi sisäpesäpallokentän, joka voi muuntua kahdeksi
        jalkapallokentäksi, ja nämä kenttäpuoliskot edelleen voivat jakautua
        kahdeksaksi pienkentäksi.
      </p>
      <H2>Varausyksiköiden hallinta</H2>
      <p>
        Kun tiedot on luotu, voit yhdistellä tiloista toimipisteen päänäkymässä
        millaisia tahansa varausyksiköitä, joissa{" "}
        <strong>kuvailet käyttöä ja erilaisia tarjolla olevia paketteja</strong>{" "}
        tarkemmin. Jos olet tehnyt tiloihin liittyvän pohjatyön huolella, sinun
        ei varausyksikköjä luodessa täydy enää murehtia tilojen
        päällekkäisvarauksista.
      </p>
      <p>
        Yläkertaan voi varausyksikkönäkymässä liittää vaikkapa
        erillisrakennuksen saunatilan, jos sellainen paketti on tarjolla.
        Erillisrakennuksen saunaa ei ole kuitenkaan tilalistassa täytynyt
        liittää yläkertaan, koska niillä ei ole suoraa riippuvuutta toisiinsa,
        vaan sauna on muista irrallinen tilansa. Näin ollen saunan voi liittää
        muihin varausyksiköihin ja saunatilaa varten voi luoda myös oman
        varausyksikkönsä. Jos sauna on myönnetty toisaalle, yläkerran ja saunan
        yhdistelmää ei voi enää varata, mutta yläkerran voi.
      </p>
      <H1>Usein kysyttyä</H1>
      <H2>Tarvitseeko resurssi oman tilansa?</H2>
      <p>
        Liikuteltavat tai ulosvuokrattavat resurssit eivät tarvitse omaa
        tilaansa. Oma tila täytyy luoda resurssille kuitenkin silloin, jos
        kokonainen tila tarvitaan vain resurssin käyttöön, kuten soittamiseen.
        Voit luoda esimerkiksi ensin tilan, ja kolmea soitinta varten kolme eri
        resurssia. Tämän jälkeen voit luoda kolme varausyksikköä, joista
        jokaiseen liität saman tilan ja eri soittimen. Huomaathan, että on
        järkevää luoda pienellekin resurssille oma muodollinen tilansa siinäkin
        tapauksessa, että resurssi sijaitsee esim. aulassa, jossa voidaan joskus
        järjestää juhlia. Tällöin vaikkapa skannerin käytön ajaksi koko muu tila
        muuttuu varauskelvottomaksi, joten skannerin käyttöä varten täytyy luoda
        nimellinen, 1 m² kokoinen tila, joka asetetaan aulan alitilaksi.
      </p>
      <H2>
        Miten muodostan varausyksiköt tilaan, jossa on mahdollista tehdä eri
        asioita?
      </H2>
      <p>
        Jos tilassa voi harrastaa kaikkea vaihtoehtoisesti täsmälleen samoina
        aukioloaikoina, liittäkää tila vain yhteen varausyksikköön, jonka
        käyttötarkoitukseksi merkitsette useita eri käyttötarkoituksia.
      </p>
      <p>
        Jos tilassa on selkeät ajat, jolloin eri asioita voi tehdä,
        suosittelemme luomaan eri käyttötarkoituksia varten omat
        varausyksikkönsä. Näin pystytte kuvailemaan toimintaa ja varustusta
        parhaimmalla mahdollisella tavalla. Huomatkaa valmistella ja palastella
        käyttöajat erityisen selkeästi ja siten, että ne eivät mene päällekkäin.
      </p>
      <p>
        Jos tila on aukioloaikoinaan tietynlaisessa käytössä (esim. klo 10–22
        varattuna sisäpesäpallolle), mutta sinne voidaan kysynnän mukaan
        tarvittaessa rakentaa futsal-kaukalo vain rajoitettuna aikana (esim. klo
        16-20 välisenä aikana), luokaa käyttötarkoituksille ja aukioloajoille
        omat varausyksikkönsä, joihin liitätte saman tilan. Järjestelmä
        huolehtii, että tilaa ei varata päällekkäin kahteen eri käyttöön.
      </p>
    </Content>
  );
}

export default InfoModalContent;
