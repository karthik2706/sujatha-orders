const functions = require("firebase-functions");
const admin = require("firebase-admin");
const request = require("request");
const rp = require("request-promise");
const cors = require("cors")({ origin: true });
const qs = require("querystring");
const lodash = require('lodash');

admin.initializeApp();

// exports.fetchWaybills = functions.https.onRequest((req, response) => {
   
// });