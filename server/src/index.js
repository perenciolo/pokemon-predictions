const express = require("express");
const cors = require("cors");
const Papa = require("./papa");
const app = express();
const path = require("path");

app.use(express.json());
app.use(cors({}));

app.get("/data", async (req, res) => {
  const pokemon = await Papa.parseLocalPromise(
    path.resolve(__dirname, "data", "pokemon.csv")
  );
  const combats = await Papa.parseLocalPromise(
    path.resolve(__dirname, "data", "combats.csv")
  );
  return res.json({
    pokemon,
    combats,
  });
});

app.listen(3031, () => console.log("running on 3031"));
