const express = require('express');
const app = express();

app.use(express.urlencoded({extended: true})); 
app.use(express.json());  

const cors = require('cors');
app.use(cors());

 

//const db = require('./utils/connection');

 
// *** Routes

const auth = require('./routes/auth');
app.use('/auth', auth);

const luogo = require('./routes/luogo');
app.use('/luogo', luogo);

app.use(express.static('public')) //rende accessibile la cartella public (per le immagini)




//app.listen(3000, () => console.log("server start")); //localhost porta 3000

app.listen(process.env.PORT || 35540, () => console.log("server start on "+ process.env.PORT)); //heroku
