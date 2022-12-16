import fs from "node:fs"
import path from "node:path"
import mjml from "mjml"
import chalk from "chalk"
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templateFolder = path.join(__dirname, "templates");

const main = () => {
    fs.readdir(templateFolder, {withFileTypes:true}, (err, entities) => {
        if(err) return

        const files = entities.filter(entity => entity.isFile()).map(file => file.name)
        let html;
        let fileContent;
        let fileName;

        files.forEach(file => {
            fileName = file.replace(".template.mjml", ".html")
            fileContent = fs.readFileSync(path.join(__dirname, "templates", file));
            fileContent = mjml(fileContent.toString(),  {filePath: path.join(__dirname, 'templates')});
            html = path.join(__dirname, "/html/" + fileName);

            fs.writeFileSync(html, fileContent.html);
            console.log(chalk`{greenBright.bold UPDATED:} {grey ${fileName}}`)
        })
      })
}

main()