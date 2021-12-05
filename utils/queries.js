module.exports = { 

    getUserByEmail: "SELECT * FROM utente WHERE email = ?",

    insertUser : "INSERT INTO utente (nome, cognome, email, password, data_di_nascita, badge, img) VALUES (?, ?, ?, ?, ?, ?, ?)",
    insertLuogo : "INSERT INTO luogo (titolo, posizione, citta, nazione, id_utente, data_creazione) VALUES (?, ?, ?, ?, ?, ?)",
    insertEsperienza : "INSERT INTO esperienza (descrizione, count_descrizione, foto_copertina, count_foto_copertina, accessibilita, count_accessibilita, id_utente, data_creazione, id_luogo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    insertOrario : "INSERT INTO orari_di_apertura (id_luogo, orario_apertura, orario_chiusura) VALUES (?, ? , ?)",
    insertCosto : "INSERT INTO costo (id_luogo, costo_minimo, costo_massimo) VALUES (?, ? , ?)",
    insertGallery: "INSERT INTO gallery(count,id_esperienza) VALUES (?,?)",
    insertFoto: "INSERT INTO foto(path,id_gallery) VALUES (?,?)",
    insertVoto: "INSERT INTO voto(id_utente, id_esperienza, voto, tipo_voto) VALUES (?,?,?,?)",

    verifyMail : "SELECT email FROM utente WHERE email = ?",
    verifyLuogo : "SELECT titolo FROM luogo WHERE titolo = ?",
    verifyVoto : "SELECT voto FROM voto WHERE id_utente = ? AND id_esperienza = ?"
}
