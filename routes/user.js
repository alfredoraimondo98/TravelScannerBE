const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const upload = require('../middleware/uploadImg'); //uploadImg middleware per l'upload delle immagini
const userController = require("../controllers/user");





router.get('/getRecentlyUsersPhoto', userController.getRecentlyUsersPhoto); //restituisce le foto degli ultimi utenti registrati


router.post('/getMyProfile', userController.getMyProfile); //restituisce i dati del profilo di un dato utente
router.post('/getMyExperiences', userController.getMyExperiences) //Restituisce tutte le esperienze create dall'utente




module.exports = router;