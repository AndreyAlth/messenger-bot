///'use strict';

const express = require('express')
const bodyParser = require('body-parser')
//const keys = require('./config/keys')

const app = express()
const port = 3000

//add access token
const TOKEN_FB = process.env.PAGE_ACCESS_TOKEN

//loading enviroment varible
require('dotenv').config()

///middleware
app.use(bodyParser.json())

//endpoint for our webhook
app.post('/webhook', (req, res)=>{
    let body = req.body

    if(body.object === 'page'){
        body.entry.forEach(function(entry){
            //gets the body of the webhook event
            let webhook_event = entry.messaging[0];
            console.log(webhook_event);

            //get the sender PSID
            let sender_psid = webhook_event.sender.id
            console.log('Sender PSID: ' + sender_psid)
        })
        res.status(200).send('Evento recibido')
    }
    else{
        res.sendStatus(404)
    }
})

//Add webhook verification
app.get('/webhook', (req, res)=>{
    //your token
    const VERIFY_TOKEN = TOKEN_FB

    //parse the query params
    const mode = req.query['hub.mode']
    const token = req.query['hub.verify_token']
    const challenge = req.query['hub.challenge']

    // Checks if a token and mode is in the query string of the request
    if(mode && token){
        if(mode === 'subscribe' && token === VERIFY_TOKEN){
            // Responds with the challenge token from the request
            console.log('Webhook_verified')
            res.status(200).send(challenge)
        }
        else{
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403)
        }
    }

})

// Handles messages events
function handleMessage(sender_psid, received_message) {

}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {

}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
  
}

//Sets server port and logs message on success
app.listen(port, ()=>{
    console.log('webhook listen')
})