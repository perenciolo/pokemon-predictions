const fs = require("fs");
const Papa = require("papaparse");

Papa.parseLocalPromise = async (filePath) => {
  const csvFile = fs.readFileSync(filePath, { encoding: "utf-8" });
  const csvData = csvFile.toString();
  return new Promise((resolve) => {
    Papa.parse(csvData, {
      header: true,
      complete: (results) => {
        resolve(results.data);
      },
    });
  });
};

module.exports = Papa;
