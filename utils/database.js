/* DATABASE connessione per le query che restituisce un pool di connessioni*/

const mysql = require('mysql2');
/*
    const pool = mysql.createPool({
    host: 'localhost',
    database: '',
    user: 'root',
    password: 'admin',
    //debug :true
});    
*/ 

/* HEROKU CONNECTION CLEARDB */
/*
const pool = mysql.createPool({
    host: 'eu-cdbr-west-01.cleardb.com',
    database: 'heroku_a860383571f3622',
    user: 'bc5bbee6693926',
    password: '17e674c4',
    //debug :true
});
*/

/* AZURE CONNECTION DB */

const pool = mysql.createPool({
    host: 'travelscanner-dbserver.mysql.database.azure.com',
    database: 'heroku_a860383571f3622',
    user: 'travelscanneradmin',
    password: 'ts-emad2021',
    //debug :true
});


module.exports = pool.promise();

