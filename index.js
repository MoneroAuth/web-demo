const jayson = require('jayson');
const NodeCache = require("node-cache");
const QRCode = require('qrcode');
const crypto = require('crypto');

module.exports = ((config) => {
    const myCache = new NodeCache();
        
    return {
        getChallengeDataObject: async (passedChallenge) => {
            //If a challenge is passed in we do not store
            //in node-cache.  The client app is handling the caching.

            let challenge;
            if (!passedChallenge){
                do {
                    challenge = crypto.randomUUID();
                } while (myCache.has(challenge))
                myCache.set(challenge, true, config.CHALLENGE_TTL);
            }else{
                challenge = passedChallenge;
            }

            const obj = {
                "json": "2.0",
                "method": "challenge",
                "params": {
                    "signature_verification": config.VERIFY_URL,
                    "challenge_string": challenge
                }
            };

            const message = JSON.stringify(obj);
            const streamQR = await QRCode.toString(message, {
                errorCorrectionLevel: 'H',
                type: 'svg'
            });
            return {
                error:!challenge ? Error ('No challenge present') :null,
                response:{
                    challengeNumber: challenge, 
                    qrCode: streamQR, 
                    challengeJsonMessage: message, 
                    challengeJsonObject: obj
                }
            }
        },
        verify: (challenge, id, signature, useMemoryCache = true) => {
            return new Promise((resolve, reject) => {
                const challengeValue = useMemoryCache? myCache.take(challenge):challenge;
                if (!challengeValue) {
                    resolve({
                        statusMessage: "Invalid Challenge String", 
                        success: false, 
                        response: null
                    });
                }

                const client = jayson.client.http(config.MONERO_URL);
                client.request("verify",
                    {
                        data: challenge,
                        address: id,
                        signature: signature
                    },
                    function (err, response) {
                        resolve({
                            success: response?.result?.good ?? false,
                            statusMessage: err ? err.message : "",
                            response: response
                        });
                    });
            });
        }
    }
});