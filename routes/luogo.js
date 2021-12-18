const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const upload = require('../middleware/uploadImg'); //uploadImg middleware per l'upload delle immagini
const luogoController = require("../controllers/luogo");



router.post('/createPlace', 
    upload.array('images', 5 ), //caricamento foto copertina luogo (.[0] -> foto copertina ; .[1] - [4] foto gallery)
    [
        //controllo valori input
    ],
    luogoController.createPlace);



router.get('/getAllPlaces', luogoController.getAllPlaces); //Recupera tutti i luoghi per la visualizzazione nella card;

router.get('/getRandomPlaces', luogoController.getRandomPlaces);; //Restituisce una lista di luoghi random da quelli presenti 

router.post('/getLuogo', luogoController.getLuogo); //recupera le info per il luogo con un determinato id

module.exports = router;