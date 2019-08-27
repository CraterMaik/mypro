const express = require('express');
const router = express.Router();
const auth = require("../auth.js");
const is = require('is-url');


router.get('/', auth, async(req, res) => {
  
  res.render('proyectos.ejs', {
    user: req.user,
    login : (req.isAuthenticated() ? 'si' : 'no'),
    textLogin: (req.isAuthenticated() ? 'PERFIL' : 'LOGIN'),
    
  });
  
})
.get("/v/:id", async(req, res) => {
  

  let base = req.base;
  let idproyecto = req.params.id;
  let client = req.client;
  // await db.run("CREATE TABLE IF NOT EXISTS statsProyectos (idproyecto INTEGER, countLikes INTEGER, countViews INTEGER)");
  
  
  base.get("SELECT * FROM statsProyectos WHERE idproyecto = ?", idproyecto, async (err, filas) => {
    if(err) return console.log(err);
    
    if(filas) {
       base.run(`UPDATE statsProyectos SET countViews = ${filas.countViews + 1} WHERE idproyecto = ${idproyecto}`);
    } else {
       base.run(`INSERT INTO statsProyectos(idproyecto, countLikes, countViews) VALUES(${idproyecto}, 0, 1)`);
      
    }
 
       
  })
  
  
  
  const DatoProyectos = 
   new Promise((resolve, reject) => {
     base.get("SELECT * FROM proyectos WHERE id_pro = ?", idproyecto, async (err, filas) => {
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
  
  
  const statsProyecto = 
   new Promise((resolve, reject) => {
     base.get("SELECT * FROM statsProyectos WHERE idproyecto = ?", idproyecto, async (err, filas) => {
       if(err) return reject(err);
       
       resolve(filas);
       
     })
   });
  
  let statsPro = await statsProyecto.then(data => {
    if(data){
      return data;
    } else {
      return false;
    }
  })
  
  
    
    const LikesProyecto = 
     new Promise((resolve, reject) => {
       
        if(req.isAuthenticated()) {
          let userid = req.user.id;
          base.get("SELECT * FROM likes WHERE idproyecto = ? AND idusuario = ?", [idproyecto, userid], async (err, filas) => {
             if(err) return reject(err);
             if(filas) {
               
               resolve(true);
               
             } else {
               resolve(false);
               
             }
             

           })
        
        } else {
          resolve(false)
        }
       
     });
     
     
  
  let veriLikes = await LikesProyecto.then(data => {
    return data;
  })
   
 
  
  let datosApi = await client.fetchUser(ProyectosDatos.id_usuario)
  
  res.render('view.ejs', {
    login : (req.isAuthenticated() ? 'si' : 'no'),
    textLogin: (req.isAuthenticated() ? 'PERFIL' : 'LOGIN'),
    datoProyecto: ProyectosDatos,
    statsProyecto: statsPro,
    verficadorLikes: (veriLikes ? 'si' : 'no'),
    textLikes: (veriLikes ? 'Ya no me gusta' : 'Me gusta'),
    apiDiscord: datosApi
    
  })
  
  
})
.get("/like/:id", auth, async (req, res) => {
  let db = req.base;
  let userid = req.user.id;
  let proid = req.params.id;
  let client = req.client;
  
  let datoUsuario = await client.fetchUser(userid)
  
   const DatoLikes = 
   new Promise((resolve, reject) => {
     db.get("SELECT * FROM likes WHERE idproyecto = ? AND idusuario = ?", [proid, userid], async (err, filas) => {
       if(err) return reject(err);
       
       resolve(filas);
       
     })
   });
  
  let verific = await DatoLikes;
  console.log(verific)
  if(verific) return res.redirect('/proyectos/v/'+proid);
  
  db.run(`INSERT INTO likes(idproyecto, idusuario, date) VALUES(${proid}, ${userid}, ${Date.now()})`);
  
  db.get("SELECT * FROM statsProyectos WHERE idproyecto = ?", proid, async (err, filas) => {
      if(err) return console.log(err);
      if(filas) {
        db.run(`UPDATE statsProyectos SET countLikes = ${filas.countLikes + 1} WHERE idproyecto = ${proid}`);
      } 
    
     
  })
  
  const DatoProyectos = 
   new Promise((resolve, reject) => {
     db.get("SELECT * FROM proyectos WHERE id_pro = ?", proid, async (err, filas) => {
       if(err) return reject(err);
       
       resolve(filas);
       
     })
   });
  
  let DatoPro = await DatoProyectos;
  
  client.channels.get('613831466018799625').send('**👍 Nuevo like!**\n`Usuario:` '+ datoUsuario.username +'\n`Proyecto: `'+ DatoPro.name_pro)
  
  await res.redirect('/proyectos/v/'+proid);
 

})
.get("/unlike/:id", auth, async (req, res) => {
  let db = req.base;
  let userid = req.user.id;
  let proid = req.params.id;
  let client = req.client;
  
   const DatoLikes = 
   new Promise((resolve, reject) => {
     db.get("SELECT * FROM likes WHERE idproyecto = ? AND idusuario = ?", [proid, userid], async (err, filas) => {
       if(err) return reject(err);
       
       resolve(filas);
       
     })
   });
  
  let verific = await DatoLikes;
  
  if(!verific) return res.redirect('/proyectos/v/'+proid);
  
  
  let datoUsuario = await client.fetchUser(userid)
  
  await db.get(`DELETE FROM likes WHERE idproyecto = ${proid} AND idusuario = ${userid}`);
  
  db.get("SELECT * FROM statsProyectos WHERE idproyecto = ?", proid, async (err, filas) => {
      if(err) return console.log(err);
      if(filas) {
        db.run(`UPDATE statsProyectos SET countLikes = ${filas.countLikes - 1} WHERE idproyecto = ${proid}`);
      } 
    
     
  })
  
  const DatoProyectos = 
   new Promise((resolve, reject) => {
     db.get("SELECT * FROM proyectos WHERE id_pro = ?", proid, async (err, filas) => {
       if(err) return reject(err);
       
       resolve(filas);
       
     })
   });
  
  let DatoPro = await DatoProyectos;
  
  client.channels.get('613831466018799625').send('**👎 Ya no le gusta el proyecto!**\n`Usuario:` '+ datoUsuario.username +'\n`Proyecto: `'+ DatoPro.name_pro)
  
  await res.redirect('/proyectos/v/'+proid);
 

  
})
.get("/list/", async(req, res) => {
  
  
  let db = req.base;
  
  
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
  
  const ListRandom = 
    new Promise((resolve, reject) => {
      //SELECT TOP 1 * FROM participantes ORDER BY rand()
      db.all(`SELECT * FROM proyectos ORDER BY RANDOM() LIMIT 4`,  async (err, filas) => {
       if(err) return reject(err);

       resolve(filas);
     })
    })
  const DatoProyectos = 
   new Promise((resolve, reject) => {
     db.all(`SELECT * FROM proyectos ORDER BY id_pro DESC`,  async (err, filas) => {
       if(err) return reject(err);

       resolve(filas);
     })
   });
  
   const UserList = 
   new Promise((resolve, reject) => {
    db.all(`SELECT * FROM usuarios ORDER BY RANDOM() LIMIT 3`,  async (err, filas) => {
       if(err) return reject(err);

       resolve(filas);
     })
   });
    
  
  
  let ProyectosDatos = await DatoProyectos;
  let UsuariosDatos = await UserList;
  let ListRandomPro = await ListRandom;

   let client = req.client;
  // let Users = async (id) => await client.fetchUser(id);
    
  // let RUsers = await Users('289553210459553792')
   //console.log(RUsers)
/*   
function getImageMeta (src) {
     const img = new Image();
     img.src = src;

     return new Promise((resolve, reject) => {
       return img.addEventListener("load", function () {
         return resolve(isPortrait(this));
       }, false);
     });
   }
  */
    
    async function getUsername(id){
      var result = await client.fetchUser(id)
     // console.log(result.username)
      return result.username;
      // But the best part is, we can just keep awaiting different stuff, without ugly .then()s
     
    }
   
  
  res.render('list.ejs', {
    login : (req.isAuthenticated() ? 'si' : 'no'),
    textLogin: (req.isAuthenticated() ? 'PERFIL' : 'LOGIN'),
    list: ProyectosDatos,
    randomPro: ListRandomPro,
    numRandom: getRandomInt,
    ApiDiscord: client
    
  });

  
})
.get("/:id/edit", auth, async(req, res) => {
  let base = req.base;
  let idpro = req.params.id;
  let logid = req.user.id;
  
  
  const DatoProyectos = 
   new Promise((resolve, reject) => {
     base.get("SELECT * FROM proyectos WHERE id_pro = ?", idpro, async (err, filas) => {
       if(err) return reject(err);
       if(filas.id_usuario !== logid) return res.redirect('/perfil')
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
  
  res.render('edit-pro.ejs', {
    user: req.user,
    proyecto: ProyectosDatos,
    login : (req.isAuthenticated() ? 'si' : 'no'),
    textLogin: (req.isAuthenticated() ? 'PERFIL' : 'LOGIN'),
  })
})
.post("/:id/add", auth, async(req, res) => {
  let idusu = req.params.id;  
  let base = req.base;
  let client = req.client;
  
  let proName = req.body.proName;
  let proURL = req.body.proURL;
  let proDesc = req.body.proDesc;
  
  if(!proName && !proURL && !proDesc) return res.redirect('/proyectos');
  if(!is(proURL)) return res.redirect('/proyectos');
  
   await base.run(`INSERT INTO proyectos(id_usuario, name_pro, url_pro, info_pro) VALUES('${idusu}', '${proName}', '${proURL}', '${proDesc}');`)
   
  const UltimoProyecto = 
   new Promise((resolve, reject) => {
     base.get("SELECT MAX(id_pro) as ultimo FROM proyectos", async (err, filas) => {
       if(err) return reject(err);
       
       resolve(filas);
       
     })
   });
  
  let Dato = await UltimoProyecto;
  
   client.channels.get('613831466018799625').send('**Nuevo proyecto registrado: **\n`Nombre:` '+proName+'\n`Descripción:` '+proDesc+'\n`Link:` https://mypro-discord.glitch.me/proyectos/v/'+Dato.ultimo)
   console.log('PROYECTO REGISTADO. '+ proName)
   await res.redirect('/perfil');
   
  //id_usuario TEXT, name_pro TEXT, url_pro TEXT, info_pro TEXT
  
})
.post("/:id/update", auth, async(req, res) => {
  let idpro = req.params.id;  
  let base = req.base;
  let logid = req.user.id;
  
  let proName= req.body.proName;
  let proURL = req.body.proURL;
  let proDesc = req.body.proDesc;
  let client = req.client;
  
  const DatoProyectos = 
   new Promise((resolve, reject) => {
     base.get("SELECT * FROM proyectos WHERE id_pro = ?", idpro, async (err, filas) => {
       if(err) return reject(err);
       if(filas.id_usuario !== logid) return res.redirect('/perfil')
       resolve(filas);
       
     })
   });
  
 
  if(!proName && !proURL && !proDesc) return res.redirect('/perfil');
  if(!is(proURL)) return res.redirect('/perfil');
  
  await base.run(`UPDATE proyectos SET name_pro = '${proName}', url_pro = '${proURL}', info_pro='${proDesc}' WHERE id_pro = ${idpro}`);
  
  client.channels.get('613831466018799625').send('**🔄 Proyecto actualizado : **\n`Nombre:` '+proName+'\n`Descripción:` '+proDesc+'\n`Link:` https://mypro-discord.glitch.me/proyectos/v/'+idpro)
   
   
  
  await res.redirect('/perfil');
  
  //DELETE
})

.get("/:id/delete", auth, async(req, res) => {
   console.log('SI ENTRO!!')
  let idpro = req.params.id;  
  let base = req.base;
  let client = req.client;
  let logid = req.user.id;
  
  const DatoProyectos = 
   new Promise((resolve, reject) => {
     base.get("SELECT * FROM proyectos WHERE id_pro = ?", idpro, async (err, filas) => {
       if(err) return reject(err);
       if(filas.id_usuario !== logid) return res.redirect('/perfil')
       resolve(filas);
       
     })
   });
  
  let DatoPro = await DatoProyectos;
  
  client.channels.get('613831466018799625').send('**🚫 Proyecto eliminado : **\n`Nombre: ` '+DatoPro.name_pro)
   
  await base.run(`DELETE FROM proyectos WHERE id_pro = ${idpro}`);
 
  setTimeout(() => {
     res.redirect('/perfil');
  }, 3000)
  
  
  
})

module.exports = router;