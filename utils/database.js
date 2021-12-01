/* DATABASE connessione per le query che restituisce un pool di connessioni*/

const mysql = require('mysql2');
/*
    const pool = mysql.createPool({
    host: 'localhost',
    database: 'ilmonaco',
    user: 'root',
    password: 'admin',
    //debug :true
});    
*/ 

/* HEROKU CONNECTION CLEARDB */
/*
const pool = mysql.createPool({
    host: 'eu-cdbr-west-01.cleardb.com',
    database: 'heroku_4bb05fc1cdbaab4',
    user: 'b458910b5789bd',
    password: '10ec26b0'
});
*/

module.exports = pool.promise();

