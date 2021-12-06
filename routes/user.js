const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const upload = require('../middleware/uploadImg'); //uploadImg middleware per l'upload delle immagini
const userController = require("../controllers/user");


router.get('/getLastUsersPhoto', userController.getLastUserPhoto); //restituisce le foto degli ultimi utenti registrati


module.exports = router;