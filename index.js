
const fs = require('fs');

let response = {}

fs.readdir("public/imgs", (err, files) => {
    files.forEach(file => {
        let code = file.slice(0, 6);
        let name = file;
        response[code] = name;
    });
    fs.writeFileSync("public/imgs.json", JSON.stringify(response));
});