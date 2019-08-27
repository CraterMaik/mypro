const express = require('express');
const router = express.Router();
const auth = require("../auth.js");

router.get('/:id', async(req, res) => {
  
  
  let idusuario = req.params.id;
  if(!idusuario) return res.redirect(`/`);
  let base = req.base;
  let client = req.client;
 
  await base.run("CREATE TABLE IF NOT EXISTS usuarios (id_usuario TEXT, info_usuario TEXT)");
  let createPro = "CREATE TABLE IF NOT EXISTS proyectos (id_pro INTEGER PRIMARY KEY AUTOINCREMENT, id_usuario TEXT, name_pro TEXT, url_pro TEXT, info_pro TEXT)";
  await base.run(createPro); //AUTOINCREMENT
  
  let consula = `SELECT * FROM usuarios WHERE id_usuario = '${idusuario}'`;
  

  const DatoProyectos = 
   new Promise((resolve, reject) => {
     base.all("SELECT * FROM proyectos WHERE id_usuario = ?", idusuario, async (err, filas) => {
       if(err) return reject(err);
       
       resolve(filas);
       
     })
   });
  
  let ProyectosDatos = await DatoProyectos.then(data => {
    if(data){
      return data;
    } else {
      return false;
    }
  })
  
  const DatoUsers =
  new Promise((resolve, reject) => {
    base.get("SELECT * FROM usuarios WHERE id_usuario = ?", idusuario, async (err, filas) => {
      if (err) {
        return reject(err);
      }
      if(filas) {
        resolve(filas)
      } else {
        return res.redirect('/');
      }
      

    });
  });
  
  let UserData = await DatoUsers.then(data => {
    return data;
  })
  
  let datosApi = await client.fetchUser(UserData.id_usuario)
  
  const LikesUsers =
  new Promise((resolve, reject) => {
    base.get("SELECT COUNT(*) as count FROM likes WHERE idusuario = ?", idusuario, async (err, filas) => {
      if (err) {
        return reject(err);
      }
      resolve(filas)
      
      console.log(filas)

    });
  });
  
  let countLikes = await LikesUsers.then(dato => {
    return dato;
  })
  
  const ProUsers =
  new Promise((resolve, reject) => {
    base.get("SELECT COUNT(*) as count FROM proyectos WHERE id_usuario = ?", idusuario, async (err, filas) => {
      if (err) {
        return reject(err);
      }
      resolve(filas)
      
      console.log(filas)

    });
  });
  
  let countPro = await ProUsers.then(dato => {
    return dato;
  })
  
  res.render('users.ejs', {
    userBD: UserData,
    proyecto: ProyectosDatos,
    apiDatos: datosApi,
    login : (req.isAuthenticated() ? 'si' : 'no'),
    textLogin: (req.isAuthenticated() ? 'PERFIL' : 'LOGIN'),
    countPro: countPro,
    countLikes: countLikes
    
  });
  
})

module.exports = router;