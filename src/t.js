require("@tensorflow/tfjs-node");
const tf = require("@tensorflow/tfjs");
const axios = require("axios");
const _ = require("lodash");
const shuffleSeed = require("shuffle-seed");
const LogisticRegression = require("./logistic-regression");

const loadData = async () => {
  const res = await axios.get("http://localhost:3031/data");
  return res.data;
};

const extractLabelData = (data, label) => {
  return Object.entries(_.groupBy(data, (el) => el[label]))
    .map((row) => {
      return [row[0], row[1].length];
    })
    .filter((el) => el[0] !== "undefined");
};

const renderPokemonByType = (types) => {
  const x = types.map((row) => row[0]);
  const y = types.map((row) => row[1]);
  const chartData = [
    {
      x,
      y,
      type: "bar",
    },
  ];
  const layout = {
    title: "Pokemon Type 1 Frequency",
  };
  Plotly.newPlot("pokemon-type-container", chartData, layout);
};

const renderPokemonByGeneration = (generation) => {
  const labels = generation.map((row) => row[0]);
  const values = generation.map((row) => row[1]);
  const chartData = [
    {
      labels,
      values,
      type: "pie",
      textinfo: "label+percent",
      textposition: "outside",
      automargin: true,
    },
  ];
  const layout = {
    title: "Generation based pokemon distribution",
    showlegend: false,
  };
  Plotly.newPlot("gen-container", chartData, layout);
};

const renderPokemonByLegendary = (dataset) => {
  const labels = dataset.map((row) =>
    row[0] === "True" ? "Legendary" : "Not Legendary"
  );
  const values = dataset.map((row) => row[1]);
  const chartData = [
    {
      labels,
      values,
      type: "pie",
      textinfo: "label+percent",
      textposition: "outside",
      automargin: true,
    },
  ];
  const layout = {
    title:
      "Percentage of lengendary pokemons in dataset (False: Not Lengendary, True: Legendary)",
    showlegend: false,
  };
  Plotly.newPlot("leg-container", chartData, layout);
};

const fillNoneIfNull = (dataset, features) => {
  dataset.forEach((row) => {
    features.forEach((feature) => {
      if (!row[feature]) {
        row[feature] = "none";
      }
    });
  });
};

const convertColumnVal = (dataset, features, values) => {
  dataset.forEach((row) => {
    features.forEach((feature) => {
      if (row[feature] === "True") {
        row[feature] = values.trueValue;
        return;
      }
      row[feature] = values.falseValue;
    });
  });
};

const removeHead = (dataset) => {
  dataset.forEach((row) => {
    if (!row["#"]) dataset.splice(dataset.indexOf(row["#"]), 1);
  });
};

const selectDatasetFeatures = (dataset, features) => {
  return _.chain(dataset)
    .map((row) => features.map((feature) => row[feature]))
    .value();
};

const modifyFeatureData = (dataset, label) =>
  _.chain(dataset)
    .map((row) => row[label])
    .uniq()
    .filter((el) => !!el)
    .value();

const mergeDatasets = (leftDataset, rightDataset) => {
  return _.chain(leftDataset)
    .map((row) => {
      const first = Number(row["First_pokemon"]) - 1;
      const second = Number(row["Second_pokemon"]) - 1;
      const winner = _.isEqual(Number(row["Winner"]) - 1, first) ? 0 : 1;
      return [rightDataset[first], rightDataset[second], winner];
    })
    .map((row) =>
      _.chain(row)
        .flatMap()
        .map((col) => Number(col))
        .value()
    )
    .value();
};

const createDatasets = (
  dataset,
  { shuffle = false, splitTest = null, labelsCol = [] }
) => {
  let labels = _.map(dataset, (row) => _.pullAt(row, labelsCol));
  if (shuffle) {
    labels = shuffleSeed.shuffle(labels, "phrase");
  }
  if (splitTest) {
    const trainSize = _.isNumber(splitTest)
      ? splitTest
      : Math.floor(dataset.length / 2);
    return {
      features: dataset.slice(0, trainSize),
      labels: labels.slice(0, trainSize),
      testFeatures: dataset.slice(trainSize),
      testLabels: labels.slice(trainSize),
    };
  }
  return {
    features: dataset,
    labels,
  };
};

const runModel = (dataset) => {
  const { features, labels, testFeatures, testLabels } = createDatasets(
    dataset,
    {
      shuffle: true,
      splitTest: 500,
      labelsCol: [20],
    }
  );
  const regression = new LogisticRegression(features, labels, {
    learningRate: 1,
    iterations: 20,
    batchSize: 100,
  });

  regression.train();

  const accuracy = regression.test(testFeatures, testLabels);
  console.log(`Accuracy is ${accuracy}`);
};

const run = async () => {
  const { combats, pokemon } = await loadData();
  removeHead(pokemon);
  const types = extractLabelData(pokemon, "Type 1");
  const generation = extractLabelData(pokemon, "Generation");
  const legendary = extractLabelData(pokemon, "Legendary");
  const typesSet = modifyFeatureData(pokemon, "Type 1");

  fillNoneIfNull(pokemon, ["Type 2"]);
  convertColumnVal(pokemon, ["Legendary"], { trueValue: 1, falseValue: 0 });
  pokemon.forEach((row) => {
    ["Type 1", "Type 2"].forEach((col) => {
      if (row[col]) {
        row[col] = typesSet.indexOf(row[col]);
      }
    });
  });
  const pokemonDataset = selectDatasetFeatures(pokemon, [
    "Attack",
    "Defense",
    "Generation",
    "HP",
    "Legendary",
    "Sp. Atk",
    "Sp. Def",
    "Speed",
    "Type 1",
    "Type 2",
  ]);

  const dataset = mergeDatasets(combats, pokemonDataset);
  runModel(dataset);
};

run();
