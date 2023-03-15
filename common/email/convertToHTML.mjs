import chalk from "chalk";
import mjml from "mjml";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templateFolder = path.join(__dirname, "templates");
const i18nFolder = path.join(__dirname, "i18n");
const translations = { '': {} }; // '' = untranslated

const flattenJSON = (obj = {}, res = {}, extraKey = '') => {
  for (let key in obj) {
     if(typeof obj[key] !== 'object') {
        res[extraKey + key] = obj[key];
     } else {
        flattenJSON(obj[key], res, `${extraKey}${key}.`);
     };
  };
  return res;
};
const translateContent = (content, i18n) => {
  if (content && i18n) for (let key in i18n) {
    // escaped version of reg.exp literal with variable embedded: /\$\{\s*PROP\s*\}/g
    content = content.replaceAll(new RegExp(`\\$\\{\\s*${key}\\s*\\}`, "g"), i18n[key]);
  }
  return content;
};
const writeEmailFile = (templateName, fileContent, emailType, emailLang) => {
  const fileName = templateName.replace(".template.mjml", (emailLang ? `_${emailLang}.${emailType}` : `.${emailType}`));
  const emailFile = path.join(__dirname, `/${emailType}/` + fileName);

  fs.writeFileSync(emailFile, fileContent);
  console.log(chalk`{greenBright.bold UPDATED:} {grey ${fileName}}`);
}

const main = () => {
  // ensure that the html folders exist
  fs.mkdirSync(path.join(__dirname, "/html/"), { recursive: true } );
  fs.mkdirSync(path.join(__dirname, "/txt/"), { recursive: true } );

  // first read the translations of static texts
  fs.readdirSync(i18nFolder, { withFileTypes: true })
    .filter((entity) => entity.isFile())
    .map((file) => file.name).forEach((jsonFile) => {
    
    const lang = jsonFile.replace(".json", "");
    try {
      const json = JSON.parse(
        fs.readFileSync(path.join(__dirname, "i18n", jsonFile))
      );
      // flatten the object structure: { "a": { "b": "c" } } becomes { "a.b": "c" } etc.
      translations[lang] = flattenJSON(json);
    } catch (e) {
      console.log(chalk`{redBright.bold FAILED to parse i18n file:} {grey ${jsonFile}`, e);
    }
  });

  // then read, convert and translate the templates
  fs.readdirSync(templateFolder, { withFileTypes: true })
    .filter((entity) => entity.isFile())
    .map((file) => file.name).forEach((templateFile) => {

    // convert mjml to html
    let fileContent = fs.readFileSync(path.join(__dirname, "templates", templateFile));
    let htmlContent = mjml(fileContent.toString(), {
      filePath: path.join(__dirname, "templates"),
    }).html;

    // translate also the text version if it exists
    let textFile = path.join(__dirname, "text-templates", templateFile.replace(".mjml", ".txt"));
    let textContent = fs.existsSync(textFile) ? fs.readFileSync(textFile).toString() : '';

    // repeat for each languge in addition to untranslated html
    Object.keys(translations).forEach((lang) => {
      if (lang) {
        let translatedContent = translateContent(htmlContent, translations[lang]);
        writeEmailFile(templateFile, translatedContent, "html", lang);

        if (textContent) {
          translatedContent = translateContent(textContent, translations[lang]);
          writeEmailFile(templateFile, translatedContent, "txt", lang);
        }
      } else {
        // the untranslated raw html version (text not relevant, would be identical to the template)
        writeEmailFile(templateFile, htmlContent, "html");
      }
    });
  });
};

main();
