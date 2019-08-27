const express = require('express');
const router = express.Router();
const auth = require("../auth.js");

router.get('/', auth, async(req, res) => {
  
  let base = req.base;
  
  await base.run("CREATE TABLE IF NOT EXISTS usuarios (id_usuario TEXT, info_usuario TEXT)");
  
  let createPro = "CREATE TABLE IF NOT EXISTS proyectos (id_pro INTEGER PRIMARY KEY AUTOINCREMENT, id_usuario TEXT, name_pro TEXT, url_pro TEXT, info_pro TEXT)";
  await base.run(createPro); //AUTOINCREMENT
  
  let consula = `SELECT * FROM usuarios WHERE id_usuario = '${req.user.id}'`;
  
  //ATL + 96
    base.get(consula, (err, filas) => {
        if (err) return console.error(err.message)
        if (!filas) {
          base.run(`INSERT INTO usuarios(id_usuario, info_usuario) VALUES(${req.user.id}, 'Sin info.')`);
          console.log('USUARIO NUEVO: '+ req.user.username);
          
        } else {
          console.log('YA ESTA REGISTRADO: '+ req.user.username);
        }

    })
   
  const DatoProyectos = 
   new Promise((resolve, reject) => {
     base.all("SELECT * FROM proyectos WHERE id_usuario = ?", req.user.id, async (err, filas) => {
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
    base.get("SELECT * FROM usuarios WHERE id_usuario = ?", req.user.id, async (err, filas) => {
      if (err) {
        return reject(err);
      }
      resolve(filas)

    });
  });
  
  let UserData = await DatoUsers.then(data => {
    return data;
  })
  
  //likes (idproyecto INTEGER, idusuario TEXT , date TEXT)");
  const LikesUsers =
  new Promise((resolve, reject) => {
    base.get("SELECT COUNT(*) as count FROM likes WHERE idusuario = ?", req.user.id, async (err, filas) => {
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
    base.get("SELECT COUNT(*) as count FROM proyectos WHERE id_usuario = ?", req.user.id, async (err, filas) => {
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
  
//  console.log(UserData)
 // console.log(ProyectosDatos);
  res.render('perfil.ejs', {
    user: req.user,
    userBD: UserData,
    proyecto: ProyectosDatos,
    login : (req.isAuthenticated() ? 'si' : 'no'),
    textLogin: (req.isAuthenticated() ? 'PERFIL' : 'LOGIN'),
    countLike: countLikes,
    countPro: countPro
  });
  
})
.get("/:id/edit", auth, async(req, res) => {
  let base = req.base;
  let iduser = req.params.id;
  const DatoUsers =
  new Promise((resolve, reject) => {
    base.get("SELECT * FROM usuarios WHERE id_usuario = ?", iduser, async (err, filas) => {
      if (err) {
        return reject(err);
      }
      resolve(filas)

    });
  });
  
  let UserData = await DatoUsers.then(data => {
    return data;
  })
  
  
  
   res.render('edit.ejs', {
    user: req.user,
    userBD: UserData,
    login : (req.isAuthenticated() ? 'si' : 'no'),
    textLogin: (req.isAuthenticated() ? 'PERFIL' : 'LOGIN'),
    
    
  });
})
.post("/:id/update", auth, async(req, res) => {
  let base = req.base;
  let iduser = req.params.id;
  let infoform = req.body.infoForm;
  const DatoUsers =
  new Promise((resolve, reject) => {
    base.get("SELECT * FROM usuarios WHERE id_usuario = ?", iduser, async (err, filas) => {
      if (err) {
        return reject(err);
      }
      resolve(filas)

    });
  });
  
  let UserData = await DatoUsers;
  
  if(!infoform) infoform = UserData.info_usuario;
  let SQL = `UPDATE usuarios SET info_usuario = '${infoform}' WHERE id_usuario = ${iduser}`;

  base.run(SQL, function(err) {
    if (err) return console.error(err.message)
    res.redirect(`/perfil`)
  })
  
})

module.exports = router;