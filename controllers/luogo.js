const database = require('../utils/database');
const bcrypt = require('bcryptjs');
const {format} = require('date-format-parse')
const { validationResult } = require('express-validator');
const query = require('../utils/queries')
const service = require('../utils/service');


/**
 * crea un nuovo luogo (quando si crea un nuovo luogo viene in automatico generata una prima esperienza per quel luogo)
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.createLuogo = async (req, res, next) =>{

    const errors = validationResult(req);

    if(!errors.isEmpty()){ //verifica parametri sulla base dei controlli inseriti come middleware nella routes
        return res.status(422).json({
            message : 'Error input Parametri',
            error : errors.array()
        });
    }

    var idUtente = req.body.id_utente; // ** id utente che sta creando il nuovo luogo

    // ** dati per il luogo ricevuti in input
    var titolo = req.body.titolo;
    var posizione = req.body.posizione;
    var citta = req.body.citta;
    var nazione = req.body.nazione;
    

    // ** Data creazione (da inserire in LUOGO e in ESPERIENZA)
    dataCreazione = format(new Date(), 'YYYY-MM-DD');
    console.log("*** DATA, ", dataCreazione)

    // ** dati per la creazione della prima esperienza (ricevuti in input)
    var descrizione = req.body.descrizione;
    var countDescrizione = 0;
    var accessibilita = req.body.descrizione;
    var countAccessibilita = 0;
    var fotoCopertina = req.file.path.slice(6)  //recupera path relativo dell'img (in req.file) 
    var countFotoCopertina = 0;

    // ** DATI OPZIONALI *** //
    // **Orario apertura-chiusura
    var orarioApertura = req.body.orario_apertura;
    var orarioChiusura = req.body.orario_chiusura;

    // **Costo minimo-massimo
    var costoMin = req.body.costo_minimo;
    var costoMax = req.body.costo_massimo;


    if(await verifyLuogo(titolo)){ //se il luogo è già presente viene restituito TRUE e non si può procedere alla creazione
        res.status(401).json({
            mess : 'luogo già presente'
        })
    }
    else{ 
        const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

        await connection.beginTransaction(async function (err) { //avvia una nuova transazione
            if (err) { throw err; }
        });

        try {
    
            const [rows_luogo, field_luogo] = await connection.query(query.insertLuogo, [titolo, posizione, citta, nazione, idUtente, dataCreazione]); //Creazione luogo
            var idLuogo = rows_luogo.insertId; //recuper l'id associato al luogo appena inserito


            const [rows_esperienza, field_esperienza] = await connection.query(query.insertEsperienza, [descrizione, countDescrizione, fotoCopertina, countFotoCopertina, accessibilita, countAccessibilita, idUtente, dataCreazione, idLuogo ]); //Creazione luogo
            var idEsperienza = rows_esperienza.insertId; //recuper l'id associato all'esperienza appena creata


            // *** INSERT DATI OPZIONALI (verifica se i dati opzionali sono presenti vengono registrati nel db)

            if(orarioApertura != '' && orarioApertura != undefined && orarioChiusura != '' && orarioChiusura != undefined){ //sono presenti tutti i dati per gli orari
                const [rows_orario, field_orario] = await connection.query(query.insertOrario, [idLuogo, orarioApertura, orarioChiusura]); //Creazione orari di apertura - chiusura
            }

            if(costoMin != '' && costoMin != undefined && costoMax != '' && costoMax != undefined){
                const [rows_costo, field_costo] = await connection.query(query.insertCosto, [idLuogo, costoMin, costoMax]); //Creazione costo max - min
            }


            await connection.commit(); //effettua il commit delle transazioni

            res.status(201).json({
                mess : 'ok'
            })
            
        }
        catch(err){ //se si verifica un errore 
            console.log("err " , err);
            await connection.rollback(); //effettua il commit delle transazioni

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
 * Verifica se il luogo che si sta cercando di inserire è già presente
 * @param {*} titolo 
 */
async function verifyLuogo(titolo){

    const [rows, field] = await database.query(query.verifyLuogo, [titolo]); //verifica se un luogo con lo stesso titolo è già presente
 
    if(rows.length == 0){ //se la risposta non contiene nessun risultato allora il luogo non è presente;
        console.log("*** LUOGO NON PRESENTE");
        return false; //luogo non presente: può proseguire con la creazione;
    }
    else{
        return true; //luogo già presente: non può procedere alla creazione;
    }
}