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

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    esperienzeDelLuogo = []; 

    try {
    
    
        const[rows_exp, field_exp]= await connection.query(query.getExperiencesByUser,[idUtente]) //recupera le esperienze dell'utente
        var experiences = rows_exp;

        const [rows_countEsperienze, field_countEsperienze] = await connection.query(query.getEsperienzeCountByLuogo, [idUtente]);
        var experiencesCount = rows_countEsperienze; // recupera i count_esperienza per le esperienze dell'utente

        const[rows_gallery, field_gallery] = await connection.query(query.getGalleryByEsperienzeOfUser, [idUtente]) //recupera le gallery delle esperienze dell'utente
        var galleryComplete = rows_gallery;

    
        console.log("*** ex1", experiences);
        console.log("*** ex2 ", experiencesCount);

        console.log("*** ex3 ", galleryComplete);

        /*
        //AGGIUNTA COUNT ESPERIENZA
        experiences.forEach( exp => { //merge dati dell'esperienza con i dati del count dei voti
            exp['count_esperienza'] = 0;
            experiencesCount.forEach( count => {
                if(exp.id_esperienza == count.id_esperienza){
                    exp['count_esperienza'] = count.count_esperienza;
                }
            })
        })


        //AGGIUNTA GALLERY ESPERIENZA
        experiences.forEach( exp => {  
            exp.img = service.server+exp.img; //Immagine utente
            exp.foto_copertina = service.server+exp.foto_copertina //immagine copertina
            exp['gallery'] = [];
            galleryComplete.forEach( gallery => {
                if(exp.id_esperienza == gallery.id_esperienza){
                   // console.log("*** GALLERY ", exp.gallery);
                    exp.gallery.push(service.server+gallery.path); //immagine gallery
                }
            })
        })

       //ordinamento in base al count_esperienza (dall'esperienza più votata alla meno votata)
        experiences.sort( function(a, b) {
            return b.count_esperienza - a.count_esperienza
        })
        
        */
        
        res.status(201).json({
            esperienze : experiences
        })
            
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
