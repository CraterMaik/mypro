
const express = require('express');
const app = express();

const Discord = require("discord.js");
const client = new Discord.Client();

const session = require("express-session");
const passport = require("passport");
const { Strategy } = require("passport-discord");
const bodyparser = require("body-parser");
const path = require("path");
const fs = require("fs");

const sqlite3 = require('sqlite3').verbose();
const base = new sqlite3.Database('./mypro.sqlite3');

app.use(express.static('public'));

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

let scope = ['identify'];

passport.use(new Strategy({
  clientID: process.env.CLI_ID,
  clientSecret: process.env.CLI_SECRET,
  callbackURL: `${process.env.URL}/login`,
  scope: scope
}, function(accessToken, refreshToken, profile, done){
  process.nextTick(function() {
    return done(null, profile);
  });
}));


app
.use(bodyparser.json())
.use(bodyparser.urlencoded({ extended: true }))
.engine("html", require("ejs").renderFile)
.use(express.static(path.join(__dirname, "/public")))
.set("view engine", "ejs")
.set("views", path.join(__dirname, "views"))
.set('port', process.env.PORT || 3000)
.use(session({
  secret: "mypro",
  resave: false,
  saveUninitialized: false
}))
.use(passport.initialize())
.use(passport.session())
.use(function(req,res,next){
  req.base = base;
  req.client = client;
  next();
})

app
.use("/" , require("./rutas/index"))
.use("/perfil", require("./rutas/perfil"))
.use("/proyectos", require("./rutas/proyectos"))
.use("/u", require("./rutas/users"))

// CONSULTAS
const DatoUsers = (idusuario) =>
      new Promise((resolve, reject) => {
        base.get("SELECT * FROM usuarios WHERE id_usuario = ?", idusuario, async (err, filas) => {
          if (err) {
            return reject(err);
          }
          resolve(filas)

        });
      });
const DatoProDelete = (idpro) =>
      new Promise((resolve, reject) => {
        base.get("SELECT * FROM proyectos WHERE id_pro = ?", idpro, async (err, filas) => {
          if (err) {
            return reject(err);
          }
          resolve(filas)

        });
      });

const DatoPro = (idusuario) =>
      new Promise((resolve, reject) => {
        base.all("SELECT * FROM proyectos WHERE id_usuario = ?", idusuario, async (err, filas) => {
          if (err) {
            return reject(err);
          }
          resolve(filas)

        });
      });


const LikesUsers = (idusuario) =>
  new Promise((resolve, reject) => {
    base.get("SELECT COUNT(*) as count FROM likes WHERE idusuario = ?", idusuario, async (err, filas) => {
      if (err) {
        return reject(err);
      }
      resolve(filas)
      
     
    });
  });
  
 
  const ProUsers = (idusuario) =>
  new  Promise((resolve, reject) => {
    base.get("SELECT COUNT(*) as count FROM proyectos WHERE id_usuario = ?", idusuario, async (err, filas) => {
      if (err) {
        return reject(err);
      }
      resolve(filas)
      
    

    });
  });

  

client.on("ready", () => {
  
  const listener = app.listen(app.get('port'), function() {
    console.log('Estoy listo y el puerto: ' + listener.address().port);
  }); 
  
});

let prefix = "my!"

