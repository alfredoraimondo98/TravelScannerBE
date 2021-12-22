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
        fotoCopertina = fotoCopertina.replace(/\\/g, "/");
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
                    let img = req.files[i].path.slice(6);
                    img = img.replace(/\\/g, "/");
                    arrayGallery.push(img); //recupera i path delle foto gallery

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

    var allPlaces;
    var luoghiCard = [];
    var randomPlaces = [];

    try {
        
        const [rows_all, field_all] = await connection.query(query.getAllPlacesWithOptionalField); //recupera tutti i luoghi
        allPlaces = rows_all;


        //seleziona 5 random places da mostrare sulla home
        if(allPlaces.length > 5){
            for(let i=0; i<5; i++){ //Visualizza solo 5 luoghi nella homepage
    
                var index = Math.floor(Math.random() * allPlaces.length); //Seleziona un elemento random
                randomPlaces.push(allPlaces[index]); //memorizza l'elemento in randomPlaces
                allPlaces.splice(index, 1); //rimuove l'elemento dalla lista di tutti i luoghi   

            }   
        }
        else{
            randomPlaces = luoghiCard;
        }
       
        

        //aggiungere i campi necessari per l'oggetto 'luogo' del frontend

        randomPlaces.forEach( el => {
            el['descrizione'] = ``;
            el['accessibilita'] = ``;
            if(el.orario_apertura == null){
                el.orario_apertura = '';
            }
            if(el.orario_chiusura == null){
                el.orario_chiusura = '';
            }
            if(el.costo_minimo == null){
                el.costo_minimo = '';
            }
            if(el.costo_massimo == null){
                el.costo_massimo = '';
            }
            if(el.foto_copertina != null && el.foto_copertina != ''){
                el.foto_copertina = service.server + el.foto_copertina;
            }
            else{
                el.foto_copertina = '';
            }
            el['voto_luogo'] = -1;
            el['numero_votazioni'] = -1; 
        })
         
       
         


        // MOCK RESPONSE ********************************************//

        /*    randomPlaces.forEach( el => {
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
    */
    

    

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
exports.getPlace = async (req, res, next) => {

    //Variabili per il risultato finale
    var countFotoCopertina = 0;
    var countGallery = 0;
    var countAccessibilita = 0;
    var countDescrizione = 0;

    var idLuogo = req.body.id_luogo;
    console.log("************ id luogo", idLuogo);
    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase
     
    try {
    
        const [rows_luogo, field_luogo] = await connection.query(query.getLuogoById, [idLuogo]); //recupera tutti i luoghi
        var luogo = rows_luogo[0];


        //***** DESCRIZIONE PIU VOTATA */

        const [rows_descrizione, field_descrizione] = await connection.query(query.getTopDescrizioneByLuogoWithUser, [idLuogo]);
        var descrizione;
        if(rows_descrizione[0]){//recupera la miglior descrizione
            descrizione = rows_descrizione[0];
            countDescrizione = descrizione.count_descrizione;
        }
        else{
            descrizione = {};
            descrizione.descrizione = '';
        }
        console.log("*** descrizione più votata: ", rows_descrizione);

        const[rows_descVotoTot, field_descVotoTot]= await connection.query(query.getTotalDescrizione,[idLuogo]) //recupera totale voti
        var count_total_descrizione;
        if(rows_descVotoTot[0]){
            count_total_descrizione = rows_descVotoTot[0].count_total;
        }
        else{
            count_total_descrizione = 0;
        }
         
        
        //*** ACCESSIVILITA PIU VOTATA */
        const [rows_accessibilita, field_accessibilita] = await connection.query(query.getTopAccessibilitaByLuogoWithUser, [idLuogo]); //recupera la miglior accessibilita
        var accessibilita; 
        if(rows_accessibilita[0]){
            accessibilita = rows_accessibilita[0];
            countAccessibilita = accessibilita.count_accessibilita;
        }
        else{ //se non è presente viene settato come null
            accessibilita = {};
            accessibilita.accessibilita = '';
        }
        console.log("*** accessibilita più votata: ", accessibilita);

        const[rows_accVotoTot, field_accVotoTot]= await connection.query(query.getTotalAccessibilita,[idLuogo]) //recupera totale voti
        var count_total_accessibilita;
        if(rows_accVotoTot[0]){
            count_total_accessibilita = rows_accVotoTot[0].count_total;
        }
        else{
            count_total_accessibilita = 0;
        }


        const [rows_fotoCopertina, field_fotoCopertina] = await connection.query(query.getTopFotoCopertinaByLuogoWithUser, [idLuogo]); //recupera la miglior fotoCopertina
        var fotoCopertina;
        if(rows_fotoCopertina[0]){
            var fotoCopertina = rows_fotoCopertina[0];
            countFotoCopertina = fotoCopertina.count_foto_copertina;
        }
        else{
            var fotoCopertina = {};
            fotoCopertina.foto_copertina = '/images/default_place.jpeg'
        }
        console.log("*** fotoCopertina più votata: ", fotoCopertina);


        const [rows_gallery, field_gallery] = await connection.query(query.getTopGalleryByLuogoWithUser, [idLuogo]); //recupera la miglior gallery (con le relative foto) per il luogo
        var gallery;
        if(rows_gallery[0]){
            gallery = rows_gallery;
            countGallery = gallery[0].count_gallery;


            var fotoGallery = [];
            gallery.forEach(el => {
                fotoGallery.push(service.server+el.path)
            })
        }
        else{
            gallery = [];
            gallery.push({
                id_utente : 0,
                nome : '',
                cognome : '',
                img : 'images/logo.jpg',
            })
      
        }
        console.log("** gallery ", gallery)

      



        

        //*** DATI OPZIONALI (Non necessariamente sono presenti) */

        const [rows_orari, field_orari] = await connection.query(query.getOrariByLuogo, [idLuogo]); //recupera gli orari di apertura per il luogo
        var orari = rows_orari[0];
        if(orari == undefined){ //Se non sono presenti setta i valori come stringa vuota
            orari = {};
            orari.orario_apertura = "";
            orari.orario_chiusura = "";
        }
        const [rows_costo, field_costo] = await connection.query(query.getCostoByLuogo, [idLuogo]); //recupera i costi per il luogo
        var costo = rows_costo[0];
        if(costo == undefined){ //Se non sono presenti, setta i valori come stringa vuota
            costo = {};
            costo['costo_minimo'] = "";
            costo['costo_massimo'] = "";
        }

 
        //Calcolo media voto utenti (voti like * 0.2 + voti star * 02 / numero totali di voti)

        var like = (countFotoCopertina * 0.2) + (countGallery * 0.2);
        console.log("** like", like);

        var star = (countDescrizione * 0.2) + (countAccessibilita * 0.2);
        console.log("** star", star);

        var total = countFotoCopertina + countGallery + count_total_descrizione + count_total_accessibilita;
        console.log("** total", total);

        var mediaVotiUtenti = 0;
        if(total != 0){
            mediaVotiUtenti = (((like + star) / total) * 5).toFixed(2);
        }
        //console.log("** media", (fotoCopertina.count_foto_copertina * 0.2) + (gallery.count_gallery * 0.2) );
     

        var placeDetails = {
            id_luogo : luogo.id_luogo,
            titolo : luogo.titolo,
            posizione : luogo.posizione,
            citta : luogo.citta,
            nazione : luogo.nazione,

            foto_copertina : service.server+fotoCopertina.foto_copertina,
            count_foto_copertina: fotoCopertina.count_foto_copertina,
            ambassador_foto_copertina_id : fotoCopertina.id_utente,
            ambassador_foto_copertina_nome : fotoCopertina.nome,
            ambassador_foto_copertina_cognome : fotoCopertina.cognome,
            ambassador_foto_copertina : service.server+fotoCopertina.img,

            descrizione : descrizione.descrizione,
            count_descrizione : descrizione.count_descrizione, //voti descrizione
            count_total_descrizione : count_total_descrizione, //voti totali
            ambassador_descrizione_id : descrizione.id_utente, 
            ambassador_descrizione_nome : descrizione.nome,
            ambassador_descrizione_cognome : descrizione.cognome,
            ambassador_descrizione : service.server+descrizione.img,

            accessibilita : accessibilita.accessibilita,
            count_accessibilita : accessibilita.count_accessibilita,
            count_total_accessibilita : count_total_accessibilita,
            ambassador_accessibilita_id : accessibilita.id_utente,
            ambassador_accessibilita_nome : accessibilita.nome,
            ambassador_accessibilita_cognome : accessibilita.cognome,
            ambassador_accessibilita : service.server+accessibilita.img,

            orario_apertura : orari.orario_apertura, //se presenti
            orario_chiusura : orari.orario_chiusura,
            costo_minimo : costo.costo_minimo, //se presenti
            costo_massimo : costo.costo_massimo,

            id_gallery : gallery.id_gallery,
            count_gallery : gallery.count_gallery,
            gallery : fotoGallery,
            ambassador_gallery_id : gallery[0].id_utente,
            ambassador_gallery_nome : gallery[0].nome,
            ambassador_gallery_cognome : gallery[0].cognome,
            ambassador_gallery : service.server+gallery[0].img,

            voto_luogo : +mediaVotiUtenti,
            numero_votazioni : total

        }

 
        res.status(201).send(placeDetails);
            
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

exports.searchPlace = async(req,res,next) =>{
    tipo= req.body.tipo;
    luogo_ricercato= req.body.luogo_ricercato
    luogo_ricercato=luogo_ricercato+'%'

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

 
    await connection.beginTransaction(async function (err) { //avvia una nuova transazione
        if (err) { throw err; }
    });

    try{
        const [rows_place, field_place] = await connection.query(query.getPlaceByTitle,[luogo_ricercato]);

        if(rows_place[0]==undefined){
            res.status(201).json({
                mess: "Nessun luogo trovato!!"
            })
        }
        else{
            res.status(201).json({
                places : rows_place
            })
        }
        
    }catch(error){
        res.status(401).json({
            mess: error
        })
    }


}


