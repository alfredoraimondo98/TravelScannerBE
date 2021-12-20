const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const upload = require('../middleware/uploadImg'); //uploadImg middleware per l'upload delle immagini
const userController = require("../controllers/user");





router.get('/getRecentlyUsersPhoto', userController.getRecentlyUsersPhoto); //restituisce le foto degli ultimi utenti registrati


router.post('/getMyProfile', userController.getMyProfile); //restituisce i dati del profilo di un dato utente
router.post('/getMyExperiences', userController.getMyExperiences) //Restituisce tutte le esperienze create dall'utente

router.post('/updateMyProfile', 
                upload.single('img'),
            [
                body('email').isEmail().withMessage('Inserisci una mail valida name@server.com'),
                body('password').trim().isLength({ min : 8}).matches('^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+){8,255}').withMessage('Inserisci una password valida'),
                body('nome').isLength({max : 100}),
                body('cognome').isLength({max : 100})
            //  body('data_di_nascita').matches('^[\d]{4}-[\d]{2}-[\d]{2}').withMessage("Inserisci una data valida"),
            ],
            userController.updateMyProfile); //Aggiornamento del profilo utente



module.exports = router;