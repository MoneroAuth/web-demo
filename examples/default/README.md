### Example: In memory caching of MoneroAuth Challenge
examples/default, in memory caching of MoneroAuth Challenge.

### Instructions
Create a .env file in the root.

Add your own setting's for the .env entries below

```javascript
# Session Secret Key for express-session
SESSION_KEY = "thisismysecrctekeyfhrgfgrfrty84fwir767"

# App Port
APP_PORT = 3066

# SESSION TTL, expires in milliseconds
SESSION_TTL = 900000

# Challenge Cache TTL, expire in seconds
CHALLENGE_TTL = 180

# URL to navigate to if a challenge times out
# This is for redirect purpose
HOME_URL = "http://<YOUR URL>"

# Verify URL demo.moneroauth 
# This is for redirect from the signing message to the Verify endpoint.
VERIFY_URL = "http://<YOUR URL>"

# Monero endpoint
MONERO_URL = "http://127.0.0.1:18089/json_rpc"
```
