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

 
    await connection.beginTransaction(async function (err) { //avvia una nuova transazione
        if (err) { throw err; }
    });


    try {
    
        const [rows_user, field_user] = await connection.query(query.getLastUsersPhoto);
        var users = rows_user; // recupera tutte le esperienze del luogo con i count relativi alla votazione di tipo "esperienza"

        users.forEach( us => {
            us.img = service.server + us.img
            //console.log("** user", user);
        })


        
        var userLimited = []; //array degli ultimi 10 utenti
        if(users.length < 10){
            userLimited = users;
        }
        for(let i = 0; i < 10; i++){
            userLimited.push(users[i]);
        } 

        res.send(userLimited);

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

/**
 * Restituisce le informazioni del mi profilo
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getMyProfile = async (req, res, next) => {

    var idUtente = req.body.id_utente;

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    try {
    
        const [rows_user, field_user] = await connection.query(query.getUserById, [idUtente]);
        var user = rows_user[0]; // recupera le informazioni dell'utente loggato
         
       //Aggiornamento path img
        user.img = service.server + user.img
            
        res.status(201).send(user);
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


/**
 * Restituisce le esperienze dell'utente
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
 exports.getMyExperiences = async (req, res, next) => {

    var idUtente = req.body.id_utente;

    var promisesArray = [];
    var experiences = [];

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    try {
    
        const [rows_experiences, field_experiences] = await connection.query(query.getMyExperience, [idUtente]);
        var experiences = rows_experiences; // recupera tutte le esperienze dell'utente loggato
        
         experiences.forEach( exp => {
            experiences.foto_copertina = service.server + exp.foto_copertina
         })


         try{ 
            experiences.forEach( async (exp) => {
                    new Promise(async (resolve, reject) => {
                        var res = connection.query(query.getMyGalleryByExperience, [exp.id_esperienza]);; //recupera le gallery di tutte le esperienze dell'utente
                        resolve(res); //memorizza il risultato nella resolve
                        promisesArray.push(res) //inserisce la promise nell'array
                    })
            })
        }
        catch(err){
            console.log("err " , err);
            await connection.rollback(); //effettua il commit delle transazioni
    
            res.status(401).json({
                mess : err
            })
        }
 
        //risolve le promise
        Promise.all(promisesArray).then( (results) => {

            for( let i = 0 ; i < promisesArray.length; i++){
                experiences[i]['gallery'] = results[i][0]; //associa ad ogni esperienza la relativa gallery
            
            };

            experiences.forEach( (exp) => {
                var gallery = exp.gallery;

                gallery.forEach( (g) => { 
                    exp.gallery.path = service.server + exp.path; //aggiornamento path img per ogni foto della gallery
                })
            })
        })

       

        await connection.commit(); //effettua il commit delle transazioni


        res.send(experiences);
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
