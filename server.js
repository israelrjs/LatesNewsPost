require("dotenv").config();
var express = require("express");
var exphbs = require("express-handlebars");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var cheerio = require("cheerio");
var request = require("request");
var logger = require("morgan");
var axios = require("axios");

var PORT = process.env.PORT || 9090;

var app = express();

app.use(logger("dev"));

app.use(
  bodyParser.urlencoded({
    extended: false
  })
);
app.use(express.static("public"));

// Handlebars
app.engine(
  "handlebars",
  exphbs({
    defaultLayout: "main"
  })
);
app.set("view engine", "handlebars");

var db = require("./models");
mongoose.Promise = Promise;

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/NEWSdb";

mongoose.connect(MONGODB_URI);

app.get("/articles", function(req, res) {
  // First, we grab the body of the html with request
  axios.get("http://www.echojs.com/").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("article h2").each(function(i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.Title = $(this)
        .children("a")
        .text();
      result.Link = $(this)
        .children("a")
        .attr("href");

      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          res.send(err);
        });
    });

    // If we were able to successfully scrape and save an Article, send a message to the client
    res.render("news");
  });
});

// Route for getting all Articles from the db
// app.get("/articles", function(req, res) {
//   db.Article.find({})
//     .then(function(dbArticles) {
//       res.render("news", { Articles: dbArticles });
//     })
//     .catch(function(err) {
//       res.json(err);
//     });
// });

app.get("/", function(req, res) {
  db.Article.find({})
    .then(function(dbArticles) {
      res.render("news", { Articles: dbArticles });
    })
    .catch(function(err) {
      res.json(err);
    });
});

// // Route for getting all Articles from the db
// app.get("/articles", function(req, res) {
//   // TODO: Finish the route so it grabs all of the articles
//   db.Article.find({})
//     .then(function(dbArticle) {
//       res.render("news", { data: dbArticle });
//     })
//     .catch(function(err) {
//       res.json(err);
//     });
// });

app.listen(PORT, function() {
  console.log(
    "==> 🌎  Listening on port %s. Visit http://localhost:%s/ in your browser.",
    PORT,
    PORT
  );
});
