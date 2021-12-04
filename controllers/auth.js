const database = require('../utils/database');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const query = require('../utils/queries')



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
            const [rows, field] = await connection.query(query.insertUser, [nome, cognome, email, password, dataDiNascita, badge]); //Creazione utente

            res.status(201).json({
                mess : 'utente inserito correttamente'
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