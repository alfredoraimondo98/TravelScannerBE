const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const upload = require('../middleware/uploadImg'); //uploadImg middleware per l'upload delle immagini
const esperienzaController = require("../controllers/esperienza");


router.post('/createEsperienza',
//upload.single('fotoCopertina'),
upload.array('images',5),
[

]
,esperienzaController.createEsperienza)

router.post('/votaEsperienzaTot',esperienzaController.votaEsperienzaTot)
router.post('/votaFotoCopertina',esperienzaController.votaFotoCopertina)
router.post('/votaFotoGallery',esperienzaController.votaFotoGallery)
router.post('/votaDescrizione',esperienzaController.votaDescrizione)
router.post('/votaAccessibilita',esperienzaController.votaAccessibilita)


router.post('/getTopRatedReviews', esperienzaController.getTopRatedReviews); //Restituisce le eperienze in ordine di voto di un luogo
router.post('/getRecentlyReviews', esperienzaController.getRecentlyReviews); //Restituisce le esperienze più recenti di un luogo
router.post('/getTopCoverPhotoReviews', esperienzaController.getTopCoverPhotoReviews); //restituisce le esperienze in ordine di voto delle foto copertine
router.post('/getTopGalleryReviews', esperienzaController.getTopGalleryReviews); //restituisce le esperienze in ordine di voto delle gallery
router.post('/getTopDescriptionReviews', esperienzaController.getTopDescriptionReviews); //restituisce le esperienze in ordine di voto delle descrizioni
router.post('/getTopAccessibilityReviews', esperienzaController.getTopAccessibilityReviews); //restituisce le esperienze in ordine di voto delle descrizioni


router.post('/getVotoEffettuatoDescrizione', esperienzaController.getVotoEffettuatoDescrizione) //restitusce il voto della descrizione dell'utente su una determina esperienza
router.post('/getVotoEffettuatoFotoCopertina', esperienzaController.getVotoEffettuatoFotoCopertina)
router.post('/getVotoEffettuatoAccessibilita', esperienzaController.getVotoEffettuatoAccesibilita)
router.post('/getVotoEffettuatoGallery', esperienzaController.getVotoEffettuatoFotoGallery)
router.post('/getVotoEffettuatoEsperienza', esperienzaController.getVotoEffettuatoFotoGallery)

router.post('/updateEsperienza',upload.array('fotoGallery',10),
[

], esperienzaController.updateEsperienza);


 

module.exports= router