import * as tf from "@tensorflow/tfjs";
import * as tfVis from "@tensorflow/tfjs-vis";
import Plotly from "plotly.js-dist";
import _ from "lodash";
import shuffleSeed from "shuffle-seed";

const loadData = async () => {
  const res = await fetch("http://localhost:3031/data");
  return res.json();
};

// const renderOutcomes = (data) => {
//   const outcomes = data.map((r) => r.Outcome);
//   const [diabetic, healthy] = _.partition(outcomes, (outcome) => outcome === 1);
//   const chartData = [
//     {
//       labels: ["Diabetic", "Healthy"],
//       values: [diabetic.length, healthy.length],
//       type: "pie",
//       opacity: 0.6,
//     },
//   ];
//   Plotly.newPlot("outcome-container", chartData);
// };

// const renderHistogram = (container, data, column, config) => {
//   const diabetic = data
//     .filter((row) => row.Outcome === 1)
//     .map((row) => row[column]);
//   const healthy = data
//     .filter((row) => row.Outcome === 0)
//     .map((row) => row[column]);
//   const dTrace = {
//     name: "diabetic",
//     x: diabetic,
//     opacity: 0.5,
//     type: "histogram",
//   };
//   const hTrace = {
//     name: "healthy",
//     x: healthy,
//     opacity: 0.5,
//     type: "histogram",
//   };
//   Plotly.newPlot(container, [dTrace, hTrace], {
//     barmode: "overlay",
//     title: config.title,
//     xaxis: {
//       title: config.xLabel,
//     },
//     yaxis: {
//       title: config.yLabel,
//     },
//   });
// };

// const renderScatter = (container, data, columns, config) => {
//   const diabetic = data.filter((row) => row.Outcome === 1);
//   const healthy = data.filter((row) => row.Outcome === 0);
//   const dTrace = {
//     name: "diabetic",
//     x: diabetic.map((row) => row[columns[0]]),
//     y: diabetic.map((row) => row[columns[1]]),
//     opacity: 0.5,
//     mode: "markers",
//     type: "scatter",
//   };
//   const hTrace = {
//     name: "healthy",
//     x: healthy.map((row) => row[columns[0]]),
//     y: healthy.map((row) => row[columns[1]]),
//     opacity: 0.5,
//     mode: "markers",
//     type: "scatter",
//   };
//   const chartData = [dTrace, hTrace];
//   Plotly.newPlot(container, chartData, {
//     title: config.title,
//     xaxis: {
//       title: config.xLabel,
//     },
//     yaxis: {
//       title: config.yLabel,
//     },
//   });
// };

// const oneHot = (outcome) => Array.from(tf.oneHot([outcome], 2).dataSync());

// const trainLogisticRegression = async (
//   featureCount,
//   trainDataset,
//   validDataset
// ) => {
//   const model = tf.sequential();
//   model.add(
//     tf.layers.dense({
//       units: 12,
//       activation: "relu",
//       inputShape: [featureCount],
//     })
//   );
//   model.add(
//     tf.layers.dense({
//       units: 2,
//       activation: "softmax",
//     })
//   );
//   model.compile({
//     optimizer: tf.train.adam(0.001),
//     loss: "binaryCrossentropy",
//     metrics: ["accuracy"],
//   });
//   const trainLogs = [];
//   const lossContainer = document.getElementById("loss-container");
//   const accuracyContainer = document.getElementById("accuracy-container");
//   await model.fitDataset(trainDataset, {
//     epochs: 100,
//     validationData: validDataset,
//     callbacks: {
//       onEpochEnd: async (epoch, logs) => {
//         trainLogs.push(logs);
//         tfVis.show.history(lossContainer, trainLogs, ["loss", "val_loss"]);
//         tfVis.show.history(accuracyContainer, trainLogs, ["acc", "val_acc"]);
//       },
//     },
//   });
//   return model;
// };

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
      features: dataset.slice(trainSize),
      labels: labels.slice(trainSize),
      testFeatures: dataset.slice(0, trainSize),
      testLabels: labels.slice(0, trainSize),
    };
  }
  return {
    features: dataset,
    labels,
  };
};

const run = async () => {
  const { combats, pokemon } = await loadData();
  removeHead(pokemon);
  const types = extractLabelData(pokemon, "Type 1");
  const generation = extractLabelData(pokemon, "Generation");
  const legendary = extractLabelData(pokemon, "Legendary");
  const typesSet = modifyFeatureData(pokemon, "Type 1");

  renderPokemonByType(types);
  renderPokemonByGeneration(generation);
  renderPokemonByLegendary(legendary);
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
  const datasets = createDatasets(dataset, {
    shuffle: true,
    splitTest: 30000,
    labelsCol: [20],
  });
  console.log(datasets);
};

if (document.readyState !== "loading") {
  run();
} else {
  document.addEventListener("DOMContentLoaded", run);
}
