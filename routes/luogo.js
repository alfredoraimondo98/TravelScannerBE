const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const upload = require('../middleware/uploadImg'); //uploadImg middleware per l'upload delle immagini
const luogoController = require("../controllers/luogo");



router.post('/createLuogo', 
    upload.single('foto_copertina'), //caricamento foto copertina luogo
    [
        //controllo valori input
    ],
    luogoController.createLuogo);



router.get('/getAllLuoghi', luogoController.getAllLuoghi)

module.exports = router;