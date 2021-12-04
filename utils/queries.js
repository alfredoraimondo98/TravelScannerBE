module.exports = { 


    insertUser : "INSERT INTO utente (nome, cognome, email, password, data_di_nascita, badge) VALUES (?, ?, ?, ?, ?, ?)",



    verifyMail : "SELECT email FROM utente WHERE email = ?",

}
