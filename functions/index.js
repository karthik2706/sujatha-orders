// const firebase = require("firebase");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const request = require("request");
const rp = require("request-promise");
const cors = require("cors")({ origin: true });
// const fetch = require('node-fetch');

// const fs = require('fs');
// const readline = require('readline');
// const { google } = require('googleapis');

//init the app
admin.initializeApp();

//init the app
// admin.initializeApp();

//Delhivery Create Orders Call
exports.createOrders = functions.https.onRequest((req, response) => {

    // Enable CORS using the `cors` express middleware.
    return cors(req, response, async () => {

        if (req.method !== 'POST') {
            response.send(403);
            return false;
        }

        // const orderString = JSON.stringify(req.body);


        const options = {
            method: 'POST',
            url: 'https://track.delhivery.com/api/cmu/create.json',
            headers: { accept: 'application/json', 'Content-Type': 'application/json', 'Authorization' : 'Token c29933a693937c80cce30b9b730f86fe861f510b'},
            body:  "format=json&data="+JSON.stringify(req.body).replace("'",'"'),
        };

        // var orders = req.body;
        // console.log(orders);
        // sdk.testcreateOrder(req)
        // .then(response => console.log(res))
        // .catch(err => console.error(err));
        // 
        // fetch(url, options)
        // .then(res => res.json())
        // .then(json => console.log(json))
        // .catch(err => console.error('error:' + err));

        request(options, function (error, res, body) {
            if (error) throw response.status(200).send(JSON.stringify(error));
            console.log(body);
            response.status(200).send(JSON.stringify(body));
        });

        // Sending response 
        // response.status(200).send('Ok');
    });
});

