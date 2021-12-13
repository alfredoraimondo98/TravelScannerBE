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
    //console.log("*** DATA, ", dataCreazione)

    // ** dati per la creazione della prima esperienza (ricevuti in input)
    var descrizione = req.body.descrizione;
    var countDescrizione = 0;
    var accessibilita = req.body.descrizione;
    var countAccessibilita = 0;
    var fotoCopertina = req.file.path.slice(6)  //recupera path relativo dell'img (in req.file) 
    var countFotoCopertina = 0;

    console.log("*** img", req.file)

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






/**
 * restituisce tutti i luoghi per la visualizzazione della card (foto_copertina, titolo, città, nazione)
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
exports.getAllLuoghi = async (req, res, next) =>{
    
    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    await connection.beginTransaction(async function (err) { //avvia una nuova transazione
        if (err) { throw err; }
    });


    var allLuoghi;
    var luoghiCard = [];

    try {
    
        const [rows_allLuoghi, field_allLuoghi] = await connection.query(query.getAllLuoghi); //recupera tutti i luoghi
        allLuoghi = rows_allLuoghi;

        await allLuoghi.forEach( async (luogo) => {
            const [rows_luogo, field_luogo] = await connection.query(query.getLuogoCard, [luogo.id_luogo]); //recupera tutti i luoghi memorizzati
            luoghiCard.push(rows_luogo[0]); //recupera il luogo con foto_copertina più votata e più recente
        })
        
        await connection.commit(); //effettua il commit delle transazioni

        //console.log("*** ", luoghiCard)

        res.status(201).json({
            luoghi : luoghiCard
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





/**
 * restituisce una lista di luoghi random da visualizzare (foto_copertina, titolo, città, nazione)
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
 exports.getRandomPlace = async (req, res, next) =>{
    
    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    await connection.beginTransaction(async function (err) { //avvia una nuova transazione
        if (err) { throw err; }
    });


    var allLuoghi;
    var randomPlaces = [];

    try {
    
        const [rows_allLuoghi, field_allLuoghi] = await connection.query(query.getAllLuoghi); //recupera tutti i luoghi
        allLuoghi = rows_allLuoghi;

        await allLuoghi.forEach( async (luogo) => {
            const [rows_luogo, field_luogo] = await connection.query(query.getLuogoCard, [luogo.id_luogo]); //recupera tutti i luoghi memorizzati

            var place = {
                id_luogo : luogo.id_luogo,
                titolo : luogo.titolo,
                citta : luogo.citta,
                nazione : luogo.nazione,
                data_creazione : luogo.data_creazione,
                foto_copertina : service.server+luogo.fotoCopertina,
                count_foto_copertina : luogo.count_foto_copertina,
                data_creazione_esperienza : luogo.data_creazione_esperienza
            }
    

            randomPlaces.push(place); //recupera il luogo con foto_copertina più votata e più recente
        })
    

        await connection.commit(); //effettua il commit delle transazioni

 
        res.send(randomPlaces);
            
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

/**
 * Restituisce un luogo dato il suo id con le informazioni (descrizione, fotocopertina, accessibilita, gallery) più votate
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getLuogo = async (req, res, next) => {

    var idLuogo = req.body.id_luogo;

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase
     
    try {
    
        const [rows_luogo, field_luogo] = await connection.query(query.getLuogoById, [idLuogo]); //recupera tutti i luoghi
        var luogo = rows_luogo[0];

        const [rows_descrizione, field_descrizione] = await connection.query(query.getDescrizioneByLuogo, [idLuogo]); //recupera la descrizione
        var descrizione = rows_descrizione[0];

        const [rows_accessibilita, field_accessibilita] = await connection.query(query.getAccessibilitaByLuogo, [idLuogo]); //recupera l'accessibilita
        var accessibilita = rows_accessibilita[0];

        const [rows_fotoCopertina, field_fotoCopertina] = await connection.query(query.getFotoCopertinaByLuogo, [idLuogo]); //recupera la fotoCopertina
        var fotoCopertina = rows_fotoCopertina[0];


        //*** DATI OPZIONALI (Non necessariamente sono presenti) */

        const [rows_orari, field_orari] = await connection.query(query.getOrariByLuogo, [idLuogo]); //recupera gli orari di apertura per il luogo
        var orari = rows_orari[0];

        const [rows_costo, field_costo] = await connection.query(query.getCostoByLuogo, [idLuogo]); //recupera i costi per il luogo
        var costo = rows_costo[0];


        var LuogoInfo = {
            id_luogo : luogo.id_luogo,
            titolo : luogo.titolo,
            posizione : luogo.posizione,
            citta : luogo.citta,
            nazione : luogo.nazione,
            foto_copertina : service.server+fotoCopertina.foto_copertina,
            descrizione : descrizione.descrizione,
            accessibilita : accessibilita.accessibilita,
            orari_di_apertura : orari, //se presenti
            costo : costo //se presenti
        }

        
        res.status(201).json({
            luogo : LuogoInfo
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