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
    
    var idEsperienza = req.body.idEsperienza; // ** id utente che sta creando il nuovo luogo

    // ** dati per il luogo ricevuti in input
    var accessibilita = req.body.accessibilita
    var countAccessibilita=0

    var descrizione= req.body.descrizione
    var countDescrizione=0

  
    var countFotoCopertina=0  

    var idUtente= req.body.idUtente
    var idLuogo= req.body.idLuogo

    dataCreazione = format(new Date(), 'YYYY-MM-DD');

    var idGallery= req.body.idGallery
    var fotos=[]
    
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
console.log(idUtente)

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
//like
}

exports.votaDescrizione = async (req, res, next)=>{
// stelle
}

exports.votaAccessibilita = async (req, res, next)=>{
// stelle
}