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
module.exports= router