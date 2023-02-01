const fs = require("node:fs");
const path = require("node:path");
const mjml = require("mjml");

const templateFolder = path.join(__dirname, "../email/templates");

const main = () => {
  fs.readdir(templateFolder, (err, files) => {
    if (err) return;

    let html;
    let fileContent;

    files.forEach((file) => {
      fileContent = fs.readFileSync(
        path.join(__dirname, "../email/templates", file)
      );
      fileContent = mjml(fileContent.toString());
      html = path.join(
        __dirname,
        "../email/html/" + file.replace(".template.mjml", ".html")
      );

      fs.writeFileSync(html, fileContent.html);
    });
  });
};

main();
