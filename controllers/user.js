const database = require('../utils/database');
const bcrypt = require('bcryptjs');
const {format} = require('date-format-parse')
const { validationResult, body } = require('express-validator');
const query = require('../utils/queries')
const service = require('../utils/service');
var randomstring = require("randomstring");
const transporter = require('../utils/mail');
const { param } = require('../routes/user');
 
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
        else{
            for(let i = 0; i < 10; i++){
                userLimited.push(users[i]);
            } 
        }
        

        res.status(201).send(userLimited);

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

        const [rows_countEsperienze, field_countEsperienze] = await connection.query(query.getEsperienzeCountByUser, [idUtente]);
        var experiencesCount = rows_countEsperienze; // recupera i count_esperienza per le esperienze dell'utente

        const[rows_gallery, field_gallery] = await connection.query(query.getGalleryByEsperienzeOfUser, [idUtente]) //recupera le gallery delle esperienze dell'utente
        var galleryComplete = rows_gallery;

    
        //console.log("*** ex1", experiences);
        //console.log("*** ex2 ", experiencesCount);

        //console.log("*** ex3 ", galleryComplete);

        
        //AGGIUNTA COUNT ESPERIENZA
        experiences.forEach( exp => { //merge dati dell'esperienza con i dati del count dei voti
            exp['count_esperienza'] = 0;
            experiencesCount.forEach( count => {
                if(exp.id_esperienza == count.id_esperienza){
                    exp['count_esperienza'] = count.count_esperienza;
                    exp['id_luogo'] = count.id_luogo;
                }
            })
        })


        //AGGIUNTA GALLERY ESPERIENZA
        experiences.forEach( exp => {  
            //exp.img = service.server+exp.img; //Immagine utente
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
            return b.data_creazione - a.data_creazione
        })
        


         // Recupera informazioni dei like dell'utente loggato
         var promisesArray = [];
         var promisesArrayLikedUser = []; //array promises utenti che hanno messo like a ogni esperienza
         experiences.forEach(async exp => {
             
                 var p = new Promise(async (resolve, reject) => {
                     const [rows, field] = await connection.query(query.verifyVotoTipo, [idUtente, exp.id_esperienza, 'esperienza']);
                     if(rows[0] != undefined){
                         resolve(true);  
                         //resultsVoteVerify.push(rows[0].voto);
                     }
                     else{
                         resolve(false);  
                         //resultsVoteVerify.push(0);
                     }
                 })
 
                 promisesArray.push(p);


                 //Query per ottenere gli utenti che hanno messo like all'esperienza
                var pLikedUser = new Promise(async (resolve, reject) => {
                    const [rows, field] = await connection.query(query.getLikedUsers, [exp.id_esperienza, 'esperienza']); //NB. specificare il tipo di voto che si vuole considerare (esperienza || fotoCopertina || fotoGallery)
                    if(rows[0] != undefined){
                        resolve(rows);  
                        //resultsVoteVerify.push(rows[0].voto);
                    }
                    else{
                        resolve(false);  
                        //resultsVoteVerify.push(0);
                    }
                })

                promisesArrayLikedUser.push(pLikedUser);
         });
 

        var resLikedUser = await Promise.all(promisesArrayLikedUser); //risolve la promise per gli utenti che hanno messo like all'esperienza
        var likedUserArray = [].concat.apply([], resLikedUser); //trasforma l'array di array in un singolo array
        
     
         Promise.all(promisesArray).then( (values) => {

             //Conversione data
             for(let i = 0; i < experiences.length; i++){

                 experiences[i].liked_user = []; //inizializza array liked_user contenente gli utenti che hanno messo like all'esperienza 


                 //voto esperienza per l'utente loggato (true|false) 
                 experiences[i]['flag_voto_esperienza'] = values[i];


                 //Aggiunta della lista di utenti che hanno messo like all'esperienza
                likedUserArray.forEach( likedUser => {
                    
                    if(experiences[i].id_esperienza == likedUser.id_esperienza && likedUser != false){ //inserisce l'utente che ha messo like all'esperienza
                    //console.log("*** liked", likedUser.nome)

                        experiences[i].liked_user.push({
                            'id_utente' : likedUser.id_utente,
                            'nome' : likedUser.nome,
                            'cognome' : likedUser.cognome,
                            'email' : likedUser.email,
                            'badge' : likedUser.badge,
                            'img' : service.server+likedUser.img
                        }) 
                    }
                })
 
                 //data
                 let dataC = (experiences[i].data_creazione.toISOString().slice(0,10)); //Conversione data
                 let y= dataC.slice(0,4)
                 let m = dataC.slice(5,7);
                 let d = dataC.slice(8-10);
                 experiences[i].data_creazione = d+"-"+m+"-"+y;
             }
 
 
            // console.log("**** ", experiences)
 
             res.status(201).send(experiences);
 
 
         });
    
        
       
            
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
 * Restituisce le esperienze di un utente (con idUtente) e il flagVoto dell'utente loggato (idMyUtente)
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
 exports.getUserExperiencesWithMyVote = async (req, res, next) => {

    var idUtente = req.body.id_utente;
    var idMyUtente = req.body.id_my_utente;

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    esperienzeDelLuogo = []; 

    try {
    
    
        const[rows_exp, field_exp]= await connection.query(query.getExperiencesByUser,[idUtente]) //recupera le esperienze dell'utente
        var experiences = rows_exp;

        const [rows_countEsperienze, field_countEsperienze] = await connection.query(query.getEsperienzeCountByUser, [idUtente]);
        var experiencesCount = rows_countEsperienze; // recupera i count_esperienza per le esperienze dell'utente

        const[rows_gallery, field_gallery] = await connection.query(query.getGalleryByEsperienzeOfUser, [idUtente]) //recupera le gallery delle esperienze dell'utente
        var galleryComplete = rows_gallery;

    
        //console.log("*** ex1", experiences);
        //console.log("*** ex2 ", experiencesCount);

        //console.log("*** ex3 ", galleryComplete);

        
        //AGGIUNTA COUNT ESPERIENZA
        experiences.forEach( exp => { //merge dati dell'esperienza con i dati del count dei voti
            exp['count_esperienza'] = 0;
            experiencesCount.forEach( count => {
                if(exp.id_esperienza == count.id_esperienza){
                    exp['count_esperienza'] = count.count_esperienza;
                    exp['id_luogo'] = count.id_luogo;
                }
            })
        })


        //AGGIUNTA GALLERY ESPERIENZA
        experiences.forEach( exp => {  
            //exp.img = service.server+exp.img; //Immagine utente
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
            return b.data_creazione - a.data_creazione
        })
        


         // Recupera informazioni dei like dell'utente loggato
         var promisesArray = [];
         var promisesArrayLikedUser = []; //array promises utenti che hanno messo like a ogni esperienza
         experiences.forEach(async exp => {
             
                 var p = new Promise(async (resolve, reject) => {
                     const [rows, field] = await connection.query(query.verifyVotoTipo, [idMyUtente, exp.id_esperienza, 'esperienza']);
                     if(rows[0] != undefined){
                         resolve(true);  
                         //resultsVoteVerify.push(rows[0].voto);
                     }
                     else{
                         resolve(false);  
                         //resultsVoteVerify.push(0);
                     }
                 })
 
                 promisesArray.push(p);


                 //Query per ottenere gli utenti che hanno messo like all'esperienza
                var pLikedUser = new Promise(async (resolve, reject) => {
                    const [rows, field] = await connection.query(query.getLikedUsers, [exp.id_esperienza, 'esperienza']); //NB. specificare il tipo di voto che si vuole considerare (esperienza || fotoCopertina || fotoGallery)
                    if(rows[0] != undefined){
                        resolve(rows);  
                        //resultsVoteVerify.push(rows[0].voto);
                    }
                    else{
                        resolve(false);  
                        //resultsVoteVerify.push(0);
                    }
                })

                promisesArrayLikedUser.push(pLikedUser);
         });
 

        var resLikedUser = await Promise.all(promisesArrayLikedUser); //risolve la promise per gli utenti che hanno messo like all'esperienza
        var likedUserArray = [].concat.apply([], resLikedUser); //trasforma l'array di array in un singolo array
        
     
         Promise.all(promisesArray).then( (values) => {

             //Conversione data
             for(let i = 0; i < experiences.length; i++){

                 experiences[i].liked_user = []; //inizializza array liked_user contenente gli utenti che hanno messo like all'esperienza 


                 //voto esperienza per l'utente loggato (true|false) 
                 experiences[i]['flag_voto_esperienza'] = values[i];


                 //Aggiunta della lista di utenti che hanno messo like all'esperienza
                likedUserArray.forEach( likedUser => {
                    
                    if(experiences[i].id_esperienza == likedUser.id_esperienza && likedUser != false){ //inserisce l'utente che ha messo like all'esperienza
                    //console.log("*** liked", likedUser.nome)

                        experiences[i].liked_user.push({
                            'id_utente' : likedUser.id_utente,
                            'nome' : likedUser.nome,
                            'cognome' : likedUser.cognome,
                            'email' : likedUser.email,
                            'badge' : likedUser.badge,
                            'img' : service.server+likedUser.img
                        }) 
                    }
                })
 
                 //data
                 let dataC = (experiences[i].data_creazione.toISOString().slice(0,10)); //Conversione data
                 let y= dataC.slice(0,4)
                 let m = dataC.slice(5,7);
                 let d = dataC.slice(8-10);
                 experiences[i].data_creazione = d+"-"+m+"-"+y;
             }
 
 
            // console.log("**** ", experiences)
 
             res.status(201).send(experiences);
 
 
         });
    
        
       
            
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
 * Restituisce le esperienze dell'utente per uno specifico luogo
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
 exports.getMyExperienceByPlace = async (req, res, next) => {

    var idUtente = req.body.id_utente;
    var idLuogo = req.body.id_luogo;

    //console.log("*** ", idUtente, idLuogo);

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    esperienzeDelLuogo = []; 

    try {
    
    
        const[rows_exp, field_exp]= await connection.query(query.getExperiencesByUserAndLuogo,[idLuogo, idUtente]) //recupera le esperienze dell'utente
        var experiences = rows_exp;

        const [rows_countEsperienze, field_countEsperienze] = await connection.query(query.getEsperienzeCountByUserAndPlace, [idUtente, idLuogo]);
        var experiencesCount = rows_countEsperienze; // recupera i count_esperienza per le esperienze dell'utente

        const[rows_gallery, field_gallery] = await connection.query(query.getGalleryByEsperienzeOfUserByPlace, [idUtente, idLuogo]) //recupera le gallery delle esperienze dell'utente
        var galleryComplete = rows_gallery;

    
        //console.log("*** ex1", experiences);
        //console.log("*** ex2 ", experiencesCount);

        //console.log("*** ex3 ", galleryComplete);



        
        //AGGIUNTA COUNT ESPERIENZA
        experiences.forEach( exp => { //merge dati dell'esperienza con i dati del count dei voti
            exp['count_esperienza'] = 0;
            experiencesCount.forEach( count => {
                if(exp.id_esperienza == count.id_esperienza){
                    exp['count_esperienza'] = count.count_esperienza;
                    exp['id_luogo'] = count.id_luogo;
                }
            })
        })


        //AGGIUNTA GALLERY ESPERIENZA
        experiences.forEach( exp => {  
            //exp.img = service.server+exp.img; //Immagine utente
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
            return b.data_creazione - a.data_creazione
        })
        
        

        // Recupera informazioni dei like dell'utente loggato
        var promisesArray = [];
        var promisesArrayLikedUser = []; //array promises utenti che hanno messo like a ogni esperienza
        experiences.forEach(async exp => {
            
                var p = new Promise(async (resolve, reject) => {
                    const [rows, field] = await connection.query(query.verifyVotoTipo, [idUtente, exp.id_esperienza, 'esperienza']);
                    if(rows[0] != undefined){
                        resolve(true);  
                        //resultsVoteVerify.push(rows[0].voto);
                    }
                    else{
                        resolve(false);  
                        //resultsVoteVerify.push(0);
                    }
                })

                promisesArray.push(p);


                //Query per ottenere gli utenti che hanno messo like all'esperienza
                var pLikedUser = new Promise(async (resolve, reject) => {
                    const [rows, field] = await connection.query(query.getLikedUsers, [exp.id_esperienza, 'esperienza']); //NB. specificare il tipo di voto che si vuole considerare (esperienza || fotoCopertina || fotoGallery)
                    if(rows[0] != undefined){
                        resolve(rows);  
                        //resultsVoteVerify.push(rows[0].voto);
                    }
                    else{
                        resolve(false);  
                        //resultsVoteVerify.push(0);
                    }
                })

                promisesArrayLikedUser.push(pLikedUser);

        });


        var resLikedUser = await Promise.all(promisesArrayLikedUser); //risolve la promise per gli utenti che hanno messo like all'esperienza
        var likedUserArray = [].concat.apply([], resLikedUser); //trasforma l'array di array in un singolo array
        
    
        Promise.all(promisesArray).then( (values) => {
            //resultsVoteVerify.push(values);

            //Conversione data
            for(let i = 0; i < experiences.length; i++){

                experiences[i].liked_user = []; //inizializza array liked_user contenente gli utenti che hanno messo like all'esperienza 

                //voto esperienza per l'utente loggato (true|false)
                experiences[i]['flag_voto_esperienza'] = values[i];

                //Aggiunta della lista di utenti che hanno messo like all'esperienza
                likedUserArray.forEach( likedUser => {
                    
                    if(experiences[i].id_esperienza == likedUser.id_esperienza && likedUser != false){ //inserisce l'utente che ha messo like all'esperienza
                    //console.log("*** liked", likedUser.nome)

                        experiences[i].liked_user.push({
                            'id_utente' : likedUser.id_utente,
                            'nome' : likedUser.nome,
                            'cognome' : likedUser.cognome,
                            'email' : likedUser.email,
                            'badge' : likedUser.badge,
                            'img' : service.server+likedUser.img
                        }) 
                    }
                })

                //data
                let dataC = (experiences[i].data_creazione.toISOString().slice(0,10)); //Conversione data
                let y= dataC.slice(0,4)
                let m = dataC.slice(5,7);
                let d = dataC.slice(8-10);
                experiences[i].data_creazione = d+"-"+m+"-"+y;
            }


           // console.log("**** ", experiences)

            res.status(201).send(experiences);


        });



              
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
 * UPDATE DATI PROFILO
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
exports.updateMyProfile = async (req, res, next) =>{

    const errors = validationResult(req);

    if(!errors.isEmpty()){ //verifica parametri sulla base dei controlli inseriti come middleware nella routes
        return res.status(422).json({
            message : 'Error input Parametri',
            error : errors.array()
        });
    }
    
    var idUtente = req.body.id_utente;
    var nome = req.body.nome;
    var cognome = req.body.cognome;
    var email = req.body.email;
    var password = req.body.password;
    var img;
    if(req.file){
        img = req.file.path.slice(6)  //recupera path relativo dell'img (in req.file) 
    }
    else{
        img = null;
    }

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    try {
    
        //Aggiornamento campi
    
        if(nome != null && nome != undefined){
            const[rows_exp, field_exp]= await connection.query(query.updateMyName,[nome, idUtente]) //aggiorna nome utente
        }

        if(cognome != null && cognome != undefined){
            const[rows_exp, field_exp]= await connection.query(query.updateMySurname,[cognome, idUtente]) //aggiorna cognome utente
        }

        if(email != null && email != undefined){
            const[rows_exp, field_exp]= await connection.query(query.updateMyEmail,[email, idUtente]) //aggiorna email utente
        }

        if(password != null && password != undefined){
            let hashedPassword = await bcrypt.hash(req.body.password, 12);
            const[rows_exp, field_exp]= await connection.query(query.updateMyPassword,[hashedPassword, idUtente]) //aggiorna password utente
        }

        if(img != null && img != undefined){
            const[rows_exp, field_exp]= await connection.query(query.updateMyImgProfile,[img, idUtente]) //aggiorna img profilo utente
        }


        
        res.status(201).json({
            mess : 'dati aggiornati correttamente'
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




/**
 * UPDATE IMG
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
 exports.updateImg = async (req, res, next) =>{
    
    var idUtente = req.body.id_utente;
    var img;

    if(req.file){
        img = req.file.path.slice(6)  //recupera path relativo dell'img (in req.file) 
        img = img.replace(/\\/g, "/"); 
    }
    else{
        img = null;
    }

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    try {
    
        //Aggiornamento campi

        if(img != null && img != undefined){
            const[rows_exp, field_exp]= await connection.query(query.updateMyImgProfile,[img, idUtente]) //aggiorna img profilo utente
        }

        
        res.status(201).json({
            mess : 'dati aggiornati correttamente'
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

/**
 * UPDATE NAME
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
exports.updateName = async (req, res, next) => {

    const errors = validationResult(req);

    if(!errors.isEmpty()){ //verifica parametri sulla base dei controlli inseriti come middleware nella routes
        return res.status(422).json({
            message : 'Error input Parametri',
            error : errors.array()
        });
    }
    
    var idUtente = req.body.id_utente;
    var nome = req.body.nome;
    
    console.log("*********** ", idUtente, nome)


    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    try {
    
        //Aggiornamento campi
    
        if(nome != null && nome != undefined){
            const[rows_exp, field_exp]= await connection.query(query.updateMyName,[nome, idUtente]) //aggiorna nome utente
        }

        connection.commit();
        
        res.status(201).json({
            mess : 'dati aggiornati correttamente'
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


/**
 * UPDATE SURNAME
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
exports.updateSurname = async (req, res, next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){ //verifica parametri sulla base dei controlli inseriti come middleware nella routes
        return res.status(422).json({
            message : 'Error input Parametri',
            error : errors.array()
        });
    }
    
    var idUtente = req.body.id_utente;
    var cognome = req.body.cognome;
    
     

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    try {
    
        //Aggiornamento campi
    
        if(cognome != null && cognome != undefined){
            const[rows_exp, field_exp]= await connection.query(query.updateMySurname,[cognome, idUtente]) //aggiorna nome utente
        }
        
        res.status(201).json({
            mess : 'dati aggiornati correttamente'
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




/**
 * UPDATE EMAIL
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
 exports.updateEmail = async (req, res, next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){ //verifica parametri sulla base dei controlli inseriti come middleware nella routes
        return res.status(422).json({
            message : 'Error input Parametri',
            error : errors.array()
        });
    }
    
    var idUtente = req.body.id_utente;
    var email = req.body.email;

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    try {
    
        //Aggiornamento campi
        if(await verifyMail(email)){ //se la mail è già presente viene restituito TRUE e non si può procedere alla registrazione
            res.status(401).json({
                mess : 'email già presente'
            })
        }
        else if(email != null && email != undefined){
            const[rows_exp, field_exp]= await connection.query(query.updateMyEmail,[email, idUtente]) //aggiorna nome utente

            res.status(201).json({
                mess : 'dati aggiornati correttamente'
            })
        }
        
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
 * verifica se la mail in fase di registrazione è già presente
 * @param {*} email 
 * @returns True : mail già presente ; False : mail non presente (può proseguire alla registrazione)
 */
 async function verifyMail(email){

    const [rows, field] = await database.query(query.verifyMail, [email]); //verifica se la mail è presente
    console.log("rows", rows)

    if(rows.length == 0){ //se la risposta non contiene nessun risultato allora la mail non è presente;
        console.log("*** MAIL NON PRESENTE");
        return false; //email non presente: può proseguire con la registrazione;
    }
    else{
        return true; //mail già presente: non può procedere alla registrazione
    }
}

/**
 * UPDATE FOTO PROFILO
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
exports.updateImgProfile = async (req, res, next) =>{

    const errors = validationResult(req);

    if(!errors.isEmpty()){ //verifica parametri sulla base dei controlli inseriti come middleware nella routes
        return res.status(422).json({
            message : 'Error input Parametri',
            error : errors.array()
        });
    }
    
  
    var img;
    if(req.file){
        img = req.file.path.slice(6)  //recupera path relativo dell'img (in req.file) 
    }
    else{
        img = null;
    }

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    try {
    
        //Aggiornamento campi
     

        if(img != null && img != undefined){
            const[rows_exp, field_exp]= await connection.query(query.updateMyImgProfile,[img, idUtente]) //aggiorna img profilo utente
        }


        
        res.status(201).json({
            mess : 'dati aggiornati correttamente'
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


/**
 * verifica password attuale
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
exports.checkPassword = async (req, res, next) => {

    const errors = validationResult(req);

    if(!errors.isEmpty()){ //verifica parametri sulla base dei controlli inseriti come middleware nella routes
        return res.status(422).json({
            message : 'Error input Parametri',
            error : errors.array()
        });
    }
    
    var idUtente = req.body.id_utente;
    var password = req.body.password;
    
    console.log("*** CHECK PASSWORD ", password);

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    try {

        const [rows, field] = await database.query(query.getUserById, [idUtente]);
        loginUser = rows[0];


        //Verifica password
        if(! (await bcrypt.compare(password, loginUser.password)) ){ //Verifica se le due password non corrispondono
            return res.status(401).json({
                message : 'Non autorizzato: password errata!' //nega l'accesso
            })
        }
      

        res.status(201).send(true); //restituisce true se può procedere all'aggiornamento della password
        
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
 * UPDATE PASSWORD
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
 exports.updatePassword = async (req, res, next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){ //verifica parametri sulla base dei controlli inseriti come middleware nella routes
        return res.status(422).json({
            message : 'Error input Parametri',
            error : errors.array()
        });
    }
    
    var idUtente = req.body.id_utente;
    var password = await bcrypt.hash(req.body.password, 12);

    console.log("****  PASSWORD DA AGGIORNARE", password);
    

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    try {
        //Aggiornamento campi
    
        if(password != null && password != undefined){
            const[rows_exp, field_exp]= await connection.query(query.updateMyPassword,[password, idUtente]) //aggiorna password utente
        }
        
        res.status(201).json({
            mess : 'dati aggiornati correttamente'
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


exports.getCountLike = async (req, res, next) => {

    var idUtente = req.body.id_utente;
    

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    try {  
        
        const [rows, field] = await connection.query(query.getCountLikeByUser, [idUtente]);
        res.status(201).json({
            count_like : rows[0].somma_voti_esperienze
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


exports.getCountPost = async (req, res, next) => {

    var idUtente = req.body.id_utente;

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    try {  
        const [rows, field] = await connection.query(query.getCountPostByIdUser, [idUtente]);
        var count = rows[0].count;
        console.log("*** count ", count);

        res.status(201).json({
            count_post : count
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



/**
 * procedura di password dimendicata che prevede la generazione di una password random di 8 caratteri
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
 exports.forgottenPassword = async (req, res, next) => {

    var email = req.body.email;
   // console.log("*** email ", email);

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    await connection.beginTransaction(async function (err) { //avvia una nuova transazione
        if (err) { throw err; }
    });


    try {
        const [rows, field] = await connection.query(query.getUserByEmail, [email]); //recupera utente con la mail indicata, se presente
        if(rows[0] == undefined){
            return res.status(401).json({
                mess : 'email non corretta'
            })
        }
        var idUtente = rows[0].id_utente;

        var newRandomPassword;
        alphanumericRegexPassword = new RegExp('^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+){8,255}');
        do{
            //genera una password di 8 caratteri
            newRandomPassword = randomstring.generate({
                length: 8,
                charset: 'alphanumeric'
            }); 
           
        }while(!alphanumericRegexPassword.test(newRandomPassword)) //finchè la password non corrisponde all'espressione regolare, genera una nuova password 
       

        var password = await bcrypt.hash(newRandomPassword, 12); //cripta la password temporanea da inserire nel db

        const [rowsUpdate, fieldUpdate] = await connection.query(query.updateMyPassword, [password, idUtente]); //aggiorna la nuova password nel db
         
        
        sendMailForgottenPassword("alfredoraimondo98@gmail.com", email, newRandomPassword); //invia la mail in chiaro all'utente
       

        await connection.commit(); //effettua il commit delle transazioni

        res.status(201).json({
            mess : 'Ok'
        })
        
    }
    catch(err){ //se si verifica un errore 
       console.log("err " , err)
        connection.rollback(); //effettua il rollback delle modifiche apportate

        res.status(401).json({
            mess : err
        })
    }
    finally{
        await connection.release(); //rilascia la connessione al termine delle operazioni 
    }
}



/**
 * invio email con nuova password in seguito a un "password dimendicata"
 * @param {*} destinatario 
 * @param {*} messaggio 
 */
function sendMailForgottenPassword(destinatario, email, newPassword){
    var mailOptions = {
        from: 'alfredoraimondo98@gmail.com', //mittente
        to: destinatario, //destinatario
        subject: 'Travel Scanner: recupero credenziali',
        //text: 'Sgart.it' // invia il corpo in plaintext
        html: `<b><h3> Travel Scanner: recupero credenziali</h3></b><br>
                <br> email: ${email}   <br>
                <br> password: ${newPassword}   <br><br>
                <br> Ora puoi utilizzare queste credenziali per accedere al nostro sito. Non dimenticare di aggiornare la password dal tuo profilo   <br>
                <br><br>
                
               ` // invia il corpo in html 
        };
      
      // invio il messaggio
      transporter.sendMail(mailOptions, function(error, info){
        if(error) {
          console.log(error);
        }else{
          console.log('Messaggio inviato: ' + info.response);
        }
      });
}

exports.searchUser = async(req,res,next) =>{
    tipo= req.body.tipo;
    utente_ricercato= req.body.utente_ricercato
    utente_ricercato=utente_ricercato+'%'

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

 
    await connection.beginTransaction(async function (err) { //avvia una nuova transazione
        if (err) { throw err; }
    });

    try{
        const [rows_user, field_user] = await connection.query(query.getUserByNameSurname,[utente_ricercato,utente_ricercato]);
        
        if(rows_user[0]==undefined){
            res.status(201).json({
                mess: "Nessun utente trovato!!"
            })
        }
        else{
            res.status(201).json({
                utenti : rows_user
            })
        }
        
    }catch(error){
        res.status(401).json({
            mess: error
        })
    }


}

exports.serchAll = async(req,res,next) => {

    parametro_ricerca=req.body.parametro_ricerca+"%";
   

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

 
    await connection.beginTransaction(async function (err) { //avvia una nuova transazione
        if (err) { throw err; }
    });

    try {

        const [rows_user, field_user] = await connection.query(query.getUserByNameSurname,[parametro_ricerca,parametro_ricerca]);

        const [rows_place, field_place] = await connection.query(query.getPlaceByTitle,[parametro_ricerca,parametro_ricerca,parametro_ricerca]);
        console.log(rows_place)

    
        
        bodyRes={}
        
        //Aggiornamento img utente
        rows_user.forEach(user => {
            user.img = service.server+user.img;
        })

        

        // Recupera informazioni per la fotoCopertina più votata dell'esperienza
        var promisesArray = [];
        rows_place.forEach(async place => {
            
                var p = new Promise(async (resolve, reject) => {
                    const [rows_fotoCopertina, field_fotoCopertina] = await connection.query(query.getTopFotoCopertinaByLuogoWithUser, [place.id_luogo]); //recupera la miglior fotoCopertina
                    if(rows_fotoCopertina[0] != undefined){
                        resolve(rows_fotoCopertina[0]);  
                    }
                    else{
                        resolve(null);  
                    }
                })

                promisesArray.push(p);
        });

        
        Promise.all(promisesArray).then( (values) => {

            for(let i = 0; i < rows_place.length; i++){
                //console.log("******  FOTO COPERTINA ", values[i]);

                if(values[i] != null){
                    rows_place[i].foto_copertina = service.server + values[i].foto_copertina;
                }
                else{
                    rows_place[i].foto_copertina = service.server + '/images/default_place.jpeg'
                }

            }

            
                bodyRes.user=rows_user
                
                bodyRes.place=rows_place

                //console.log("***", bodyRes);
                
                res.status(201).json(bodyRes)
        })


        
    } catch (error) {
        res.status(401).json({
            mess : "Nussun elemento trovato!!"
        })
    }
    finally{
        await connection.release(); //rilascia la connessione al termine delle operazioni 
    }


}

exports.getBadge = async (req,res,next) =>{
    var idUtente = req.body.id_utente
    
   

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase


    try {
        
        const [rows_badge, field_badge] = await connection.query(query.getBadge,[idUtente]);
        
        var Oldbadge=rows_badge[0].badge
        var newBadge
        var changeBadge=false

        const [rows_countAmb, field_countAmb] = await connection.query(query.getCountAmbassadorById, [idUtente]);

        countAmb= rows_countAmb[0].count_ambassador
        

        if(countAmb>=10 && countAmb<24)
        {
            await connection.query(query.updateBadge, ["Turista abitudinario",idUtente]);
            
            if(Oldbadge != "Turista abitudinario"){
                changeBadge=true
                newBadge="Turista abitudinario"
            }
        }
        if(countAmb>=25 && countAmb<49)
        {
            await connection.query(query.updateBadge, ["Turista moderato",idUtente]);
            if(Oldbadge != "Turista moderato"){
                changeBadge=true
                newBadge="Turista moderato"
            }
        }

        if(countAmb>=50 && countAmb<99)
        {
            await connection.query(query.updateBadge, ["Turista avventuroso",idUtente]);
            if(Oldbadge != "Turista avventuroso"){
                changeBadge=true
                newBadge="Turista avventuroso"
            }
        }

        if(countAmb>=100)
        {
            await connection.query(query.updateBadge, ["Turista elite",idUtente]);

            if(Oldbadge != "Turista elite"){
                changeBadge=true
                newBadge="Turista elite"
            }
        }

        if(changeBadge){
            res.status(201).json({
                badge: newBadge,
                messaggio: "badge cambiato"
            })
        }
        else{
            res.status(201).json({
                badge: Oldbadge,
                messaggio: "badge non cambiato"
            })    
        }
        
        
    } catch (error) {
        res.status(401).json({
            mess : error
        })
    }
}

exports.getMostLikeUser = async (req,res,next)=>{
    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase
    promisesArray=[]

    await connection.beginTransaction(async function (err) { //avvia una nuova transazione
        if (err) { throw err; }
    });

    try {
        [utenti,field_user]= await connection.query(query.getAllUser,[]);

        utenti.forEach(async user => {
            
            var p = new Promise(async (resolve, reject) => {
                
                
                const [rows, field] = await connection.query(query.getCountLikeByUser, [user.id_utente]);
                if(rows[0] != undefined){
                    
                    
                    resolve({utente: user,
                             somma_voti_esperienze : rows[0].somma_voti_esperienze});  
                }
                else{
                    resolve(0);  
                }
            })

            promisesArray.push(p);
        });
    
        Promise.all(promisesArray).then( (values) => { 
        
        
            values.sort((a,b)=>{
                return b.somma_voti_esperienze - a.somma_voti_esperienze
            })

            values.forEach( user => {
                user.utente.img = service.server+user.utente.img; //immagine utente con indirizzo server 
            })


            res.status(201).json({
                classifica : values
            })
            
        });
        
        
        
    } catch (error) {
        res.status(401).json({
            mess : error
        })
    }
}


/**
 * Restituisce gli utenti 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getLikedUsers = async (req,res,next)=>{

    var idEsperienza = req.body.id_esperienza;
    var tipoVoto = req.body.tipo_voto;
    
    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase
    

    await connection.beginTransaction(async function (err) { //avvia una nuova transazione
        if (err) { throw err; }
    });

    try {
        const [rows, field]= await connection.query(query.getLikedUsers,[idEsperienza, tipoVoto]);
        var likedUsers = rows;

        


        res.status(201).send(likedUsers);
            
        
        
        
        
    } catch (error) {
        res.status(401).json({
            mess : error
        })
    }
}
