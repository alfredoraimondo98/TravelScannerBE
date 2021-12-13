const database = require('../utils/database');
const bcrypt = require('bcryptjs');
const {format} = require('date-format-parse')
const { validationResult } = require('express-validator');
const query = require('../utils/queries')
const service = require('../utils/service');


/**
 * Restituisce le foto degli ultimi utenti registrati
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getRecentlyUsersPhoto = async (req, res, next) => {
    
    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

 
    try {
    
        const [rows_user, field_user] = await connection.query(query.getLastUsersPhoto);
        var user = rows_user; // recupera tutte le esperienze del luogo con i count relativi alla votazione di tipo "esperienza"

        user.forEach( us => {
            us.img = service.server + us.img
            //console.log("** user", user);
        })

        res.send(user);
        /*res.status(201).json({
            foto : user
        })*/
            
    }
    catch(err){ //se si verifica un errore 
        console.log("err " , err);

        res.status(401).json({
            mess : err
        })
    }
    finally{
        await connection.release(); //rilascia la connessione al termine delle operazioni 
    }
}