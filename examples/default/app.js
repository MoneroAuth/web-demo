/**
Modify your .env file to your settings

# Session Secret Key for express-session. Used for express session
SESSION_KEY = "thisismysecrctekeyfhrgfgrfrty84fwir767"

# App Port, port to run the node app
APP_PORT = 3066

# SESSION TTL, expires in milliseconds
SESSION_TTL = 900000

# Challenge Cache TTL, the challenge will expire in seconds
CHALLENGE_TTL = 180

# URL to navigate to if a challenge times out
# example HOME_URL = "http://myurl.com:3066"
HOME_URL = "<url>"

# Verify URL demo.moneroauth.  The url of the Verification endpoint.
# example VERIFY_URL = "http://yoururl.com:3066/verify"
VERIFY_URL = "<url>"

# Monero endpoint
# example MONERO_URL = "http://127.0.0.1:18089/json_rpc"
MONERO_URL = "<url>"
 */
const express = require('express');
require('dotenv').config({debug: true})
const session = require('express-session');
const app = express();
const MoneroAuth = require('moneroauth');
const moneroauth = MoneroAuth({
  CHALLENGE_TTL:process.env.CHALLENGE_TTL,
  MONERO_URL:process.env.MONERO_URL,
  VERIFY_URL:process.env.VERIFY_URL
});

const port = parseInt(process.env.APP_PORT);

app.set('trust proxy', 1);
app.set('view engine', 'ejs');

app.use(session({
  secret: process.env.SESSION_KEY,
  saveUninitialized: false,
  cookie: {
    maxAge: parseInt(process.env.SESSION_TTL),
    secure: false
  },
  resave: false
}));

app.get('/', (req, res) => {
  const currentlyLoggedIn = req.session && req.session.moneroid;
  const ejsParamsObject = {
    buttontext: currentlyLoggedIn ? "Sign Out" : "Sign In",
    buttonaction: currentlyLoggedIn ? "/signout" : "/signin",
    status: currentlyLoggedIn ? "You are currently Logged In" : "",
    statusdetails: req?.session?.statusDetails ?? "",
    challenge: currentlyLoggedIn ? `Challenge: ${req.session.challenge}` : "",
    moneroid: currentlyLoggedIn ? `Your Id: ${req.session.moneroid}` : "",
    signature: currentlyLoggedIn ? `Signature: ${req.session.signature}` : ""
  };
  res.render('pages/index', ejsParamsObject);
});

app.get('/signin', async (req, res, next) => {
  const challengeData = await moneroauth.getChallengeDataObject();
  res.render('pages/signin', {
    challengeData:{
      response:{
        "homeurl": process.env.HOME_URL,
        "challengeJsonMessage":challengeData.response.challengeJsonMessage,
        "qrCode":challengeData.response.qrCode
      }
    }
  });
});

app.get('/verify', async (req, res) => {
  const handleError = (request, response, reason) => {
    if (request.session) request.session.destroy();
    response.render('pages/index', {
      buttontext: "Sign In",
      buttonaction: "/signin",
      status: "Access Denied!",
      statusdetails:reason || "",
      challenge: "",
      moneroid: "",
      signature: ""
    });
  };
  if (!req?.query?.challenge || !req?.query?.id || !req?.query?.signature) handleError(req, res, "Invalid Verify parameters");

  const resp = await moneroauth.verify(req.query.challenge,req.query.id,req.query.signature);

  if (resp?.success && resp?.response?.result?.good){
    req.session.challenge = req.query.challenge;
    req.session.moneroid = req.query.id;
    req.session.signature = req.query.signature;
    res.redirect("/");
  }else{
    handleError(req, res, resp.statusMessage ? "Error: "+ resp.statusMessage:"");
  }
});

app.get('/signout', async (req, res, next) => {
  try {
    req.session.destroy();
  } catch (ignore) { }
  finally {
    res.redirect("/");
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});