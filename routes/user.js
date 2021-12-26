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



router.post('/updateName', [body('nome').isLength({max : 100}),],userController.updateName);
router.post('/updateSurname',[ body('cognome').isLength({max : 100})], userController.updateSurname);
router.post('/updateEmail', [body('email').isEmail().withMessage('Inserisci una mail valida name@server.com'),],userController.updateEmail);
router.post('/updateEmail', upload.single('img'),userController.updateImgProfile);

router.post('/checkPassword', 
        [body('password').trim().isLength({ min : 8}).matches('^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+){8,255}').withMessage('Inserisci una password valida')],
        userController.checkPassword); //Verifica la password attuale

router.post('/updatePassword', [
    body('password').trim().isLength({ min : 8}).matches('^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+){8,255}').withMessage('Inserisci una password valida')
    ],
    userController.updatePassword)

router.post('/updateImg',  upload.single('img'), userController.updateImg);


router.post('/getCountPost', userController.getCountPost); //recupera il numero di post dell'utente
router.post('/getCountLike', userController.getCountLike); //recupera il numero di post dell'utente


router.post('/forgottenPassword', userController.forgottenPassword); //procedura di password dimendicata
router.post('/searchUser',userController.searchUser)
router.post('/searchAll',userController.serchAll)
module.exports = router;