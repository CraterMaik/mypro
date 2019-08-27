const express = require('express');
const router = express.Router();
const passport = require("passport");

let suma = 2;
let resultado = suma + 2 + 1;

router
.get('/', async function(req, res) {
  
  let db = req.base;
  let client = req.client;
  await db.run("CREATE TABLE IF NOT EXISTS likes (idproyecto INTEGER, idusuario TEXT , date TEXT)");
  await db.run("CREATE TABLE IF NOT EXISTS statsProyectos (idproyecto INTEGER, countLikes INTEGER, countViews INTEGER)");
  
  const DatoProyectos = 
   new Promise((resolve, reject) => {
     db.all(`SELECT * FROM proyectos ORDER BY id_pro DESC LIMIT 4`,  async (err, filas) => {
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
  
  res.render('index.ejs', {
    login : (req.isAuthenticated() ? 'si' : 'no'),
    textLogin: (req.isAuthenticated() ? 'PERFIL' : 'LOGIN'),
    result: resultado,
    list: ProyectosDatos,
    ApiDiscord: client
  })
  
  
})
.get('/login', passport.authenticate("discord", { failureRedirect: "/" }),  function(req, res) {
  res.redirect('/perfil');
  
})
.get("/salir", async function(req, res) {
  await req.logout();
  await res.redirect("/");
});

module.exports = router;
