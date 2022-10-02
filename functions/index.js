// const firebase = require("firebase");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const request = require("request");
const rp = require("request-promise");
const cors = require("cors")({ origin: true });


//init the app
admin.initializeApp();


//Delhivery Create Orders Call
exports.createOrders = functions.https.onRequest((req, response) => {

    // Enable CORS using the `cors` express middleware.
    return cors(req, response, async () => {

        if (req.method !== 'POST') {
            response.send(403);
            return false;
        }

        var vendor = req.headers.vendor;

        console.log(vendor);
        
        var token = 'Token c29933a693937c80cce30b9b730f86fe861f510b';

        if(vendor == '2') {
            token = 'Token cc9bbd99e6bf66d3921ebd7cd5d7de9c2798afbe';
        }

        const options = {
            method: 'POST',
            url: 'https://track.delhivery.com/api/cmu/create.json',
            headers: { accept: 'application/json', 'Content-Type': 'application/json', 'Authorization' : token},
            body:  "format=json&data="+JSON.stringify(req.body).replace("'",'"'),
        };

        request(options, function (error, res, body) {
            if (error) throw response.status(200).send(JSON.stringify(error));
            console.log(body);
            response.status(200).send(JSON.stringify(body));
        });

    });
});

