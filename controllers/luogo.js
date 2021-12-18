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
exports.createPlace = async (req, res, next) =>{

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
    var fotoCopertina;
    var arrayGallery = [];

    if(req.files[0]){
        fotoCopertina = req.files[0].path.slice(6)  //recupera path relativo dell'img (in req.file) 
    }
    else{
        fotoCopertina = '';
    }

    var countFotoCopertina = 0;

    console.log("*** img", req.files)

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


            const [rows_esperienza, field_esperienza] = await connection.query(query.insertEsperienza, [descrizione, countDescrizione, fotoCopertina, countFotoCopertina, accessibilita, countAccessibilita, idLuogo ]); //Creazione luogo
            var idEsperienza = rows_esperienza.insertId; //recuper l'id associato all'esperienza appena creata


            const [rows_createExp, field_createExp] = await connection.query(query.insertUserCreateExperience, [idUtente, idEsperienza, dataCreazione]); //memorizza in "creare_esperienza" l'associazione utente-esperienza


            // *** INSERT DATI OPZIONALI (verifica se i dati opzionali sono presenti vengono registrati nel db)

            if(orarioApertura != '' && orarioApertura != undefined && orarioChiusura != '' && orarioChiusura != undefined){ //sono presenti tutti i dati per gli orari
                const [rows_orario, field_orario] = await connection.query(query.insertOrario, [idLuogo, orarioApertura, orarioChiusura]); //Creazione orari di apertura - chiusura
            }

            if(costoMin != '' && costoMin != undefined && costoMax != '' && costoMax != undefined){
                const [rows_costo, field_costo] = await connection.query(query.insertCosto, [idLuogo, costoMin, costoMax]); //Creazione costo max - min
            }


            // *** GALLERY : Se presente memorizzare le foto e creare una gallery da associare all'esperienza appena creata


            const [rows_gallery, field_gallery] = await connection.query(query.createGallery, [0, idEsperienza]); //crea la gallery per l'esperienza
            var idGallery = rows_gallery.insertId; //recuper l'id associato alla gallery appena creata

            //verifica se sono presenti foto per la gallery
            if(req.files.length > 1){ //sono presenti le foto per la gallery
                for(let i = 1; i < req.files.length; i++){
                    arrayGallery.push(req.files[i].path.slice(6)); //recupera i path delle foto gallery

                    const [rows_foto, field_foto] = await connection.query(query.insertFoto, [req.files[i].path.slice(6), idGallery]); //memorizza le foto della gallery
                }
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
exports.getAllPlaces = async (req, res, next) =>{
    
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
            const [rows_luogo, field_luogo] = await connection.query(query.getLuogoCard, [luogo.id_luogo]); //recupera tutte le possibili esperienze (card) del luogo
            luoghiCard.push(rows_luogo[0]); //memorizza il luogo con foto_copertina più votata e più recente
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
 exports.getRandomPlaces = async (req, res, next) =>{
    
    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    await connection.beginTransaction(async function (err) { //avvia una nuova transazione
        if (err) { throw err; }
    });

    var promisesArray = [];
    var allLuoghi;
    var luoghiCard = [];
    var randomPlaces = [];

    try {
    
        const [rows_allLuoghi, field_allLuoghi] = await connection.query(query.getAllLuoghi); //recupera tutti i luoghi
        allLuoghi = rows_allLuoghi;

        try{ 

            allLuoghi.forEach( async (luogo) => {

                    new Promise(async (resolve, reject) => {

                        var res = connection.query(query.getLuogoCard, [luogo.id_luogo]); //recupera tutti i luoghi memorizzati (in pending)
                        
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
                luoghiCard.push(results[i][0][0]); //recupera il risultato (il primo risultato) di ogni query
            }
                
 
            if(luoghiCard.length > 5){

                for(let i=0; i<5; i++){ //Visualizza solo 5 luoghi nella homepage
    
                    var index = Math.floor(Math.random() * luoghiCard.length); //Seleziona un elemento random
                    randomPlaces.push(luoghiCard[index]); //memorizza l'elemento in randomPlaces
                    luoghiCard.splice(index, 1); //rimuove l'elemento dalla lista di tutti i luoghi   
                 }   
            }
            else{
                randomPlaces = luoghiCard;
            }



        // MOCK RESPONSE ********************************************//

            randomPlaces.forEach( el => {
                el['descrizione'] = `Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum`;
                el['accessibilita'] = `There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable.`;
                el['orario_apertura'] = '10:00';
                el['orario_chiusura'] = '12:00';
                el['costo_minimo'] = '50';
                el['costo_massimo'] = '150';
                el.foto_copertina = 'https://travelscanner-be.azurewebsites.net\images\1639823030153-vittorio-emanuele-monument-rome-rome-palace-altare-della-patria-56886.jpeg';
                el['voto_luogo'] = 3.5;
                el['numero_votazioni'] = 120; 
                // el.foto_copertina = service.server + el.foto_copertina;
            })
    
    

        })
            


        await connection.commit(); //effettua il commit delle transazioni

 
        res.status(201).send(randomPlaces);
            
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