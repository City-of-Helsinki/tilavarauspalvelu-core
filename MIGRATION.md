# Ohjeet monorepo muutokseen

These can be safely removed once nobody is using the yarn + node16 version anymore.

## Päivitä

Tee joko uusi klooni uuteen kansioon (suositeltava) tai päivitä vanha

```
git pull
```

## Vaihda node versio
```
# repo root
nvm use
node -v # 18...
```

## Asenna pnpm:

https://pnpm.io/installation

### MAC

brew install pnpm

### Corepack versio (Linux)

corepack enable
corepack prepare pnpm@latest --activate

## Siirrä envit

Oletus git pull eikä clone (jos teit kloonin, niin vaihda pathit kun kopsaat envit)

```
mv admin-ui/.env.local apps/admin-ui/
mv ui/.env.local apps/ui/
# korjaa yksi env muuttaja
vim apps/ui/.env.local
```

### vaihda yksi muuttuja

```
-TILAVARAUS_API_URL
+NEXT_PUBLIC_TILAVARAUS_API_URL
```

## siirrä certit

```
# repo juuressa
mv common/certificates ./
# TAI generoi uudet
pnpm generate-certificate
```

## Poista node_modules

Valitse toinen joko npkill TAI shell scripti. Suosittelen shell scriptiä, poistaa myös vanhat build cachet.
Jos käytät shell scriptiä siirrä kaikki mikä ei ole gitissä tai ei ala pisteellä pois ui ja admin-ui kansiosta (.env.local on turvassa mutta kannattaa siirtää ensin).

### Scriptillä
```
# zsh only (Mac)
setopt extended_glob; setopt ksh_glob;
rm -rf node_modules admin-ui/!(azure-pipelines.yml|) ui/!(azure-pipelines.yml|) common/node_modules
```
sit voi viel siivota ei poista . tiedostoja
```
rm -rf admin-ui/.next ui/.next
```

### npkill

valitse ui:sta kaikki node_modules

```
# repo juuressa
pnpm clean
```
Voit siivota admin-ui ja ui kansiot (ainoastaan azure-pipelines.yml on tarpeellinen)

## Asenna
```
# repon juuressa
pnpm i
```

## testaa että toimii
```
pnpm lint
```

## käynnistä molemmat
```
pnpm dev
```
