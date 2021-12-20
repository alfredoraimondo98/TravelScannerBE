const database = require('../utils/database');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const query = require('../utils/queries')
const service = require('../utils/service');

/**
 * Registrazione utente
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
exports.register = async (req, res, next) => {

    const errors = validationResult(req);

    if(!errors.isEmpty()){ //verifica parametri sulla base dei controlli inseriti come middleware nella routes
        return res.status(422).json({
            message : 'Error input Parametri',
            error : errors.array()
        });
    }

    var nome = req.body.nome;
    var cognome = req.body.cognome;
    var email = req.body.email;
    var password = await bcrypt.hash(req.body.password, 12); //cripta password
    var dataDiNascita = req.body.data_di_nascita;
    var badge = "tipo gamification"; //badge che rappresenta la tipologia di utente (da definire)
    var img = '/images/logo.jpg' //immagine profilo utente (default)

    /*
    if(req.file){ //Se presente la foto
        img = req.file.path.slice(6); //recupera path relativo dell'img (in req.file) 
    }
    */

    if(await verifyMail(email)){ //se la mail è già presente viene restituito TRUE e non si può procedere alla registrazione
        res.status(401).json({
            mess : 'email già presente'
        })
    }
    else{ 
        const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

        /*await connection.beginTransaction(async function (err) { //avvia una nuova transazione
            if (err) { throw err; }
        }); */
    
        try {
            const [rows, field] = await connection.query(query.insertUser, [nome, cognome, email, password, dataDiNascita, badge, img]); //Creazione utente
            var idUtente = rows.insertId;

            res.status(201).json({
                //mess : 'utente inserito correttamente'
                id_utente : idUtente
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
}



/**
 * login utente
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
exports.login = async (req, res, next) => {

    const errors = validationResult(req);

    if(!errors.isEmpty()){ //verifica parametri sulla base dei controlli inseriti come middleware nella routes
        return res.status(422).json({
            message : 'Error input Parametri',
            error : errors.array()
        });
    }

    let email =  req.body.email;
    let password = req.body.password;

    let loginUser;
    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    try{ 
        const [rows, field] = await database.query(query.getUserByEmail, [email]);
        loginUser = rows[0];

        //Verifica se l'utente è presente
        if(!loginUser){
            return res.status(401).json({
                message : 'Non autorizzato: email errata!'
            })
        }

        //Verifica password
        if(! (await bcrypt.compare(password, loginUser.password)) ){ //Verifica se le due password non corrispondono
            return res.status(401).json({
                message : 'Non autorizzato: password errata!' //nega l'accesso
            })
        }
        
        

        res.status(201).json({ 
            id_utente : loginUser.id_utente,
            email : loginUser.email,
            password : loginUser.password,
            nome : loginUser.nome,
            cognome : loginUser.cognome,
            data_di_nascita : loginUser.data_di_nascita,
            badge : loginUser.badge,
            img : service.server + loginUser.img
        });
    }
    catch(err) {

        return res.status(422).json({
            message : err
        });
    }
    finally{
        await connection.release(); //rilascia la connessione al termine delle operazioni 
    };
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
 * Procedura di verifica email in fase di registrazione
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
 exports.verifyEmail = async (req, res, next) => {
    var email = req.body.email;

    if(await verifyMail(email)){ //se la mail è già presente viene restituito TRUE e non si può procedere alla registrazione
        res.status(201).send(true); //MAIL PRESENTE = TRUE (NON si può procedere alla registrazione)
    }
    else{
        res.status(201).send(false); //MAIL NON PRESENTE = FALSE (Si può procedere alla registrazione)
    }
}


exports.updateImg = async(req, res, next) => {
    
    var idUtente = req.body.id_utente
    var img; //immagine profilo utente


    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase



    try{ 
        if(req.file){ //Se presente la foto
            img = req.file.path.slice(6); //recupera path relativo dell'img (in req.file) 
            img = img.replace(/\\/g, "/");
            
            const [rows, field] = await database.query(query.updateImgUser, [img, idUtente]); //aggiorna la foto dell'utente
        }


        const [rows_u, field_u] = await database.query(query.getUserById, [idUtente]); //recupera l'utente aggiornato da restituire
        var user = rows_u[0];

        res.status(201).json({ 
            id_utente : user.id_utente,
            email : user.email,
            password : user.password,
            nome : user.nome,
            cognome : user.cognome,
            //data_di_nascita : loginUser.data_di_nascita,
            badge : user.badge,
            img : service.server + user.img
        });
    }
    catch(err) {

        return res.status(422).json({
            message : err
        });
    }
    finally{
        await connection.release(); //rilascia la connessione al termine delle operazioni 
    };
}