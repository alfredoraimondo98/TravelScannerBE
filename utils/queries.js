module.exports = { 

    getUserByEmail: "SELECT * FROM utente WHERE email = ?",
    getUserById : "SELECT * FROM utente WHERE id_utente = ?",
    getAllLuoghi : "SELECT * FROM luogo",
    getLuogoById : "SELECT * FROM luogo WHERE id_luogo = ?", 
    getDescrizioneByLuogo : "SELECT id_esperienza, descrizione, count_descrizione, data_creazione FROM esperienza WHERE id_luogo = ? ORDER BY data_creazione DESC, count_descrizione DESC", //Restituisce la descrizione con voto (count) più alto per il luogo
    getFotoCopertinaByLuogo : "SELECT id_esperienza, foto_copertina, count_foto_copertina, data_creazione FROM esperienza WHERE id_luogo = ? ORDER BY data_creazione DESC, foto_copertina DESC", //Restituisce la foto copertina con voto (count) più alto per il luogo
    getAccessibilitaByLuogo : "SELECT id_esperienza, accessibilita, count_accessibilita, data_creazione FROM esperienza WHERE id_luogo = ? ORDER BY data_creazione DESC, count_accessibilita DESC", // Restituisce l'accessibilita con voto (count) più alto per il luogo
    getOrariByLuogo : "SELECT orario_apertura, orario_chiusura FROM orari_di_apertura WHERE id_luogo = ?",
    getCostoByLuogo : "SELECT costo_minimo, costo_massimo FROM costo WHERE id_luogo = ?",
   
    getMyExperience : "SELECT * FROM esperienza WHERE id_utente = ?",

    getMyGalleryByExperience : `SELECT foto.path, gallery.count FROM gallery JOIN foto
                                ON gallery.id_gallery = foto.id_gallery
                                WHERE gallery.id_esperienza = ?`,
                
   /* getLuogoCard : `SELECT luogo.id_luogo, luogo.titolo, luogo.citta, luogo.nazione, luogo.data_creazione, esperienza.foto_copertina, esperienza.count_foto_copertina, esperienza.data_creazione as data_creazione_esperienza
                    FROM luogo JOIN esperienza JOIN orari_di_apertura JOIN costo
                    ON luogo.id_luogo = esperienza.id_luogo 
                    WHERE luogo.id_luogo = ?
                    ORDER BY count_foto_copertina DESC, data_creazione_esperienza DESC`, //Restituisce i dati per una card di un luogo con la foto_copertina più votata in prima posizione nel risultato
     */   

     getLuogoCard : `SELECT luogo.id_luogo, luogo.titolo, luogo.posizione, luogo.citta, luogo.nazione, luogo.data_creazione, 
                        esperienza.foto_copertina, esperienza.count_foto_copertina, esperienza.data_creazione as data_creazione_esperienza 
                    FROM luogo  LEFT JOIN esperienza 
                    ON luogo.id_luogo = esperienza.id_luogo 
                    WHERE luogo.id_luogo = ?
                    ORDER BY esperienza.count_foto_copertina DESC, data_creazione_esperienza DESC`, 

 

    getNumVotiFotoCopertina: 'SELECT count_foto_copertina from esperienza WHERE id_esperienza = ?',


    getEsperienzeByLuogo : "SELECT * FROM esperienza WHERE id_luogo = ?",

    getEsperienzeCountByLuogo : ` SELECT esperienza.id_esperienza, esperienza.descrizione, esperienza.foto_copertina, esperienza.accessibilita, 
                                        count(esperienza.id_esperienza) as count_esperienza, esperienza.data_creazione
                                FROM esperienza JOIN voto 
                                ON esperienza.id_esperienza = voto.id_esperienza
                                WHERE esperienza.id_luogo = ? AND voto.tipo_voto = 'esperienza'
                                GROUP BY esperienza.id_esperienza 
                                ORDER BY count_esperienza DESC`, //Restituisce le esperienze di un luogo con il count per i voti di tipo "esperienza"
    
    getEsperienzeCountByLuogo : ` SELECT esperienza.id_esperienza, esperienza.descrizione, esperienza.foto_copertina, esperienza.accessibilita, 
                                        count(esperienza.id_esperienza) as count_esperienza, esperienza.data_creazione
                                FROM esperienza JOIN voto 
                                ON esperienza.id_esperienza = voto.id_esperienza
                                WHERE esperienza.id_luogo = ? AND voto.tipo_voto = 'esperienza'
                                GROUP BY esperienza.id_esperienza 
                                ORDER BY count_esperienza DESC`, //Restituisce le esperienze di un luogo con il count per i voti di tipo "esperienza" in ordine di voti


    getEsperienzeDataCreazioneByLuogo : ` SELECT esperienza.id_esperienza, esperienza.descrizione, esperienza.foto_copertina, esperienza.accessibilita, 
                                                count(esperienza.id_esperienza) as count_esperienza, esperienza.data_creazione
                                        FROM esperienza JOIN voto 
                                        ON esperienza.id_esperienza = voto.id_esperienza
                                        WHERE esperienza.id_luogo = ? AND voto.tipo_voto = 'esperienza'
                                        GROUP BY esperienza.id_esperienza 
                                        ORDER BY data_creazione DESC`, //Restituisce le esperienze di un luogo con il count per i voti di tipo "esperienza" in ordine di data creazione                                 


    getGalleryByEsperienza : ` SELECT gallery.id_gallery, gallery.id_esperienza, foto.id_foto, foto.path, gallery.count 
                                FROM gallery JOIN foto ON gallery.id_gallery = foto.id_gallery 
                                WHERE gallery.id_esperienza = ? `, //recupera la gallery di foto di una data esperienza

    getLastUsersPhoto : `SELECT id_utente, img FROM utente ORDER BY id_utente DESC`, //recupera le foto degli utenti 
    getTotVotieSomma: ' SELECT SUM(voto) as sommaVoti, COUNT(*) as countVoti FROM voto WHERE id_esperienza = ? AND tipo_voto = ?',

    insertUser : "INSERT INTO utente (nome, cognome, email, password, data_di_nascita, badge, img) VALUES (?, ?, ?, ?, ?, ?, ?)",
    insertLuogo : "INSERT INTO luogo (titolo, posizione, citta, nazione, id_utente, data_creazione) VALUES (?, ?, ?, ?, ?, ?)",
    insertEsperienza : "INSERT INTO esperienza (descrizione, count_descrizione, foto_copertina, count_foto_copertina, accessibilita, count_accessibilita, id_luogo) VALUES (?, ?, ?, ?, ?, ?, ?)",
    insertOrario : "INSERT INTO orari_di_apertura (id_luogo, orario_apertura, orario_chiusura) VALUES (?, ? , ?)",
    insertCosto : "INSERT INTO costo (id_luogo, costo_minimo, costo_massimo) VALUES (?, ? , ?)",
    insertGallery: "INSERT INTO gallery(count,id_esperienza) VALUES (?,?)",
    insertFoto: "INSERT INTO foto(path,id_gallery) VALUES (?,?)",
    insertVoto: "INSERT INTO voto(id_utente, id_esperienza, voto, tipo_voto) VALUES (?,?,?,?)",
    insertUserCreateExperience : "INSERT INTO creare_esperienza(id_utente, id_esperienza, data_creazione) VALUES (?, ?, ?)",
    createGallery : "INSERT INTO gallery(count, id_esperienza) VALUES (?, ?)",
    insertFoto : "INSERT INTO foto(path, id_gallery) VALUES (?, ?)",

    verifyMail : "SELECT email FROM utente WHERE email = ?",
    verifyLuogo : "SELECT titolo FROM luogo WHERE titolo = ?",
    verifyVoto : "SELECT voto FROM voto WHERE id_utente = ? AND id_esperienza = ?",
    verifyVotoTipo : "SELECT voto FROM voto WHERE id_utente = ? AND id_esperienza = ? AND tipo_voto = ?",

    updateNumVotiFotoCopertina: "UPDATE esperienza SET count_foto_copertina = ? WHERE id_esperienza= ?",
    updateVotoDescrizione: "UPDATE esperienza SET count_descrizione = ? WHERE id_esperienza= ?", //aggiorna il voto della descrizione in esperienza
    updateVotoAccessibilita: "UPDATE esperienza SET count_accessibilita = ? WHERE id_esperienza= ?",
    updateVoto: "UPDATE voto SET voto = ? WHERE id_esperienza = ? AND id_utente = ? AND tipo_voto = ?" //aggiorna il voto della descrizione in voto in caso in cui un utente volesse rivotare
}
