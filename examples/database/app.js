/**
 * This demo application utilizes a MySQL database.
 * You could use any database you like.  You'd just need to change the 
 * database connection and the SQL calls.
 * To run this example just create a MySql table called "challenge".
 * 
 * CREATE TABLE `challenge` (
  `id` int NOT NULL AUTO_INCREMENT,
  `challenge` varchar(4096) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
)

Create a .env file containing the settings you prefer

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

# for custom challenge scheming
# you will need to configure to your specific DB
DB_HOST = "<host>"
DB_USER = "<user name>"
DB_PASSWORD = "<user password>"
DB_PORT = 3306
DB_DATABASE = "id"

 */
const express = require('express');
require('dotenv').config({ debug: true })
const session = require('express-session');
const app = express();
const MoneroAuth = require('moneroauth');
const moneroauth = MoneroAuth({
  CHALLENGE_TTL: process.env.CHALLENGE_TTL,
  MONERO_URL: process.env.MONERO_URL,
  VERIFY_URL: process.env.VERIFY_URL
});

//Use mysql to test storing challenge in db
const mysql = require('mysql2/promise');

const port = parseInt(process.env.APP_PORT);

app.set('trust proxy', 1);
app.use(session({
  secret: process.env.SESSION_KEY,
  saveUninitialized: false,
  cookie: {
    maxAge: parseInt(process.env.SESSION_TTL),
    secure: false
  },
  resave: false
}));

app.set('view engine', 'ejs');

const getDbConnection = async ()=>{
  try{
    return await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      database: process.env.DB_DATABASE
    });
  }catch(error){
    return null;
  }
}
const deleteChallnge = async (challenge)=>{
  //Delete challenge from the database
  try {
    const connection = await getDbConnection();
    await connection.execute(`Delete from challenge where challenge = ?`, [challenge])
  } catch (ignore) { }
};

app.get('/', (req, res) => {
  const currentlyLoggedIn = req.session && req.session.moneroid;
  const ejsParamsObject = {
    buttontext: currentlyLoggedIn ? "Sign Out" : "Sign In",
    buttonaction: currentlyLoggedIn ? "/signout" : "/signin",
    status: currentlyLoggedIn ? "You are currently Logged In" : "",
    statusdetails: req?.session?.statusDetails ?? "",
    // challenge: currentlyLoggedIn ? "Challenge: " + req.session.challenge : "",
    challenge: currentlyLoggedIn ? `Challenge: ${req.session.challenge}` : "",
    moneroid: currentlyLoggedIn ? `Your Id: ${req.session.moneroid}` : "",
    signature: currentlyLoggedIn ? `Signature: ${req.session.signature}` : ""
  };
  res.render('pages/index', ejsParamsObject);
});

app.get('/signin', async (req, res, next) => {
  //creating a unique "challenge"
  const getChallenge = async () => {
    let num;
    for (let i = 0; i < 9; i++) {
      num = Math.floor(Math.random() * (9000000000000 - 1000 + 1) + 1000);
    }
    return num.toString()
  };
  const connection = await getDbConnection();

  let challengeNumber;
  let insertSuccess = false;
  let tries = 0;

  do {
    try {
      challengeNumber = await getChallenge();
      await connection.execute(`INSERT INTO challenge (challenge) VALUES (?);`, [challengeNumber]);
      //create timer to delete challenge from database
      setTimeout(deleteChallnge, process.env.CHALLENGE_TTL * 1000, challengeNumber);
      insertSuccess = true;
    } catch (error) {
      tries++
    }
  } while (!insertSuccess && tries >= 10);

  const challengeData = await moneroauth.getChallengeDataObject(challengeNumber);
  res.render('pages/signin', {
    challengeData: {
      response: {
        "homeurl": process.env.HOME_URL,
        "challengeJsonMessage": challengeData.response.challengeJsonMessage || "error",
        "qrCode": challengeData.response.qrCode || "error"
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
      statusdetails: reason || "",
      challenge: "",
      moneroid: "",
      signature: ""
    });
  };

  if (!req?.query?.challenge || !req?.query?.id || !req?.query?.signature) handleError(req, res, "Invalid Verify parameters");

  const connection = await getDbConnection();

  //Delete the challenge in the Database
  const resultDelete = await connection.execute(
    `Delete from challenge where challenge = ?;`,
    [req.query.challenge]
  );
  let challengeExists;

  try{
    challengeExists = resultDelete[0].affectedRows;
  }catch(ignore){}
  finally{
    connection.end();
  }

  //if the Delete call affected no rows throw error
  if (challengeExists !== 1) handleError(req, res, "Error: Challenge does not exist in the Database.");

  //If the developer is getting and setting their own challenges in something
  //like a database or caching mechanisim they will need to pass in the false for useMemoryCache
  //the last param
  const resp = await moneroauth.verify(req.query.challenge, req.query.id, req.query.signature, false);

  if (resp?.success && resp?.response?.result?.good) {
    req.session.challenge = req.query.challenge;
    req.session.moneroid = req.query.id;
    req.session.signature = req.query.signature;
    res.redirect("/");
  } else {
    handleError(req, res, resp.statusMessage ? "Error: " + resp.statusMessage : "");
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