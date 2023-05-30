# MoneroAuth Web Demo
MoneroAuth web application demo

MoneroAuth web authenticator is a NodeJS package used for MoneroAuth web site authentication.

## Monero Wallet Setup
Any web app that supports MoneroAuth authentication must have access to a Monero wallet to verify signatures.

The Monero daemon (monerod) must be running, however, synchronization with the blockchain is not necessary. The daemon (moneod) can be run as:

monerod --offline –detach

The –offline parameter specifies not to attempt synchronizing with the blockchain (saves a significant amount of storage space).
--detach sends the daemon to run in the background

Once monerod is running, run an instance of the monero-wallet-rpc:

monero-wallet-rpc --rpc-bind-port 18089 --disable-rpc-login --wallet-file <FULL_PATH_TO_WALLET_FILE> --password-file <FULL_PATH_TO_WALLET_PASSWORD_FILE>

With the example above, the wallet can be used to verify signatures on port 18089.
(You can use any available port.)
The Monero CLI Wallet can be downloaded at: https://www.getmonero.org/downloads/#cli
If running on a Linux server, the monerod and monero-wallet-rpc should be run as services (systemd).
monerod.service:

[Unit]
Description=monerod.service

[Service]
Type=forking
ExecStart=/home/user/monero-v0.18.2.2/monerod --offline --detach --restricted-rpc --pidfile /tmp/monerod.pid
ExecStop=/home/user/monero-v0.18.2.2/monerod exit
PIDFile=/tmp/monerod.pid
User=user
Group=user
Restart=always
RestartSec=90

[Install]
WantedBy=multi-user.target
monero-wallet-rpc.service:

[Unit]
Description=monero-wallet-rpc.service
After=network.target monerod.service
[Service]
Type=forking
ExecStart=/home/user/monero-v0.18.2.2/monero-wallet-rpc --rpc-bind-port 18089 --disable-rpc-login --wallet-file /home/user/monero-v0.18.2.2/NAME_OF_WALLET_FILE --password-file /home/user/monero-v0.18.2.2/NAME_OF_WALLET_PASSWORD_FILE
User=user
Group=user
Restart=always
RestartSec=90

[Install]
WantedBy=multi-user.target

We have had issues with the service aborting on memory constrained systems due to amount of lockable memory. A solution for very memory constrained systems can be found in our authbot repo on github. (The authbot is typically run on single-board computers which are very memory constrained systems.)

https://github.com/MoneroAuth/authbot/tree/main

### Example: In memory caching of MoneroAuth Challenge
Go to the repository examples/default directory for usage details

### Example: Database caching of MoneroAuth Challenge  
Go to the repository examples/database directory for usage details