client.on("message", async (message) => {
  
  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  
  //comandos
  if(command === "test"){ 
    
    let valor = await DatoUsers(message.author.id);
    
   console.log(valor);
    
  }
  if(command === "proyectos"){
    let text = args.join(' ');
    
    if(!text){
      
      let datosProyectos = await DatoPro(message.author.id)
      if(datosProyectos.length < 1) return message.channel.send('Usuario no encontrado.')
      const embedList = new Discord.RichEmbed()
        .setTitle('Listado de proyectos de '+ message.author.username)
        .setColor('RANDOM')
        .setThumbnail('https://i.imgur.com/vU6tN9W.png')
        .setFooter('Datos del la aplicación MyPro')
        
        datosProyectos.map(dato => {
          embedList.addField('Nombre:', dato.name_pro+ ` [Enlace proyecto](https://mypro-discord.glitch.me/proyectos/v/${dato.id_pro})`)
        });
      
      message.channel.send(embedList);
      
     // console.log(datosProyectos)
     
    } else {
      let mencionado = message.mentions.members.first() ? message.mentions.members.first().id : text;
     
      let datosProyectos = await DatoPro(mencionado)
      
      if(datosProyectos.length < 1) return message.channel.send('Usuario no encontrado.')
      
      const embedList = new Discord.RichEmbed()
        .setTitle('Listado de proyectos de '+ client.users.get(mencionado).username )
        .setColor('RANDOM')
        .setThumbnail('https://i.imgur.com/vU6tN9W.png')
        .setFooter('Datos del la aplicación MyPro')
        
        datosProyectos.map(dato => {
          embedList.addField('Nombre:', dato.name_pro+ ` [Enlace proyecto](https://mypro-discord.glitch.me/proyectos/v/${dato.id_pro})`)
        });
      
      message.channel.send(embedList);
      
    }
  }
  if(command === "perfil") {
    
    let text = args.join(' ');
    
    if(!text) {
         
      let datosPerfil = await DatoUsers(message.author.id);
      
        if(!datosPerfil) return message.channel.send('Perfil no encontrado.')
        
        let countLikes = await LikesUsers(message.author.id)

        let countPro = await ProUsers(message.author.id)
        
        const embedPerfil = new Discord.RichEmbed()
          .setTitle('Perfil de '+ message.author.username)
          .addField('Información', datosPerfil.info_usuario)
          .addField('Proyectos', countPro.count, true)
          .addField('Likes', countLikes.count, true)
          .setColor('GREEN')
          .setThumbnail('https://i.imgur.com/vU6tN9W.png')
          .setFooter('Datos del la aplicación MyPro')
        
        message.channel.send(embedPerfil)
        
    
    } else {
      let mencionado = message.mentions.members.first() ? message.mentions.members.first().id : text;
      
      let datosPerfil =  await DatoUsers(mencionado);
      
        if(!datosPerfil) return message.channel.send('Perfil no encontrado.')
        
       
        let countLikes = await LikesUsers(mencionado)

        let countPro = await ProUsers(mencionado)
        
        const embedPerfil = new Discord.RichEmbed()
          .setTitle('Perfil de '+ message.author.username)
          .addField('Información', datosPerfil.info_usuario)
          .addField('Proyectos', countPro.count, true)
          .addField('Likes', countLikes.count, true)
          .setColor('GREEN')
          .setThumbnail('https://i.imgur.com/vU6tN9W.png')
          .setFooter('Datos del la aplicación MyPro')
        
        message.channel.send(embedPerfil)
      
      
  }
}

  if(command === "agregar"){
    
    let datosPerfil = await DatoUsers(message.author.id);
    if(!datosPerfil) return message.channel.send('Debe crear un perfil en MyPRO\n'+ 'https://mypro-discord.glitch.me/')
    
    let text = args.join(" ");
    let op = text.split(" | ");
    
    let namepro = op[0];
    let urlpro = op[1];
    let infopro = op[2];
    
    let idusuario = message.author.id;
    
    if(!namepro) return message.channel.send('Debe enviar el nombre del proyecto a registrar.');
    if(!urlpro) return message.channel.send('Debe enviar el url del proyecto a registrar.');
    if(!infopro) return message.channel.send('Debe enviar el descripción del proyecto a registrar.');
    //await base.run(`INSERT INTO proyectos(id_usuario, name_pro, url_pro, info_pro) VALUES('${idusu}', '${proName}', '${proURL}', '${proDesc}');`)
   
    await base.run(`INSERT INTO proyectos(id_usuario, name_pro, url_pro, info_pro) VALUES('${idusuario}', '${namepro}', '${urlpro}', '${infopro}')`)
    
    message.channel.send('Proyecto creado correctamente');
    
 
    
  }
  if(command === "eliminar"){
    let text = args.join(' ');
    if(!text) return message.channel.send('Debe enviar el ID del proyecto a eliminar.') 
    let datosProyectos = await DatoProDelete(text);
    if(datosProyectos.length < 1) return message.channel.send('Proyecto no encontrado.');
    
    
    if(datosProyectos.id_usuario !== message.author.id) return message.channel.send('No puedes eliminar proyectos de otros');
    
    await base.run(`DELETE FROM proyectos WHERE id_pro = ${text}`);
    
    message.channel.send('Proyecto eliminado correctamente.');
    
  }
  
    
    
    
    
  
  
});

client.login(process.env.TO);