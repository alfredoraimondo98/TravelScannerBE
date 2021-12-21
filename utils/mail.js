const nodemailer = require('nodemailer');

// definisco il trasporto (account mittente)
var transporter = nodemailer.createTransport({
  service: 'Gmail',
  secure: true, // use TLS
  auth: {
    user: 'alfredoraimondo98@gmail.com',
    pass: '08031998'
  }
});

module.exports = transporter;


/* Codice per inviare mail da inserire nel controller necessario
const transporter = require('./utils/mail');


// messaggio da inviare
var mailOptions = {
  from: 'alfredoraimondo98@gmail.com', //mittente
  to: 'alfredoraimondo1998@libero.it', //destinatario
  subject: 'Test email nodejs',
  //text: 'Sgart.it' // invia il corpo in plaintext
  html: '<b><img src = "https://www.tiscali.it/export/sites/tecnologia/.galleries/16/12-siti-per-vendere-foto.jpg" ></b>'  // invia il corpo in html
};

// invio il messaggio
transporter.sendMail(mailOptions, function(error, info){
  if(error) {
    console.log(error);
  }else{
    console.log('Messaggio inviato: ' + info.response);
  }
});
*/