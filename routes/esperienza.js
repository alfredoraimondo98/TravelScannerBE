const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const upload = require('../middleware/uploadImg'); //uploadImg middleware per l'upload delle immagini
const esperienzaController = require("../controllers/esperienza");


router.post('/createEsperienza',
//upload.single('fotoCopertina'),
upload.array('fotoGallery',3),
[

]
,esperienzaController.createEsperienza)

router.post('/votaEsperienzaTot',esperienzaController.votaEsperienzaTot)
router.post('/votaFotoCopertina',esperienzaController.votaFotoCopertina)
router.post('/votaDescrizione',esperienzaController.votaDescrizione)
router.post('/votaAccessibilita',esperienzaController.votaAccessibilita)
router.post('/getEsperienzeVotate', esperienzaController.getEsperienzeVotate); //Restituisce le eperienze in ordine di voto di un luogo

router.post('/getEsperienzeRecenti', esperienzaController.getEsperienzeRecenti); //Restituisce le esperienze più recenti di un luogo

module.exports= router