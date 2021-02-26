const fs = require("fs");
const _ = require("lodash");
const shuffleSeed = require("shuffle-seed");

function extractColumns(data, columnNames) {
  const headers = _.first(data);
  const indexes = _.map(columnNames, (column) => headers.indexOf(column));
  return _.map(data, (row) => _.pullAt(row, indexes));
}

function loadCSV(
  filename,
  {
    converters = {},
    dataColumns = [],
    labelColumns = [],
    shuffle = true,
    splitTest = false,
  }
) {
  let data = fs.readFileSync(filename, { encoding: "utf-8" });
  data = data.split("\n").map((row) => row.split(","));
  data = data.map((row) => _.dropRightWhile(row, (val) => val === ""));
  const headers = _.first(data);
  data = data.map((row, index) => {
    if (index === 0) {
      return row;
    }
    return row.map((el, idx) => {
      if (converters[headers[idx]]) {
        const converted = converters[headers[idx]](el);
        return _.isNaN(converted) ? el : converted;
      }
      const result = parseFloat(el);
      return _.isNaN(result) ? el : result;
    });
  });
  let labels = extractColumns(data, labelColumns);
  data = extractColumns(data, dataColumns);
  labels.shift();
  data.shift();

  if (shuffle) {
    data = shuffleSeed.shuffle(data, "phrase");
    labels = shuffleSeed.shuffle(labels, "phrase");
  }

  if (splitTest) {
    const trainSize = _.isNumber(splitTest)
      ? splitTest
      : Math.floor(data.length / 2);

    return {
      features: data.slice(0, trainSize),
      labels: labels.slice(0, trainSize),
      testFeatures: data.slice(trainSize),
      testLabels: labels.slice(trainSize),
    };
  }

  return {
    features: data,
    labels,
  };
}

const { features, labels, testFeatures, testLabels } = loadCSV(
  "data/data.csv",
  {
    dataColumns: ["height", "value"],
    labelColumns: ["passed"],
    shuffle: true,
    splitTest: 1,
    converters: {
      passed: (val) => val === "TRUE",
    },
  }
);

console.log("features", features);
console.log("labels", labels);
console.log("testFeatures", testFeatures);
console.log("testLabels", testLabels);
