### Example: Database caching of MoneroAuth Challenge  
Web Site that caches the MoneroAuth Challenge in MySQL database.

### Instructions
This demo application utilizes a MySQL database.
You could use any database you like.  You'd just need to change the 
database connection and the SQL calls.
To run this example create a MySql table called "challenge".
  
```javascript
CREATE TABLE `challenge` (
`id` int NOT NULL AUTO_INCREMENT,
`challenge` varchar(4096) DEFAULT NULL,
`created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (`id`))
```
Modify the .env file with your specific parameters.

Run
```javascript
npm install
node app
``` 

