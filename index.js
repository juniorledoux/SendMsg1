var express = require("express");
var app = express();
require("dotenv").config();
const WhatsApp = require("whatsapp");
var bodyParser = require("body-parser");
const axios = require("axios");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

// Définir EJS comme moteur de visualisation
app.set("view engine", "ejs");

// Itinéraires pour les pages index et about
app.get("/", function (req, res) {
  res.render("pages/index");
});

app.get("/webhook", function (req, res) {
  if (
    req.query["hub.mode"] == "subscribe" &&
    req.query["hub.verify_token"] == "token"
  ) {
    res.send(req.query["hub.challenge"]);
  } else {
    res.sendStatus(400);
  }
});

app.post("/webhook", async function (request, response) {
  console.log(JSON.stringify(request.body));
  response.sendStatus(200);
  if (
    request.body.entry[0].changes[0].field == "messages" &&
    request.body.entry[0].changes[0].value.messages
  ) {
    axios({
      // L'URL de la requête
      url: `https://graph.facebook.com/v19.0/${process.env.WA_PHONE_NUMBER_ID}/messages`,

      // Les méthodes HTTP comme GET, POST, PUT, DELETE, HEAD
      method: "POST",

      // En-têtes de la requête HTTP
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CLOUD_API_ACCESS_TOKEN}`,
      },

      // Objet de données du corps de la requête
      data: {
        messaging_product: "whatsapp",
        status: "read",
        message_id: request.body.entry[0].changes[0].value.messages[0].id,
      },

      // Les informations d'identification doivent-elles accompagner la requête CORS ?
      // Par défaut `false`
      withCredentials: true,

      responseType: "json",
    })
      .then(function (response) {
        // Gérer le succès
        console.log(response.data);
      })
      .catch(function (error) {
        // Gérer l'erreur
        console.log(error);
      });
  }
});

app.post("/send", async function (req, res) {
  const wa = new WhatsApp(process.env.WA_PHONE_NUMBER_ID);
  const recipient_number = req.body.recipient;
  const message = req.body.message;
  try {
    const sent_text_message = wa.messages.text(
      { body: message },
      recipient_number
    );

    await sent_text_message.then((res) => {
      console.log("message envoyé");
    });
  } catch (e) {
    console.log(JSON.stringify(e));
  }
  res.render("pages/status", { message: "Message envoyé" });
});

// Écoutez sur le port 8080
app.listen(8080);
console.log("8080 est le port magique !");
