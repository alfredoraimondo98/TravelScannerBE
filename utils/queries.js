module.exports = { 

    getUserByEmail: "SELECT * FROM utente WHERE email = ?",
    getUserById : "SELECT * FROM utente WHERE id_utente = ?",
    getAllUser: " SELECT * FROM utente",
    getUserByNameSurname: "SELECT * FROM utente WHERE nome LIKE ? OR cognome LIKE ?",
    getPlaceByTitle: "SELECT * from luogo WHERE titolo LIKE ? OR citta LIKE ? OR nazione LIKE ?",
    getAllLuoghi : "SELECT * FROM luogo",
    getGallery: "SELECT id_gallery FROM gallery WHERE id_esperienza = ?",
    getCountPostByIdUser : "SELECT COUNT(*) as count FROM creare_esperienza WHERE id_utente = ?", //recupera il numero di esperienze create dall'utente
    
    getEsperienzaByIdUtente : "SELECT * FROM creare_esperienza WHERE id_utente = ?", //esperienze dell'utente
    getCountLikeByIdEsperienza : "SELECT id_esperienza, COUNT(*) count FROM voto WHERE id_esperienza = ? AND tipo_voto = ?",
    getCountLikeByUser: `SELECT COUNT(*) as somma_voti_esperienze FROM esperienza 
                            JOIN creare_esperienza JOIN voto 
                            ON esperienza.id_esperienza = creare_esperienza.id_esperienza AND  esperienza.id_esperienza = voto.id_esperienza 
                            WHERE creare_esperienza.id_utente = ? AND voto.tipo_voto = 'esperienza' `,

    getLuogoById : "SELECT * FROM luogo WHERE id_luogo = ?", 
    

    getTopGalleryByLuogo : `SELECT * FROM foto JOIN gallery
                            ON foto.id_gallery = gallery.id_gallery
                            WHERE foto.id_gallery = ( 
                                        SELECT id_gallery FROM gallery JOIN esperienza
                                        ON gallery.id_esperienza = esperienza.id_esperienza
                                        WHERE esperienza.id_luogo = ?
                                        ORDER BY gallery.count_gallery DESC LIMIT 1 
                            )`,

    getTopDescrizioneByLuogoWithUser : `SELECT esperienza.id_esperienza, descrizione, count_descrizione, creare_esperienza.id_utente, 
                                                        utente.nome, utente.cognome, utente.img, creare_esperienza.data_creazione 
                                                    FROM esperienza JOIN creare_esperienza JOIN utente
                                                    ON esperienza.id_esperienza = creare_esperienza.id_esperienza
                                                        AND creare_esperienza.id_utente = utente.id_utente
                                                        AND esperienza.descrizione <> ''
                                                    WHERE id_luogo = ? 
                                                    ORDER BY count_descrizione DESC, creare_esperienza.data_creazione DESC LIMIT 1
                                                `,

    getTopFotoCopertinaByLuogoWithUser :`SELECT esperienza.id_luogo, esperienza.id_esperienza, foto_copertina, count_foto_copertina, creare_esperienza.id_utente, 
                                            utente.nome, utente.cognome, utente.img, creare_esperienza.data_creazione 
                                        FROM esperienza JOIN creare_esperienza JOIN utente
                                        ON esperienza.id_esperienza = creare_esperienza.id_esperienza
                                            AND creare_esperienza.id_utente = utente.id_utente
                                        WHERE id_luogo = ? 
                                        ORDER BY count_foto_copertina DESC, creare_esperienza.data_creazione DESC LIMIT 1
                                        `, 
                                        
    getTopAccessibilitaByLuogoWithUser : `SELECT esperienza.id_esperienza, accessibilita, count_accessibilita, creare_esperienza.id_utente, 
                                            utente.nome, utente.cognome, utente.img, creare_esperienza.data_creazione 
                                        FROM esperienza JOIN creare_esperienza JOIN utente
                                        ON esperienza.id_esperienza = creare_esperienza.id_esperienza
                                            AND creare_esperienza.id_utente = utente.id_utente
                                            AND esperienza.accessibilita <> ''
                                        WHERE id_luogo = ? 
                                        ORDER BY count_accessibilita DESC, creare_esperienza.data_creazione DESC LIMIT 1
                                        `, 

    getTopGalleryByLuogoWithUser : `SELECT foto.id_foto, foto.path, gallery.id_gallery, gallery.count_gallery, esperienza.id_esperienza,
                                            creare_esperienza.data_creazione, utente.id_utente, utente.nome, utente.cognome, utente.img

                                    FROM foto JOIN gallery JOIN esperienza JOIN creare_esperienza JOIN utente
                                        ON foto.id_gallery = gallery.id_gallery 
                                        AND gallery.id_esperienza = esperienza.id_esperienza
                                        AND esperienza.id_esperienza = creare_esperienza.id_esperienza
                                        AND creare_esperienza.id_utente = utente.id_utente
                                                            WHERE foto.id_gallery = ( 
                                                                        SELECT id_gallery FROM gallery JOIN esperienza
                                                                        ON gallery.id_esperienza = esperienza.id_esperienza
                                                                        WHERE esperienza.id_luogo = ?
                                                                        ORDER BY gallery.count_gallery DESC LIMIT 1 
                                                            )
                                        GROUP BY id_foto`,

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
                    ORDER BY count_foto_copertina DESC, data_creazione_esperienza DESC`, //Restituisce i dati per una card di un luogo con la foto_copertina pi?? votata in prima posizione nel risultato
     */   

 

     getLuogoCard : `SELECT luogo.id_luogo, luogo.titolo, luogo.posizione, luogo.citta, luogo.nazione, 
                        esperienza.foto_copertina, esperienza.count_foto_copertina, 
                    FROM luogo  LEFT JOIN esperienza 
                    ON luogo.id_luogo = esperienza.id_luogo 
                    WHERE luogo.id_luogo = ?
                    ORDER BY esperienza.count_foto_copertina DESC, data_creazione_esperienza DESC`, 

    
            

    getNumVotiFotoCopertina: 'SELECT count_foto_copertina from esperienza WHERE id_esperienza = ?',
    getNumVotiFotoGallery: 'SELECT count_gallery from gallery WHERE id_esperienza = ?',


    getEsperienzeByLuogo : "SELECT * FROM esperienza WHERE id_luogo = ?",

    getEsperienzeCountByLuogo : ` SELECT voto.id_esperienza, tipo_voto, creare_esperienza.data_creazione, COUNT(*) as count_esperienza 
                                    FROM esperienza JOIN voto JOIN creare_esperienza
                                    ON voto.id_esperienza = esperienza.id_esperienza
                                    AND esperienza.id_esperienza = creare_esperienza.id_esperienza
                                    WHERE tipo_voto = 'esperienza' AND id_luogo = ?
                                    GROUP BY voto.id_esperienza
                                    ORDER BY count_esperienza DESC`, //Restituisce le esperienze di un luogo con il count per i voti di tipo "esperienza" in ordine di voti

    getEsperienzeCountByUser : ` SELECT esperienza.id_luogo, voto.id_esperienza, tipo_voto, creare_esperienza.data_creazione, COUNT(*) as count_esperienza 
                                    FROM esperienza JOIN voto JOIN creare_esperienza
                                    ON voto.id_esperienza = esperienza.id_esperienza
                                    AND esperienza.id_esperienza = creare_esperienza.id_esperienza
                                    WHERE tipo_voto = 'esperienza' AND creare_esperienza.id_utente = ?
                                    GROUP BY voto.id_esperienza
                                    ORDER BY count_esperienza DESC`, //recupera i count (voti) delle esperienze dell'utente


    getEsperienzeCountByUserAndPlace : ` SELECT esperienza.id_luogo, voto.id_esperienza, tipo_voto, creare_esperienza.data_creazione, COUNT(*) as count_esperienza 
                                    FROM esperienza JOIN voto JOIN creare_esperienza
                                    ON voto.id_esperienza = esperienza.id_esperienza
                                    AND esperienza.id_esperienza = creare_esperienza.id_esperienza
                                    WHERE tipo_voto = 'esperienza' AND creare_esperienza.id_utente = ? AND esperienza.id_luogo = ?
                                    GROUP BY voto.id_esperienza
                                    ORDER BY count_esperienza DESC`, //recupera i count (voti) delle esperienze dell'utente per uno specifico luogo                                

    getDataCreazioneEsperienzaByLuogo : `SELECT esperienza.id_esperienza, creare_esperienza.data_creazione
                                            FROM esperienza JOIN creare_esperienza
                                            ON esperienza.id_esperienza = creare_esperienza.id_esperienza
                                            WHERE esperienza.id_luogo = ?
                                            ORDER BY creare_esperienza.data_creazione DESC`, //recuperare le date di creazione delle esperienze di un luogo

    getEsperienzeDataCreazioneByLuogo : ` SELECT esperienza.id_esperienza, esperienza.descrizione, esperienza.foto_copertina, esperienza.accessibilita, 
                                                count(esperienza.id_esperienza) as count_esperienza, esperienza.data_creazione
                                        FROM esperienza JOIN voto 
                                        ON esperienza.id_esperienza = voto.id_esperienza
                                        WHERE esperienza.id_luogo = ? AND voto.tipo_voto = 'esperienza'
                                        GROUP BY esperienza.id_esperienza 
                                        ORDER BY data_creazione DESC`, //Restituisce le esperienze di un luogo con il count per i voti di tipo "esperienza" in ordine di data creazione                                 


    getGalleryByEsperienza : ` SELECT gallery.id_gallery, gallery.id_esperienza, foto.id_foto, foto.path, gallery.count_gallery 
                                FROM gallery JOIN foto ON gallery.id_gallery = foto.id_gallery 
                                WHERE gallery.id_esperienza = ? `, //recupera la gallery di foto di una data esperienza

    getLastUsersPhoto : `SELECT id_utente, img FROM utente ORDER BY id_utente DESC`, //recupera le foto degli utenti 
    getTotVotieSomma: ' SELECT SUM(voto) as sommaVoti, COUNT(*) as countVoti FROM voto WHERE id_esperienza = ? AND tipo_voto = ?',



    getExperiencesByUser : `SELECT esperienza.*, creare_esperienza.data_creazione, luogo.titolo
                            FROM esperienza LEFT JOIN creare_esperienza 
                            ON esperienza.id_esperienza = creare_esperienza.id_esperienza
                            JOIN luogo
                            ON esperienza.id_luogo = luogo.id_luogo
                            WHERE creare_esperienza.id_utente = ? `, //recupera le esperienze dell'utente loggato

    
    getExperiencesByUserAndLuogo : `SELECT esperienza.*, creare_esperienza.data_creazione, luogo.titolo
                            FROM esperienza LEFT JOIN creare_esperienza 
                            ON esperienza.id_esperienza = creare_esperienza.id_esperienza
                            JOIN luogo
                            ON esperienza.id_luogo = luogo.id_luogo
                            WHERE esperienza.id_luogo = ? AND creare_esperienza.id_utente = ?  `, //recupera le esperienze dell'utente loggato

    getTotalDescrizione : `SELECT COUNT(*) as count_total FROM voto
                            WHERE tipo_voto='descrizione' AND voto.id_esperienza = ( 
                                                    SELECT esperienza.id_esperienza FROM esperienza JOIN creare_esperienza 
                                                    ON esperienza.id_esperienza = creare_esperienza.id_esperienza
                                                    WHERE id_luogo = ? 
                                                    ORDER BY count_descrizione DESC, creare_esperienza.data_creazione DESC LIMIT 1
                            )` ,    //recupera totale voti descrizione per la miglior desrizione di un luogo
                            
    getTotalAccessibilita : `SELECT COUNT(*) as count_total FROM voto
                             WHERE tipo_voto='accessibilita' AND voto.id_esperienza = ( 
                                                    SELECT esperienza.id_esperienza FROM esperienza JOIN creare_esperienza 
                                                    ON esperienza.id_esperienza = creare_esperienza.id_esperienza
                                                    WHERE id_luogo = ? 
                                                    ORDER BY count_accessibilita DESC, creare_esperienza.data_creazione DESC LIMIT 1
                            )`, //recupera totale voti accessibilit?? per la miglior accessibilit?? di un luogo

    
    getEsperienzeWithUserByLuogo : `SELECT esperienza.*, creare_esperienza.data_creazione, utente.id_utente, utente.nome, utente.cognome, utente.img, utente.badge
                                    FROM esperienza JOIN creare_esperienza JOIN utente  
                                    ON esperienza.id_esperienza = creare_esperienza.id_esperienza
                                    AND creare_esperienza.id_utente = utente.id_utente
                                    WHERE esperienza.id_luogo=?`, //recupera le esperienze e l'utente che ha creato l'esperienza (per tutte le esperienze di un luogo)



    getGalleryByLuogo : `SELECT gallery.*, foto.id_foto, foto.path
                            FROM esperienza JOIN gallery JOIN foto
                            ON esperienza.id_esperienza = gallery.id_esperienza
                            AND gallery.id_gallery = foto.id_gallery
                            WHERE esperienza.id_luogo=?`, //recupera la gallery per ogni esperienza del luogo (per tutte le esperienze di un luogo)

    getGalleryByEsperienzeOfUser : `SELECT esperienza.id_esperienza, gallery.*, foto.id_foto, foto.path 
                                    FROM esperienza JOIN creare_esperienza JOIN gallery JOIN foto
                                    ON esperienza.id_esperienza = gallery.id_esperienza
                                    AND gallery.id_gallery = foto.id_gallery
                                    AND esperienza.id_esperienza = creare_esperienza.id_esperienza
                                    WHERE creare_esperienza.id_utente = ?`, //recupera la gallery per ogni esperienza del luogo (per tutte le esperienze di un luogo)

    getGalleryByEsperienzeOfUserByPlace : `SELECT esperienza.id_esperienza, gallery.*, foto.id_foto, foto.path 
                                    FROM esperienza JOIN creare_esperienza JOIN gallery JOIN foto
                                    ON esperienza.id_esperienza = gallery.id_esperienza
                                    AND gallery.id_gallery = foto.id_gallery
                                    AND esperienza.id_esperienza = creare_esperienza.id_esperienza
                                    WHERE creare_esperienza.id_utente = ? AND esperienza.id_luogo = ?`, //recupera la gallery per ogni esperienza del luogo (per tutte le esperienze di un luogo)
                          


    getUserByIdEsperienza : "SELECT id_utente FROM creare_esperienza WHERE id_esperienza = ?",

    getBadge: "SELECT badge FROM utente WHERE id_utente = ? ",

    getCountAmbassadorById: "SELECT count_ambassador FROM utente WHERE id_utente = ?",

    getAmbassadorByLuogo: "SELECT * FROM ambassador WHERE id_luogo = ? AND tipo_ambassador = ?",


    getLuogoByIdEsperienza : "SELECT id_luogo FROM esperienza WHERE id_esperienza = ?",

    getCountVotoAmbassadorByLuogo : `SELECT tipo_ambassador, count_voto FROM ambassador WHERE id_luogo = ? AND tipo_ambassador = ?`, //recupera ambassador per una data categoria e un dato luogo

    getLikedUsers : `SELECT * FROM heroku_a860383571f3622.voto JOIN utente
                        ON voto.id_utente = utente.id_utente
                        WHERE voto.id_esperienza = ? AND voto.tipo_voto = ?`,

    updateAmbassador : "UPDATE ambassador SET id_utente = ?, count_voto = ? WHERE id_luogo = ? AND tipo_ambassador = ?", //Aggiorna utente ambassador 

    updateCountAmbassadorByUser : "UPDATE utente SET count_ambassador = count_ambassador + ? WHERE id_utente = ?", //aggiorna il count ambassador dell'utente

    insertUser : "INSERT INTO utente (nome, cognome, email, password, data_di_nascita, badge, img) VALUES (?, ?, ?, ?, ?, ?, ?)",
    insertLuogo : "INSERT INTO luogo (titolo, posizione, citta, nazione, id_utente, data_creazione) VALUES (?, ?, ?, ?, ?, ?)",
    insertEsperienza : "INSERT INTO esperienza (descrizione, count_descrizione, foto_copertina, count_foto_copertina, accessibilita, count_accessibilita, id_luogo) VALUES (?, ?, ?, ?, ?, ?, ?)",
    insertOrario : "INSERT INTO orari_di_apertura (id_luogo, orario_apertura, orario_chiusura) VALUES (?, ? , ?)",
    insertCosto : "INSERT INTO costo (id_luogo, costo_minimo, costo_massimo) VALUES (?, ? , ?)",
    insertGallery: "INSERT INTO gallery(count_gallery,id_esperienza) VALUES (?,?)",
    
    insertVoto: "INSERT INTO voto(id_utente, id_esperienza, voto, tipo_voto) VALUES (?,?,?,?)",
    deleteVoto: "DELETE FROM voto WHERE id_utente = ? AND id_esperienza = ? AND tipo_voto = ?",

    insertUserCreateExperience : "INSERT INTO creare_esperienza(id_utente, id_esperienza, data_creazione) VALUES (?, ?, ?)",
    createGallery : "INSERT INTO gallery(count_gallery, id_esperienza) VALUES (?, ?)",
    insertFoto : "INSERT INTO foto(path, id_gallery) VALUES (?, ?)",
    deleteFotoByGallery : "DELETE FROM foto WHERE id_gallery = ?",
    insertAmbassador : "INSERT INTO ambassador(id_utente, id_luogo, tipo_ambassador, count_voto) VALUES (?, ?, ?, ?)",
    deleteAmbassador: "DELETE FROM ambassador WHERE id_utente = ? AND id_luogo = ? AND tipo_ambassador = ?",
    verifyMail : "SELECT email FROM utente WHERE email = ?",
    verifyLuogo : "SELECT titolo FROM luogo WHERE titolo = ?",
    verifyVoto : "SELECT voto FROM voto WHERE id_utente = ? AND id_esperienza = ?",
    verifyVotoTipo : "SELECT voto FROM voto WHERE id_utente = ? AND id_esperienza = ? AND tipo_voto = ?",

    updateNumVotiFotoCopertina: "UPDATE esperienza SET count_foto_copertina = ? WHERE id_esperienza= ?",
    updateNumVotiFotoGallery: "UPDATE gallery SET count_gallery = ? WHERE id_esperienza= ?",
    updateVotoDescrizione: "UPDATE esperienza SET count_descrizione = ?, count_total_descrizione = ? WHERE id_esperienza= ?", //aggiorna il voto della descrizione in esperienza
    updateVotoAccessibilita: "UPDATE esperienza SET count_accessibilita = ?, count_total_accessibilita = ? WHERE id_esperienza= ?",
    updateVoto: "UPDATE voto SET voto = ? WHERE id_esperienza = ? AND id_utente = ? AND tipo_voto = ?",
    updateImgUser : "UPDATE utente SET img = ? WHERE id_utente = ?", //aggiorna l'immagine dell'utente  //aggiorna il voto della descrizione in voto in caso in cui un utente volesse rivotare

    updateDescrizione: "UPDATE esperienza SET descrizione = ? WHERE id_esperienza = ?",
    updateAccessibilita: "UPDATE esperienza SET accessibilita = ? WHERE id_esperienza = ?",
    updateFotoCopertina: "UPDATE esperienza SET foto_copertina = ? WHERE id_esperienza = ?",
    updateBadge: "UPDATE utente SET badge = ? WHERE id_utente = ?",
    updateDataCreazione: "UPDATE creare_esperienza SET data_creazione = ? WHERE id_utente = ? AND id_esperienza = ?",



    updateMyName: "UPDATE utente SET nome = ? WHERE id_utente = ?",
    updateMySurname: "UPDATE utente SET cognome = ? WHERE id_utente = ?",
    updateMyEmail: "UPDATE utente SET email = ? WHERE id_utente = ?",
    updateMyPassword: "UPDATE utente SET password = ? WHERE id_utente = ?",
    updateMyImgProfile: "UPDATE utente SET img = ? WHERE id_utente = ?",


}
