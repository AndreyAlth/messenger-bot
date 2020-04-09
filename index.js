///'use strict';

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
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

            //Check if the event is a message or a postback and
            //pass the event to the appropriate handler function
            if(webhook_event.message){
                handleMessage(sender_psid, webhook_event.message)
            }
            else if(webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback)
            }
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
    let response;
    //check if the message contains text
    if(received_message.text){
        //create the payload for a basic text message, which
        //will be added to the body of our request to the send API
        response = {
            "text": `You sent the message: "${received_message.text}". Now send me an attachment`
        }
    }
    //check if message contains image
    else if (received_message.attachments) {
        //Gets the URL of the message attachment
        let attachment_url = received_message.attachments[0].payload.url
        response = {
            "attachment":{
                "type":"template",
                "payload":{
                    "template_type": "generic",
                    "elements":[{
                        "title": "Is this the right picture?",
                        "subtitle":"Tap a button to answer.",
                        "image_url":attachment_url,
                        "buttons":[
                            {
                                "type":"postback",
                                "title":"Yes!",
                                "payload": "yes",
                            },
                            {
                                "type":"postback",
                                "title": "No!",
                                "payload":"no"
                            }
                        ]
                    }]
                }
            }
        }

    }

    //send the response message
    callSendAPI(sender_psid, response)

}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
    let response;

    //Get the payload for the postback
    let payload = received_postback.payload

    //Set the response based on the postback payload
    if(payload == 'yes'){
        response = { "text": "Thanks!" }
    }
    else if (payload == 'no'){
        response = { "text": "Oops, try sending another image."}
    }
    //Send the message to acknowledge the postback
    callSendAPI(sender_psid, response)

}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
    //construct the message body
    let request_body = {
        "recipient":{
            "id": sender_psid
        },
        "message": response
    }

    //Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs":{"access_token": process.env.TOKEN_FB},
        "method": "POST",
        "json": request_body
    },(err, res, body)=>{
        if(!err){
            console.log('message sent!')
        }
        else{
            console.error("Unable to sent message: "+ err)
        }
    })
  
}

//Sets server port and logs message on success
app.listen(port, ()=>{
    console.log('webhook listen')
})