const database = require('../utils/database');
const bcrypt = require('bcryptjs');
const {format} = require('date-format-parse')
const { validationResult } = require('express-validator');
const query = require('../utils/queries')
const service = require('../utils/service');


exports.createEsperienza = async (req, res, next)=>{
    const errors = validationResult(req);

    if(!errors.isEmpty()){ //verifica parametri sulla base dei controlli inseriti come middleware nella routes
        return res.status(422).json({
            message : 'Error input Parametri',
            error : errors.array()
        });
    }
    
    
    
    var accessibilita = req.body.accessibilita
    var descrizione= req.body.descrizione
    var idUtente= req.body.idUtente
    var idLuogo= req.body.idLuogo
    

    var countDescrizione=0
    var countAccessibilita=0
    var countFotoCopertina=0  
    var dataCreazione = format(new Date(), 'YYYY-MM-DD');
    var fotos=[]
    console.log("ciao")
    
    for(var i=0; i<req.files.length; i++){
        fotos.push(req.files[i].path.slice(6))
    }

    var fotoCopertina=fotos[0]
    
    
    

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    await connection.beginTransaction(async function (err) { //avvia una nuova transazione
        if (err) { throw err; }
    });

    try{
        const [rows_esperienza, field_esperienza] = await connection.query(query.insertEsperienza, [descrizione, countDescrizione,fotoCopertina,countFotoCopertina,
            accessibilita, countAccessibilita,idUtente,dataCreazione,idLuogo]);

        

        var idEsperienza = rows_esperienza.insertId;

        

        await connection.query(query.insertUserCreateExperience, [idUtente,idEsperienza,dataCreazione]);

        const [rows_gallery,field_gallery]= await connection.query(query.insertGallery,[0,idEsperienza])

        var idGallery = rows_gallery.insertId;

        for(var i=1; i<fotos.length; i++){
            console.log(fotos[i])
            const[rows_foto,field_foto]= await connection.query(query.insertFoto,[fotos[i],idGallery])
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

exports.votaEsperienzaTot = async (req, res, next)=>{
var idEsperienza= req.body.idEsperienza
var idUtente= req.body.idUtente

const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    await connection.beginTransaction(async function (err) { //avvia una nuova transazione
        if (err) { throw err; }
    });

try{
    //if(await verifyVoto(idUtente,idEsperienza)){ //se il luogo è già presente viene restituito TRUE e non si può procedere alla creazione
    console.log("ci sono")
    if (!await connection.query(query.verifyVoto,[idUtente, idEsperienza])){
    const [rows_voto, field_voto] = await connection.query(query.insertVoto, [idUtente,idEsperienza,1,"esperienza"]);

    await connection.commit(); //effettua il commit delle transazioni

    res.status(201).json({
        mess : 'ok'
    })
}
    else
    {
        res.status(201).json({
            mess : 'già votato'
        })
    }   
    
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

exports.votaFotoCopertina = async (req, res, next)=>{
    //console.log("ueueu")
    var idEsperienza= req.body.idEsperienza
    var idUtente= req.body.idUtente
    
    
    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase
    
        await connection.beginTransaction(async function (err) { //avvia una nuova transazione
            if (err) { throw err; }
        });
    
    
    try{
        const [rows_verify, field_verify]= await connection.query(query.verifyVotoTipo,[idUtente, idEsperienza,"fotoCopertina"])
        if (rows_verify[0]==undefined){

        const [rows_voto, field_voto] = await connection.query(query.insertVoto, [idUtente,idEsperienza,1,"fotoCopertina"]);
        const [rows_votoFotoCopertina, field_votoFotoCopertina] = await connection.query(query.getNumVotiFotoCopertina, [idEsperienza]);
        await connection.query(query.updateNumVotiFotoCopertina,[rows_votoFotoCopertina[0].count_foto_copertina+1,idEsperienza])
        
        await connection.commit(); //effettua il commit delle transazioni
    
        res.status(201).json({
            mess : 'ok'
        })
    }
        else
        {
           
            res.status(201).json({
                mess : 'già votato'
            })
        }   
        
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

exports.votaFotoGallery = async (req, res, next)=>{
    //console.log("ueueu")
    var idEsperienza= req.body.idEsperienza
    var idUtente= req.body.idUtente
    
    
    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase
    
        await connection.beginTransaction(async function (err) { //avvia una nuova transazione
            if (err) { throw err; }
        });
    
    
    try{
        const [rows_verify, field_verify]= await connection.query(query.verifyVotoTipo,[idUtente, idEsperienza,"fotoGallery"])
        if (rows_verify[0]==undefined){

        const [rows_voto, field_voto] = await connection.query(query.insertVoto, [idUtente,idEsperienza,1,"fotoGallery"]);

        const [rows_votoFotoGallery, field_votoFotoGallery] = await connection.query(query.getNumVotiFotoGallery, [idEsperienza]);

        await connection.query(query.updateNumVotiFotoGallery,[rows_votoFotoGallery[0].count_gallery+1,idEsperienza])
        
        await connection.commit(); //effettua il commit delle transazioni
    
        res.status(201).json({
            mess : 'ok'
        })
    }
        else
        {
           
            res.status(201).json({
                mess : 'già votato'
            })
        }   
        
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

exports.votaDescrizione = async (req, res, next)=>{
    var idEsperienza= req.body.idEsperienza
    var idUtente= req.body.idUtente
    var votoDescrizione= req.body.votoDescrizione

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    await connection.beginTransaction(async function (err) { //avvia una nuova transazione
        if (err) { throw err; }
    });

    try{
        const [rows_verify, field_verify]= await connection.query(query.verifyVotoTipo,[idUtente, idEsperienza,"descrizione"])
        if(rows_verify[0]==undefined){
            await connection.query(query.insertVoto,[idUtente,idEsperienza,votoDescrizione,"descrizione"])

            const[rows_votoTot, field_votoTot]= await connection.query(query.getTotVotieSomma,[idEsperienza,"descrizione"])
            sommaVoti=rows_votoTot.sommaVoti
            var mediaVoti=sommaVoti/rows_votoTot[0].countVoti

            await connection.query(query.updateVotoDescrizione,[mediaVoti,sommaVoti,idEsperienza])
            

            
            await connection.commit(); //effettua il commit delle transazioni

            res.status(201).json({
                mess : 'ok'
            })
        }
        else{
            
            await connection.query(query.updateVoto,[votoDescrizione,idEsperienza,idUtente,"descrizione"])

            const[rows_votoTot, field_votoTot]= await connection.query(query.getTotVotieSomma,[idEsperienza,"descrizione"])

            sommaVoti=rows_votoTot.sommaVoti

            var mediaVoti=sommaVoti/rows_votoTot[0].countVoti
            await connection.query(query.updateVotoDescrizione,[mediaVoti,sommaVoti,idEsperienza])

            await connection.commit();
            res.status(201).json({
                mess : 'voto aggiornato'
            })
        }
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



exports.votaAccessibilita = async (req, res, next)=>{
    var idEsperienza= req.body.idEsperienza
    var idUtente= req.body.idUtente
    var votoAccessibilita= req.body.votoAccessibilita

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    await connection.beginTransaction(async function (err) { //avvia una nuova transazione
        if (err) { throw err; }
    });

    try{
        const [rows_verify, field_verify]= await connection.query(query.verifyVotoTipo,[idUtente, idEsperienza,"accessibilita"])
        if(rows_verify[0]==undefined){
            await connection.query(query.insertVoto,[idUtente,idEsperienza,votoAccessibilita,"accessibilita"])

            const[rows_votoTot, field_votoTot]= await connection.query(query.getTotVotieSomma,[idEsperienza,"accessibilita"])
            var sommaVoti=rows_votoTot[0].sommaVoti
            var mediaVoti=sommaVoti/rows_votoTot[0].countVoti

            await connection.query(query.updateVotoAccessibilita,[mediaVoti,sommaVoti,idEsperienza])
            

            
            await connection.commit(); //effettua il commit delle transazioni

            res.status(201).json({
                mess : 'ok'
            })
        }
        else{
            
            await connection.query(query.updateVoto,[votoAccessibilita,idEsperienza,idUtente,"accessibilita"])
            
            const[rows_votoTot, field_votoTot]= await connection.query(query.getTotVotieSomma,[idEsperienza,"accessibilita"])
            var sommaVoti=rows_votoTot[0].sommaVoti
            var mediaVoti=sommaVoti/rows_votoTot[0].countVoti
            await connection.query(query.updateVotoAccessibilita,[mediaVoti,sommaVoti,idEsperienza])

            await connection.commit();
            res.status(201).json({
                mess : 'voto aggiornato'
            })
        }
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
 * restituisce le esperienze di un luogo in ordine di voto complessivo
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
 exports.getEsperienzeVotate = async(req, res, next) => {

    var idLuogo = req.body.id_luogo;

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    esperienzeDelLuogo = []; 

    try {
    
        const [rows_countEsperienze, field_countEsperienze] = await connection.query(query.getEsperienzeCountByLuogo, [idLuogo]);
        var experiencesCount = rows_countEsperienze; // recupera tutte le esperienze del luogo con i count relativi alla votazione di tipo "esperienza"

        const[rows_exp, field_exp]= await connection.query(query.getEsperienzeWithUserByLuogo,[idLuogo]) //recupera le esperienze e gli utenti che le hanno create
        var experiences = rows_exp;

        const[rows_gallery, field_gallery] = await connection.query(query.getGalleryByLuogo, [idLuogo]) //recupera le gallery delle esperienze di un luogo
        var galleryComplete = rows_gallery;

        //console.log("*** ex1 ", experiencesCount);
    
        //console.log("*** ex2", experiences);
        //console.log("*** ex3 ", galleryComplete);


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





/**
 * restituisce le esperienze di un luogo in ordine di data di creazione (dalle più recenti alle meno recenti)
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
 exports.getEsperienzeRecenti = async(req, res, next) => {

    var idLuogo = req.body.id_luogo;

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    esperienzeDelLuogo = []; 

    try {
    
        const [rows_countEsperienze, field_countEsperienze] = await connection.query(query.getEsperienzeCountByLuogo, [idLuogo]);
        var experiencesCount = rows_countEsperienze; // recupera tutte le esperienze del luogo con i count relativi alla votazione di tipo "esperienza"

        const[rows_exp, field_exp]= await connection.query(query.getEsperienzeWithUserByLuogo,[idLuogo]) //recupera le esperienze e gli utenti che le hanno create
        var experiences = rows_exp;

        const[rows_gallery, field_gallery] = await connection.query(query.getGalleryByLuogo, [idLuogo]) //recupera le gallery delle esperienze di un luogo
        var galleryComplete = rows_gallery;

        //console.log("*** ex1 ", experiencesCount);
    
        //console.log("*** ex2", experiences);
        //console.log("*** ex3 ", galleryComplete);


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

       //ordinamento in base alla data di creazione (dall'esperienza più recente alla meno recente)
        experiences.sort( function(a, b) {
            return b.data_creazione - a.data_creazione
        })
        

        
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

exports.getVotoEffettuatoDescrizione = async(req,res,next)=>{
    var idEsperienza= req.body.id_esperienza;
    var idUtente= req.body.id_utente;

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    await connection.beginTransaction(async function (err) { //avvia una nuova transazione
        if (err) { throw err; }
    });

    try{
        const [rows_verify, field_verify]= await connection.query(query.verifyVotoTipo,[idUtente, idEsperienza,"descrizione"])
        if(rows_verify[0]==undefined){
            

            
            await connection.commit(); //effettua il commit delle transazioni

            res.status(201).json({
                voto_descrizione: 0
            })
        }
        else{
            
            voto_descrizione= rows_verify[0].voto

            await connection.commit();
            res.status(201).json({
                voto_descrizione: voto_descrizione
            })
        }
    }catch(err){ //se si verifica un errore 
        console.log("err " , err);

        res.status(401).json({
            mess : err
        })
    }
    finally{
        await connection.release(); //rilascia la connessione al termine delle operazioni 
    }


}

exports.getVotoEffettuatoFotoCopertina = async(req,res,next)=>{
    var idEsperienza= req.body.id_esperienza;
    var idUtente= req.body.id_utente;

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    await connection.beginTransaction(async function (err) { //avvia una nuova transazione
        if (err) { throw err; }
    });

    try{
        const [rows_verify, field_verify]= await connection.query(query.verifyVotoTipo,[idUtente, idEsperienza,"fotoDescrizione"])
        if(rows_verify[0]==undefined){
            

            
            await connection.commit(); //effettua il commit delle transazioni

            res.status(201).json({
                voto_foto_copertina: 0
            })
        }
        else{
            
            voto_foto_copertina= rows_verify[0].voto

            await connection.commit();
            res.status(201).json({
                voto_foto_copertina: voto_foto_copertina
            })
        }
    }catch(err){ //se si verifica un errore 
        console.log("err " , err);

        res.status(401).json({
            mess : err
        })
    }
    finally{
        await connection.release(); //rilascia la connessione al termine delle operazioni 
    }


}

exports.getVotoEffettuatoFotoGallery = async(req,res,next)=>{
    var idEsperienza= req.body.id_esperienza;
    var idUtente= req.body.id_utente;

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    await connection.beginTransaction(async function (err) { //avvia una nuova transazione
        if (err) { throw err; }
    });

    try{
        const [rows_verify, field_verify]= await connection.query(query.verifyVotoTipo,[idUtente, idEsperienza,"fotoGallery"])
        if(rows_verify[0]==undefined){
            

            
            await connection.commit(); //effettua il commit delle transazioni

            res.status(201).json({
                voto_foto_gallery: 0
            })
        }
        else{
            
            voto_foto_gallery= rows_verify[0].voto

            await connection.commit();
            res.status(201).json({
                voto_foto_gallery: voto_foto_gallery
            })
        }
    }catch(err){ //se si verifica un errore 
        console.log("err " , err);

        res.status(401).json({
            mess : err
        })
    }
    finally{
        await connection.release(); //rilascia la connessione al termine delle operazioni 
    }


}


exports.getVotoEffettuatoAccesibilita = async(req,res,next)=>{
    var idEsperienza= req.body.id_esperienza;
    var idUtente= req.body.id_utente;

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    await connection.beginTransaction(async function (err) { //avvia una nuova transazione
        if (err) { throw err; }
    });

    try{
        const [rows_verify, field_verify]= await connection.query(query.verifyVotoTipo,[idUtente, idEsperienza,"accessibilita"])
        if(rows_verify[0]==undefined){
            

            
            await connection.commit(); //effettua il commit delle transazioni

            res.status(201).json({
                voto_accessibilita: 0
            })
        }
        else{
            
            voto_accessibilita= rows_verify[0].voto

            await connection.commit();
            res.status(201).json({
                voto_accessibilita: voto_accessibilita
            })
        }
    }catch(err){ //se si verifica un errore 
        console.log("err " , err);

        res.status(401).json({
            mess : err
        })
    }
    finally{
        await connection.release(); //rilascia la connessione al termine delle operazioni 
    }


}


