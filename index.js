require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");

// Basic Configuration
const port = process.env.PORT || 3000;

let mongoose;
try {
  mongoose = require("mongoose");
} catch (e) {
  console.log(e);
}

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const urlSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  position: Number,
});

const Url = mongoose.model("Url", urlSchema);

// https://stackoverflow.com/a/5717133
function validURL(str) {
  var pattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  ); // fragment locator
  return !!pattern.test(str);
}

const saveUrl = async (data) => {
  if (!validURL(data)) return null;

  let url = await findUrl({ url: data });
  if (url) {
    return url;
  } else {
    const count = await Url.countDocuments();
    console.log("Adding url: " + data + "(" + count + ")");
    url = await Url.create({ url: data, position: count + 1 });
    return url;
  }
};

const findUrl = async (querry) => {
  const result = await Url.findOne(querry, (err, data) => {
    if (err) return console.error(err);
    return data;
  });
  return result;
};

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.get("/api/shorturl/:position", async (req, res) => {
  const position = Number(req.params.position);
  const url = await findUrl({ position: position });

  if (url) {
    res.redirect(url.url);
  } else {
    res.json({
      error: "Wrong format",
    });
  }
});

app.post("/api/shorturl", async (req, res) => {
  const url = await saveUrl(req.body.url);
  if (url) {
    res.json({
      original_url: url.url,
      short_url: url.position,
    });
  } else {
    res.json({
      error: "Invalid URL",
    });
  }
});

app
  .route("/api/shorturl")
  .get((req, res) => {
    url = findUrl(req.params);
  })
  .post((req, res) => {});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
