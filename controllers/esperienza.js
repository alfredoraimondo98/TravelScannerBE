const database = require('../utils/database');
const bcrypt = require('bcryptjs');
const {format} = require('date-format-parse')
const { validationResult } = require('express-validator');
const query = require('../utils/queries')
const service = require('../utils/service');
const queries = require('../utils/queries');
const { connect } = require('../routes/auth');


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
    var idUtente= req.body.id_utente
    var idLuogo= req.body.id_luogo


    console.log("*** idutente, idluogo", idUtente, idLuogo);
    

    var countDescrizione=0
    var countAccessibilita=0
    var countFotoCopertina=0  
    var dataCreazione = format(new Date(), 'YYYY-MM-DD');
    var fotos=[]
    
    for(var i=0; i<req.files.length; i++){
        img=req.files[i].path.slice(6)
        fotos.push(img.replace(/\\/g, "/"))
    }

    var fotoCopertina=fotos[0]
    
    
    

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    await connection.beginTransaction(async function (err) { //avvia una nuova transazione
        if (err) { throw err; }
    });

    try{
        const [rows_esperienza, field_esperienza] = await connection.query(query.insertEsperienza, [descrizione, countDescrizione,fotoCopertina,countFotoCopertina,
            accessibilita, countAccessibilita, idLuogo]);

        

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

/**
 * votazione dell'esperienza totale
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.votaEsperienzaTot = async (req, res, next)=>{
    var idEsperienza= req.body.id_esperienza;
    var idUtente= req.body.id_utente;
    var isLiked = req.body.is_liked; 
        //* isLiked = true -> // ha già votato -> devo eliminare il voto
        //* isLiked = false -> // voglio votare -> devo inserire il voto

 
    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

        /*
        await connection.beginTransaction(async function (err) { //avvia una nuova transazione
            if (err) { throw err; }
        });
        */
    try{   

        if(isLiked == 'false'){
            console.log("*** sto votando");
            const [rows_voto, field_voto] = await connection.query(query.insertVoto, [idUtente, idEsperienza, 1, "esperienza"]); //inserisce il voto

            res.status(201).json({
                mess : 'voto inserito'
            })
        }
        else{
            console.log("*** sto eliminando il voto")
            const [rows_voto, field_voto] = await connection.query(query.deleteVoto, [idUtente, idEsperienza, "esperienza"]); //elimina il voto

            res.status(201).json({
                mess : 'voto cancellato'
            })
        }  
    
        // await connection.commit(); //effettua il commit delle transazioni
    }
    catch(err){ //se si verifica un errore 
        console.log("err " , err);
       // await connection.rollback(); //effettua il commit delle transazioni

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
    var idEsperienza= req.body.id_esperienza
    var idUtente= req.body.id_utente; //id utente loggato che sta votando
    
    
    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase
    
        await connection.beginTransaction(async function (err) { //avvia una nuova transazione
            if (err) { throw err; }
        });
    
    
    try{
        const [rows_verify, field_verify]= await connection.query(query.verifyVotoTipo,[idUtente, idEsperienza,"fotoCopertina"])
        if (rows_verify[0]==undefined){

        const [rows_voto, field_voto] = await connection.query(query.insertVoto, [idUtente,idEsperienza,1,"fotoCopertina"]);
        const [rows_votoFotoCopertina, field_votoFotoCopertina] = await connection.query(query.getNumVotiFotoCopertina, [idEsperienza]);
        await connection.query(query.updateNumVotiFotoCopertina,[rows_votoFotoCopertina[0].count_foto_copertina + 1, idEsperienza])

        const [rows_utenteDaVotare, field_utenteDaVotare] = await connection.query(query.getUserByIdEsperienza, [idEsperienza]);
        var idUtenteVotato = rows_utenteDaVotare[0].id_utente; //id dell'utente che riceve il voto

        //aggiornamento ambassador
        
        var votoMyFotoCopertina = rows_votoFotoCopertina[0].count_foto_copertina + 1; 
        
        const [rows_luogo, field_luogo] = await connection.query(query.getLuogoByIdEsperienza, [idEsperienza]); //recupera il luogo dell'esperienza che si sta votando
        var luogo = rows_luogo[0];

        const [rows_ambVoto, field_ambVoto] = await connection.query(query.getCountVotoAmbassadorByLuogo, [luogo.id_luogo, 'fotoCopertina']);
        const [rows_topCopertina, field_topCopertina] = await connection.query(query.getTopFotoCopertinaByLuogoWithUser, [luogo.id_luogo]);
        var idTopCopertina = rows_topCopertina[0].id_utente; 

        if(idUtenteVotato==idTopCopertina)
        {
            await connection.query(query.updateAmbassador, [idUtenteVotato, votoMyFotoCopertina, luogo.id_luogo, 'fotoCopertina']); //incremento il voto dell'ambassador
        }
        //confronto voto con l'ambassador 
        if(votoMyFotoCopertina > rows_ambVoto[0].count_voto){
            await connection.query(query.updateAmbassador, [idUtenteVotato, votoMyFotoCopertina, luogo.id_luogo, 'fotoCopertina']); //l'utente appena votato diventa ambassador
            await connection.query(query.updateCountAmbassadorByUser, [1, idUtenteVotato]); //aggiornamento count ambassador in 'utente'
        }

        await connection.commit(); //effettua il commit delle transazioni
    
        res.status(201).json({
            mess : 'voto inserito'
        })
    }
        else
        {
            const [rows_voto, field_voto] = await connection.query(query.deleteVoto, [idUtente,idEsperienza, "fotoCopertina"]);
            const [rows_votoFotoCopertina, field_votoFotoCopertina] = await connection.query(query.getNumVotiFotoCopertina, [idEsperienza]);
            await connection.query(query.updateNumVotiFotoCopertina,[rows_votoFotoCopertina[0].count_foto_copertina - 1, idEsperienza])

            const [rows_utenteDaVotare, field_utenteDaVotare] = await connection.query(query.getUserByIdEsperienza, [idEsperienza]);
            var idUtenteVotato = rows_utenteDaVotare[0].id_utente; //id dell'utente che riceve il voto

            //aggiornamento ambassador
            
            var votoMyFotoCopertina = rows_votoFotoCopertina[0].count_foto_copertina - 1; 
            
            const [rows_luogo, field_luogo] = await connection.query(query.getLuogoByIdEsperienza, [idEsperienza]); //recupera il luogo dell'esperienza che si sta votando
            var luogo = rows_luogo[0];

            const [rows_ambVoto, field_ambVoto] = await connection.query(query.getCountVotoAmbassadorByLuogo, [luogo.id_luogo, 'fotoCopertina']);

            const [rows_topCopertina, field_topCopertina] = await connection.query(query.getTopFotoCopertinaByLuogoWithUser, [luogo.id_luogo]);
            var idTopCopertina = rows_topCopertina[0].id_utente; 
            var votoTopCopertina =rows_topCopertina[0].count_foto_copertina;

            //confronto tra l'utente che ha la foto copertina con più mi piace e l'utente a cui si è tolto il voto
            if(idTopCopertina!=idUtenteVotato){
                await connection.query(query.updateAmbassador, [idTopCopertina, votoTopCopertina , luogo.id_luogo, 'fotoCopertina']); //l'utente appena votato diventa ambassador
                await connection.query(query.updateCountAmbassadorByUser, [1, idTopCopertina]);
                
            }
            else{
                await connection.query(query.updateAmbassador, [idTopCopertina, votoMyFotoCopertina, luogo.id_luogo, 'fotoCopertina']); //l'utente appena votato diventa ambassador 
            }
    

            await connection.commit();

           
            res.status(201).json({
                mess : 'voto cancellato'
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
    var idEsperienza= req.body.id_esperienza
    var idUtente= req.body.id_utente
    
    
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

        const [rows_utenteDaVotare, field_utenteDaVotare] = await connection.query(query.getUserByIdEsperienza, [idEsperienza]);
        var idUtenteVotato = rows_utenteDaVotare[0].id_utente; //id dell'utente che riceve il voto

        //aggiornamento ambassador
        
        var votoMyFotoGallery = rows_votoFotoGallery[0].count_gallery + 1; 
        
        const [rows_luogo, field_luogo] = await connection.query(query.getLuogoByIdEsperienza, [idEsperienza]); //recupera il luogo dell'esperienza che si sta votando
        var luogo = rows_luogo[0];

        const [rows_ambVoto, field_ambVoto] = await connection.query(query.getCountVotoAmbassadorByLuogo, [luogo.id_luogo, 'fotoGallery']);
        const [rows_topGallery, field_topGallery] = await connection.query(query.getTopGalleryByLuogo, [luogo.id_luogo]);
        
        const [rows_idTopGallery, field_idTopGallery] = await connection.query(query.getUserByIdEsperienza, [rows_topGallery[0].id_esperienza]); //prende l'id dell'utente della gallery che si sta votando
        
        idTopGallery=rows_idTopGallery[0].id_utente

        if(idUtenteVotato==idTopGallery) //incrementa il voto della fotoGallery del più votato
        {
            await connection.query(query.updateAmbassador, [idUtenteVotato, votoMyFotoGallery, luogo.id_luogo, 'fotoGallery']); //incremento il voto dell'ambassador
        }
        //confronto voto con l'ambassador 
        if(votoMyFotoGallery > rows_ambVoto[0].count_voto){
            await connection.query(query.updateAmbassador, [idUtenteVotato, votoMyFotoGallery, luogo.id_luogo, 'fotoGallery']); //l'utente appena votato diventa ambassador
            await connection.query(query.updateCountAmbassadorByUser, [1, idUtenteVotato]); //aggiornamento count ambassador in 'utente'
        }
        
        await connection.commit(); //effettua il commit delle transazioni
    
        res.status(201).json({
            mess : 'voto inserito'
        })
    }
        else
        {
            const [rows_voto, field_voto] = await connection.query(query.deleteVoto, [idUtente,idEsperienza, "fotoGallery"]);
            const [rows_votoFotoGallery, field_votoFotoGallery] = await connection.query(query.getNumVotiFotoGallery, [idEsperienza]);
            await connection.query(query.updateNumVotiFotoGallery,[rows_votoFotoGallery[0].count_gallery - 1, idEsperienza])

            const [rows_utenteDaVotare, field_utenteDaVotare] = await connection.query(query.getUserByIdEsperienza, [idEsperienza]);
            var idUtenteVotato = rows_utenteDaVotare[0].id_utente; //id dell'utente che riceve il voto
    
            //aggiornamento ambassador
            
            var votoMyFotoGallery = rows_votoFotoGallery[0].count_gallery - 1; 
            
            const [rows_luogo, field_luogo] = await connection.query(query.getLuogoByIdEsperienza, [idEsperienza]); //recupera il luogo dell'esperienza che si sta votando
            var luogo = rows_luogo[0];
    
            const [rows_ambVoto, field_ambVoto] = await connection.query(query.getCountVotoAmbassadorByLuogo, [luogo.id_luogo, 'fotoGallery']);
            const [rows_topGallery, field_topGallery] = await connection.query(query.getTopGalleryByLuogo, [luogo.id_luogo]);
            
            const [rows_idTopGallery, field_idTopGallery] = await connection.query(query.getUserByIdEsperienza, [rows_topGallery[0].id_esperienza]); //prende l'id dell'utente della gallery che si sta votando
            
            var idTopGallery=rows_idTopGallery[0].id_utente
            var votoTopFotoGallery=rows_topGallery[0].count_gallery

            console.log(votoTopFotoGallery)
    
            if(idTopGallery!=idUtenteVotato){
                await connection.query(query.updateAmbassador, [idTopGallery, votoTopFotoGallery , luogo.id_luogo, 'fotoGallery']); //l'utente appena votato diventa ambassador
                await connection.query(query.updateCountAmbassadorByUser, [1, idTopCopertina]);
                
            }
            else{
                await connection.query(query.updateAmbassador, [idTopGallery, votoTopFotoGallery, luogo.id_luogo, 'fotoGallery']); //l'utente appena votato diventa ambassador 
            }
            
            await connection.commit();
        }   

        res.status(201).json({
            mess: "voto cancellato"
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

exports.votaDescrizione = async (req, res, next)=>{
    var idEsperienza= req.body.id_esperienza
    var idUtente= req.body.id_utente
    var votoDescrizione= req.body.voto_descrizione

    var countTotalDescrizione; //Totale dei voti della descrizione

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    await connection.beginTransaction(async function (err) { //avvia una nuova transazione
        if (err) { throw err; }
    });

    try{
        const [rows_verify, field_verify]= await connection.query(query.verifyVotoTipo,[idUtente, idEsperienza,"descrizione"])
        if(rows_verify[0]==undefined){

            //BLOCCO VOTAZIONE
            await connection.query(query.insertVoto,[idUtente,idEsperienza,votoDescrizione,"descrizione"])
            const[rows_votoTot, field_votoTot]= await connection.query(query.getTotVotieSomma,[idEsperienza,"descrizione"])
            countTotalDescrizione = rows_votoTot[0].countVoti;

            sommaVoti=rows_votoTot[0].sommaVoti
            
            var mediaVoti=sommaVoti/rows_votoTot[0].countVoti

            await connection.query(query.updateVotoDescrizione,[mediaVoti, countTotalDescrizione, idEsperienza])
            //FINE BLOCCO DI VOTAZIONE

            //BLOCCO DI AMBASSADOR
            
            const [rows_utenteDaVotare, field_utenteDaVotare] = await connection.query(query.getUserByIdEsperienza, [idEsperienza]);
            var idUtenteVotato = rows_utenteDaVotare[0].id_utente; //id dell'utente che riceve il voto
            var votoMyDescrizione = mediaVoti; 
        
            const [rows_luogo, field_luogo] = await connection.query(query.getLuogoByIdEsperienza, [idEsperienza]); //recupera il luogo dell'esperienza che si sta votando
            var luogo = rows_luogo[0];

            const [rows_ambVoto, field_ambVoto] = await connection.query(query.getCountVotoAmbassadorByLuogo, [luogo.id_luogo, 'descrizione']);

            const [rows_topDescrizione, field_topDescrizione] = await connection.query(query.getTopDescrizioneByLuogoWithUser, [luogo.id_luogo]);
            var idTopDescrizione=rows_topDescrizione[0].id_utente
            var votoTopDescrizione= rows_topDescrizione[0].count_descrizione
            
            
            if(idTopDescrizione!=idUtenteVotato){
                await connection.query(query.updateAmbassador, [idTopDescrizione, votoTopDescrizione , luogo.id_luogo, 'descrizione']); //l'utente appena votato diventa ambassador
                await connection.query(query.updateCountAmbassadorByUser, [1, idTopDescrizione]);
                
            }
            else{
                await connection.query(query.updateAmbassador, [idTopDescrizione, votoTopDescrizione, luogo.id_luogo, 'descrizione']); //l'utente appena votato diventa ambassador 
            }

            //FINE BLOCCO DI AMBASSADOR



            
            console.log("********** TOTALE (PRIMO VOTO) ", sommaVoti, countTotalDescrizione);
            
            await connection.commit(); //effettua il commit delle transazioni

            res.status(201).json({
                mess : 'voto inserito',
                count_descrizione : mediaVoti,
                count_total_descrizione : countTotalDescrizione
            })
        }
        else{
            
            //BLOCCO VOTAZIONE
            await connection.query(query.updateVoto,[votoDescrizione,idEsperienza,idUtente,"descrizione"])
            const[rows_votoTot, field_votoTot]= await connection.query(query.getTotVotieSomma,[idEsperienza,"descrizione"])
            countTotalDescrizione = rows_votoTot[0].countVoti;


            sommaVoti=rows_votoTot[0].sommaVoti
            var mediaVoti=sommaVoti/rows_votoTot[0].countVoti
            await connection.query(query.updateVotoDescrizione,[mediaVoti,countTotalDescrizione,idEsperienza])



            //FINE BLOCCO DI VOTAZIONE

            const [rows_utenteDaVotare, field_utenteDaVotare] = await connection.query(query.getUserByIdEsperienza, [idEsperienza]);
            var idUtenteVotato = rows_utenteDaVotare[0].id_utente; //id dell'utente che riceve il voto
            var votoMyDescrizione = mediaVoti; 
        
            const [rows_luogo, field_luogo] = await connection.query(query.getLuogoByIdEsperienza, [idEsperienza]); //recupera il luogo dell'esperienza che si sta votando
            var luogo = rows_luogo[0];

            const [rows_ambVoto, field_ambVoto] = await connection.query(query.getCountVotoAmbassadorByLuogo, [luogo.id_luogo, 'descrizione']);

            const [rows_topDescrizione, field_topDescrizione] = await connection.query(query.getTopDescrizioneByLuogoWithUser, [luogo.id_luogo]);
            var idTopDescrizione=rows_topDescrizione[0].id_utente
            var votoTopDescrizione= rows_topDescrizione[0].count_descrizione
            
            
            if(idTopDescrizione!=idUtenteVotato){
                await connection.query(query.updateAmbassador, [idTopDescrizione, votoTopDescrizione , luogo.id_luogo, 'descrizione']); //l'utente appena votato diventa ambassador
                await connection.query(query.updateCountAmbassadorByUser, [1, idTopDescrizione]);
                
            }
            else{
                console.log(mediaVoti)
                await connection.query(query.updateAmbassador, [idTopDescrizione, mediaVoti, luogo.id_luogo, 'descrizione']); //l'utente appena votato diventa ambassador 
            }


            //BLOCCO AMBASSADOR

            //FINE BLOCCO AMBASSADOR
            console.log("********** TOTALE ", mediaVoti, countTotalDescrizione);

            await connection.commit();
            res.status(201).json({
                mess : 'voto aggiornato',
                count_descrizione : mediaVoti,
                count_total_descrizione : countTotalDescrizione
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

    console.log("********************************")
    var idEsperienza= req.body.id_esperienza
    var idUtente= req.body.id_utente
    var votoAccessibilita= req.body.voto_accessibilita

    var countTotalAccessibilita; //Totale dei voti della descrizione


    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    await connection.beginTransaction(async function (err) { //avvia una nuova transazione
        if (err) { throw err; }
    });

    try{
        const [rows_verify, field_verify]= await connection.query(query.verifyVotoTipo,[idUtente, idEsperienza,"accessibilita"])
        if(rows_verify[0]==undefined){

            //BLOCCO VOTAZIONE
            await connection.query(query.insertVoto,[idUtente,idEsperienza,votoAccessibilita,"accessibilita"])
            const[rows_votoTot, field_votoTot]= await connection.query(query.getTotVotieSomma,[idEsperienza,"accessibilita"])
            countTotalAccessibilita = rows_votoTot[0].countVoti; // TOTALE VOTI


            var sommaVoti=rows_votoTot[0].sommaVoti
            var mediaVoti=sommaVoti/rows_votoTot[0].countVoti
            await connection.query(query.updateVotoAccessibilita,[mediaVoti,countTotalAccessibilita,idEsperienza])
            //FINE BLOCCO VOTAZIONE

            //BLOCCO AMBASSADOR
            const [rows_utenteDaVotare, field_utenteDaVotare] = await connection.query(query.getUserByIdEsperienza, [idEsperienza]);
            var idUtenteVotato = rows_utenteDaVotare[0].id_utente; //id dell'utente che riceve il voto
            var votoMyAccessibilita = mediaVoti; 
        
            const [rows_luogo, field_luogo] = await connection.query(query.getLuogoByIdEsperienza, [idEsperienza]); //recupera il luogo dell'esperienza che si sta votando
            var luogo = rows_luogo[0];

            const [rows_ambVoto, field_ambVoto] = await connection.query(query.getCountVotoAmbassadorByLuogo, [luogo.id_luogo, 'accessibilita']);

            const [rows_topAccessibilita, field_topAccessibilita] = await connection.query(query.getTopAccessibilitaByLuogoWithUser, [luogo.id_luogo]);
            var idTopAccessibilita=rows_topAccessibilita[0].id_utente
            var votoTopAccessibilita= rows_topAccessibilita[0].count_accessibilita

            
            if(idTopAccessibilita!=idUtenteVotato){
                await connection.query(query.updateAmbassador, [idTopAccessibilita, votoTopAccessibilita , luogo.id_luogo, 'accessibilita']); //l'utente appena votato diventa ambassador
                await connection.query(query.updateCountAmbassadorByUser, [1, idTopAccessibilita]);
                
            }
            else{
                await connection.query(query.updateAmbassador, [idTopAccessibilita, mediaVoti, luogo.id_luogo, 'accessibilita']); //l'utente appena votato diventa ambassador 
            }

            //FINE BLOCCO AMBASSADOR

            
            await connection.commit(); //effettua il commit delle transazioni

            res.status(201).json({
                mess : 'voto inserito',
                count_accessibilita : mediaVoti,
                count_total_accessibilita : countTotalAccessibilita
            })
        }
        else{
            
            await connection.query(query.updateVoto,[votoAccessibilita,idEsperienza,idUtente,"accessibilita"])
            const[rows_votoTot, field_votoTot]= await connection.query(query.getTotVotieSomma,[idEsperienza,"accessibilita"])
            countTotalAccessibilita = rows_votoTot[0].countVoti;
            var sommaVoti=rows_votoTot[0].sommaVoti
            var mediaVoti=sommaVoti/rows_votoTot[0].countVoti
            
            await connection.query(query.updateVotoAccessibilita,[mediaVoti,countTotalAccessibilita,idEsperienza])

            //BLOCCO AMBASSADOR
            const [rows_utenteDaVotare, field_utenteDaVotare] = await connection.query(query.getUserByIdEsperienza, [idEsperienza]);
            var idUtenteVotato = rows_utenteDaVotare[0].id_utente; //id dell'utente che riceve il voto
            var votoMyAccessibilita = mediaVoti; 
            console.log(votoMyAccessibilita)
        
            const [rows_luogo, field_luogo] = await connection.query(query.getLuogoByIdEsperienza, [idEsperienza]); //recupera il luogo dell'esperienza che si sta votando
            var luogo = rows_luogo[0];

            const [rows_ambVoto, field_ambVoto] = await connection.query(query.getCountVotoAmbassadorByLuogo, [luogo.id_luogo, 'accessibilita']);

            const [rows_topAccessibilita, field_topAccessibilita] = await connection.query(query.getTopAccessibilitaByLuogoWithUser, [luogo.id_luogo]);
            var idTopAccessibilita=rows_topAccessibilita[0].id_utente
            var votoTopAccessibilita= rows_topAccessibilita[0].count_accessibilita

            
            if(idTopAccessibilita!=idUtenteVotato){
                await connection.query(query.updateAmbassador, [idTopAccessibilita, votoTopAccessibilita , luogo.id_luogo, 'accessibilita']); //l'utente appena votato diventa ambassador
                await connection.query(query.updateCountAmbassadorByUser, [1, idTopAccessibilita]);
                
            }
            else{
                await connection.query(query.updateAmbassador, [idTopAccessibilita, mediaVoti, luogo.id_luogo, 'accessibilita']); //l'utente appena votato diventa ambassador 
            }
             

            //FINE BLOCCO AMBASSADOR

            await connection.commit();
            res.status(201).json({
                mess : 'voto aggiornato',
                count_accessibilita : mediaVoti,
                count_total_accessibilita : countTotalAccessibilita
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
 exports.getTopRatedReviews = async(req, res, next) => {

    var idLuogo = req.body.id_luogo;
    var idUtente = req.body.id_utente; //id utente che fa la richiesta (verificare se ha già messo like all'esperienza)

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
            exp['count_gallery'] = 0;
            galleryComplete.forEach( gallery => {
                if(exp.id_esperienza == gallery.id_esperienza){

                    exp['count_gallery'] = gallery.count_gallery; //setta il count della gallery

                    exp.gallery.push(service.server+gallery.path); //immagine gallery
                }
            })
        })

       //ordinamento in base al count_esperienza (dall'esperienza più votata alla meno votata)
        experiences.sort( function(a, b) {
            return b.count_esperienza - a.count_esperienza
        })
        

        
        // Recupera informazioni dei like dell'utente loggato
        var promisesArray = [];
        var resultsVoteVerify = [];
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
        });
        
        Promise.all(promisesArray).then( (values) => {
           // console.log("****** VOTE VERIFY, ", values[0]);
            //resultsVoteVerify.push(values);

            //Conversione data
        for(let i = 0; i < experiences.length; i++){
            //voto esperienza per l'utente loggato (true|false)

            experiences[i]['flag_voto_esperienza'] = values[i];

            //data
            let dataC = (experiences[i].data_creazione.toISOString().slice(0,10)); //Conversione data
            let y= dataC.slice(0,4)
            let m = dataC.slice(5,7);
            let d = dataC.slice(8-10);
            experiences[i].data_creazione = d+"-"+m+"-"+y;
        }
    
            res.status(201).send(experiences);
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
 exports.getRecentlyReviews = async(req, res, next) => {

    var idLuogo = req.body.id_luogo;
    var idUtente = req.body.id_utente;

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
            exp['count_gallery'] = 0;
            galleryComplete.forEach( gallery => {
                if(exp.id_esperienza == gallery.id_esperienza){

                    exp['count_gallery'] = gallery.count_gallery; //setta il count della gallery

                    exp.gallery.push(service.server+gallery.path); //immagine gallery
                }
            })
        })

       //ordinamento in base alla data di creazione (dall'esperienza più recente alla meno recente)
        experiences.sort( function(a, b) {
            return b.data_creazione - a.data_creazione
        })
        

    // Recupera informazioni dei like dell'utente loggato
    var promisesArray = [];
    var resultsVoteVerify = [];
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
    });

    
    Promise.all(promisesArray).then( (values) => {
        //resultsVoteVerify.push(values);

        //Conversione data
    for(let i = 0; i < experiences.length; i++){
        //voto esperienza per l'utente loggato (true|false)
        console.log("****** VOTE VERIFY, ", values[i]);

        experiences[i]['flag_voto_esperienza'] = values[i];

        //data
        let dataC = (experiences[i].data_creazione.toISOString().slice(0,10)); //Conversione data
        let y= dataC.slice(0,4)
        let m = dataC.slice(5,7);
        let d = dataC.slice(8-10);
        experiences[i].data_creazione = d+"-"+m+"-"+y;
    }

        res.status(201).send(experiences);
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
 * FOTO COPERTINA: restituisce le esperienze di un luogo in ordine dei voti relativi alla foto copertina
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
 exports.getTopCoverPhotoReviews = async(req, res, next) => {

    var idLuogo = req.body.id_luogo;
    var idUtente = req.body.id_utente;

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
            exp['count_gallery'] = 0;
            galleryComplete.forEach( gallery => {
                if(exp.id_esperienza == gallery.id_esperienza){

                    exp['count_gallery'] = gallery.count_gallery; //setta il count della gallery

                    exp.gallery.push(service.server+gallery.path); //immagine gallery
                }
            })
        })

       //ordinamento in base ai voti della foto copertina (dall'esperienza più recente alla meno recente)
        experiences.sort( function(a, b) {
            return b.count_foto_copertina - a.count_foto_copertina
        })
        

    // Recupera informazioni dei like per la fotoCopertina dell'utente loggato
    var promisesArray = [];
    experiences.forEach(async exp => {
        
            var p = new Promise(async (resolve, reject) => {
                const [rows, field] = await connection.query(query.verifyVotoTipo, [idUtente, exp.id_esperienza, 'fotoCopertina']);
                if(rows[0] != undefined){
                    resolve(true);  
                }
                else{
                    resolve(false);  
                }
            })

            promisesArray.push(p);
    });

    
    Promise.all(promisesArray).then( (values) => {

        //Conversione data
    for(let i = 0; i < experiences.length; i++){
        //voto esperienza per l'utente loggato (true|false)
        console.log("****** VOTE VERIFY, ", values[i]);

        experiences[i]['flag_voto_fotoCopertina'] = values[i];

        //data
        let dataC = (experiences[i].data_creazione.toISOString().slice(0,10)); //Conversione data
        let y= dataC.slice(0,4)
        let m = dataC.slice(5,7);
        let d = dataC.slice(8-10);
        experiences[i].data_creazione = d+"-"+m+"-"+y;
    }

        res.status(201).send(experiences);
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
 * GALLERY: restituisce le esperienze di un luogo in ordine dei voti relativi alla gallery
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
 exports.getTopGalleryReviews = async(req, res, next) => {

    var idLuogo = req.body.id_luogo;
    var idUtente = req.body.id_utente;

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
            exp['count_gallery'] = 0; // count gallery
            galleryComplete.forEach( gallery => {
                if(exp.id_esperienza == gallery.id_esperienza){
                    exp['count_gallery'] = gallery.count_gallery; //setta il count della gallery
                   // console.log("*** GALLERY ", exp.gallery);
                    exp.gallery.push(service.server+gallery.path); //immagine gallery
                }
            })
        })

       //ordinamento in base ai voti della gallery 
        experiences.sort( function(a, b) {
            return b.count_gallery - a.count_gallery
        })
        

    // Recupera informazioni dei like per la fotoCopertina dell'utente loggato
    var promisesArray = [];
    experiences.forEach(async exp => {
        
            var p = new Promise(async (resolve, reject) => {
                const [rows, field] = await connection.query(query.verifyVotoTipo, [idUtente, exp.id_esperienza, 'fotoGallery']);
                if(rows[0] != undefined){
                    resolve(true);  
                }
                else{
                    resolve(false);  
                }
            })

            promisesArray.push(p);
    });

    
    Promise.all(promisesArray).then( (values) => {

        //Conversione data
    for(let i = 0; i < experiences.length; i++){
        //voto esperienza per l'utente loggato (true|false)
        console.log("****** VOTE VERIFY, ", values[i]);

        experiences[i]['flag_voto_gallery'] = values[i];

        //data
        let dataC = (experiences[i].data_creazione.toISOString().slice(0,10)); //Conversione data
        let y= dataC.slice(0,4)
        let m = dataC.slice(5,7);
        let d = dataC.slice(8-10);
        experiences[i].data_creazione = d+"-"+m+"-"+y;
    }

        res.status(201).send(experiences);
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
 * DESCRIZIONE: restituisce le esperienze di un luogo in ordine dei voti relativi alla gallery
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
 exports.getTopDescriptionReviews = async(req, res, next) => {
    console.log("*********************+")
    var idLuogo = req.body.id_luogo;
    var idUtente = req.body.id_utente;

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
            exp['count_gallery'] = 0; // count gallery
            galleryComplete.forEach( gallery => {
                if(exp.id_esperienza == gallery.id_esperienza){
                    exp['count_gallery'] = gallery.count_gallery; //setta il count della gallery
                   // console.log("*** GALLERY ", exp.gallery);
                    exp.gallery.push(service.server+gallery.path); //immagine gallery
                }
            })
        })

       //ordinamento in base ai voti della gallery 
        experiences.sort( function(a, b) {
            return b.count_descrizione - a.count_descrizione;
        })
        

    // Recupera informazioni dei like per la fotoCopertina dell'utente loggato
    var promisesArray = [];
    experiences.forEach(async exp => {
        
            var p = new Promise(async (resolve, reject) => {
                const [rows, field] = await connection.query(query.verifyVotoTipo, [idUtente, exp.id_esperienza, 'descrizione']);
                if(rows[0] != undefined){
                    resolve(true);  
                }
                else{
                    resolve(false);  
                }
            })

            promisesArray.push(p);
    });

    
    Promise.all(promisesArray).then( (values) => {

        //Conversione data
    for(let i = 0; i < experiences.length; i++){
        //voto esperienza per l'utente loggato (true|false)
        console.log("****** VOTE VERIFY, ", values[i]);

        experiences[i]['flag_voto_descrizione'] = values[i];

        //data
        let dataC = (experiences[i].data_creazione.toISOString().slice(0,10)); //Conversione data
        let y= dataC.slice(0,4)
        let m = dataC.slice(5,7);
        let d = dataC.slice(8-10);
        experiences[i].data_creazione = d+"-"+m+"-"+y;
    }

        res.status(201).send(experiences);
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
 * ACCESSIBILITA: restituisce le esperienze di un luogo in ordine dei voti relativi alla gallery
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
 exports.getTopAccessibilityReviews = async(req, res, next) => {

   
    
    var idLuogo = req.body.id_luogo;
    var idUtente = req.body.id_utente;

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
            exp['count_gallery'] = 0; // count gallery
            galleryComplete.forEach( gallery => {
                if(exp.id_esperienza == gallery.id_esperienza){
                    exp['count_gallery'] = gallery.count_gallery; //setta il count della gallery
                   // console.log("*** GALLERY ", exp.gallery);
                    exp.gallery.push(service.server+gallery.path); //immagine gallery
                }
            })
        })

       //ordinamento in base ai voti della gallery 
        experiences.sort( function(a, b) {
            return b.count_accessibilita - a.count_accessibilita;
        })
        

    // Recupera informazioni dei like per la fotoCopertina dell'utente loggato
    var promisesArray = [];
    experiences.forEach(async exp => {
        
            var p = new Promise(async (resolve, reject) => {
                const [rows, field] = await connection.query(query.verifyVotoTipo, [idUtente, exp.id_esperienza, 'accessibilita']);
                if(rows[0] != undefined){
                    resolve(true);  
                }
                else{
                    resolve(false);  
                }
            })

            promisesArray.push(p);
    });

    
    Promise.all(promisesArray).then( (values) => {

        //Conversione data
    for(let i = 0; i < experiences.length; i++){
        //voto esperienza per l'utente loggato (true|false)
        console.log("****** VOTE VERIFY, ", values[i]);

        experiences[i]['flag_voto_accessibilita'] = values[i];

        //data
        let dataC = (experiences[i].data_creazione.toISOString().slice(0,10)); //Conversione data
        let y= dataC.slice(0,4)
        let m = dataC.slice(5,7);
        let d = dataC.slice(8-10);
        experiences[i].data_creazione = d+"-"+m+"-"+y;
    }

        res.status(201).send(experiences);
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


exports.getVotoEffettuatoEsperienza = async(req,res,next)=>{
    var idEsperienza= req.body.id_esperienza;
    var idUtente= req.body.id_utente;

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    await connection.beginTransaction(async function (err) { //avvia una nuova transazione
        if (err) { throw err; }
    });

    try{

        const [rows_verify, field_verify]= await connection.query(query.verifyVotoTipo,[idUtente, idEsperienza,"esperienza"])
        if(rows_verify[0]==undefined){
            
            await connection.commit(); //effettua il commit delle transazioni

            res.status(201).json({
                esperienza: 0
            })
        }
        else{
            
            esperienza= rows_verify[0].voto

            await connection.commit();
            res.status(201).json({
                esperienza: esperienza
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



exports.updateEsperienza = async(req,res,next)=>{
    var idEsperienza= req.body.idEsperienza;
    var descrizione=req.body.descrizione;
    var accessibilita= req.body.accessibilita
    var fotoCopertina=req.files[0].path.slice(6)
    var fotoGallery=[]
    

    for(var i=1; i<req.files.length;i++){
        img=req.files[i].path.slice(6)
        fotoGallery.push(img.replace(/\\/g, "/"))
    }
    

    const connection = await database.getConnection(); //recupera una connessione dal pool di connessioni al dabatase

    await connection.beginTransaction(async function (err) { //avvia una nuova transazione
        if (err) { throw err; }
    });

    try {
        
        if(descrizione!=null)
        {

            await connection.query(queries.updateDescrizione,[descrizione,idEsperienza])
            

            
        }

        if(accessibilita!=null)
        {
            await connection.query(queries.updateAccessibilita,[accessibilita,idEsperienza])
            

            res.status(201).json({
                mess: "ok acc"
            })
        }
        
        if(fotoCopertina!=null)
        {
            await connection.query(queries.updateFotoCopertina,[fotoCopertina,idEsperienza])
              
        }

        if(fotoGallery != []){
            const [rows_gallery,field_gallery]= await connection.query(query.getGallery,[idEsperienza])
            
            idGallery= rows_gallery[0].id_gallery;
            console.log(idGallery)

            for(var i=1; i<fotoGallery.length; i++){
                console.log(fotoGallery[i])
                await connection.query(query.insertFoto,[fotoGallery[i],idGallery])
            }

        }

        else{
            const [rows_gallery,field_gallery]= await connection.query(query.getGallery,[idEsperienza])
            idGallery= rows_gallery[0].id_gallery;
            await connection.query(query.insertFoto,[undefined,idGallery])
        }
    
        
        
        await connection.commit();
        
        
    } catch (error) {;

        res.status(401).json({
            mess : error
        })
    }

}

