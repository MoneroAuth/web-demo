## Example: Database caching of MoneroAuth Challenge  
This demo shows how to securely authenticate web users utilizing an open source, permissionless self-sovereign identity with the MoneroAuth protocol. Users do not have to provide any personal information, and if they do it's their decision to do so. MoneroAuth enables the ability to anonymously authenticate to any web app supporting MoneroAuth.

### Instructions
This demo application utilizes a MySQL database for MoneroAuth challenge caching.
You could use any database you like.  You'd just need to change the database connection setting and the SQL calls.
To run this example as is create a MySql table called "challenge".
  
```javascript
CREATE TABLE `challenge` (
`id` int NOT NULL AUTO_INCREMENT,
`challenge` varchar(4096) DEFAULT NULL,
`created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (`id`))
```
Modify the .env file with your specific settings.

#### Install dependencies
```javascript
npm install
``` 

#### Run
```javascript
node app
``` 

