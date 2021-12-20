const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const upload = require('../middleware/uploadImg'); //uploadImg middleware per l'upload delle immagini
const authController = require("../controllers/auth");


router.post('/register',    
    upload.single('img'), //caricamento img profilo
    [
        body('email').isEmail().withMessage('Inserisci una mail valida name@server.com'),
        body('password').trim().isLength({ min : 8}).matches('^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+){8,255}').withMessage('Inserisci una password valida'),
        body('nome').isLength({max : 100}),
        body('cognome').isLength({max : 100}),
      //  body('data_di_nascita').matches('^[\d]{4}-[\d]{2}-[\d]{2}').withMessage("Inserisci una data valida"),
        body('badge').isLength({max : 100})
    ], 
    authController.register); //registrazione utente


router.post('/login',
    [
        body('email').isEmail().withMessage('Inserisci una mail valida name@server.com'),
        body('password').trim().isLength({ min : 8}).matches('^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+){8,255}').withMessage('Inserisci una password valida'),
    ],
    authController.login)


router.post('/verifyMail', [], authController.verifyEmail); 


router.post('/updateImg', upload.single('img'), authController.updateImg); //aggiorna l'immagine dell'utente

module.exports = router;