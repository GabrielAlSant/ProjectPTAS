// JWT
require("dotenv-safe").config();
const jwt = require('jsonwebtoken');
var { expressjwt: expressJWT } = require("express-jwt");
const cors = require('cors');



const crypto = require('crypto');
const CHAVE = 'bf3c199c2470cb477d907b1e0917c17e'; // 32
const IV = "5183666c72eec9e4"; // 16
const ALGORITMO = "aes-256-cbc";
const METODO_CRIPTOGRAFIA = 'hex';
const METODO_DESCRIPTOGRAFIA = 'hex';

const encrypt = ((text) =>  {
   let cipher = crypto.createCipheriv(ALGORITMO, CHAVE, IV);
   let encrypted = cipher.update(text, 'utf8', METODO_CRIPTOGRAFIA);
   encrypted += cipher.final(METODO_CRIPTOGRAFIA);
   return encrypted;
});

const decrypt = ((text) => {
   let decipher = crypto.createDecipheriv(ALGORITMO, CHAVE, IV);
   let decrypted = decipher.update(text, METODO_DESCRIPTOGRAFIA, 'utf8');
   return (decrypted + decipher.final('utf8'));
});

const encrypted_key = encrypt("HelloWorld");
console.log(encrypted_key);
const decrypted_key = decrypt(encrypted_key);
console.log(decrypted_key);





var cookieParser = require('cookie-parser')

const express = require('express');
const { usuario } = require('./models');

const app = express();

app.set('view engine', 'ejs');

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(express.static('public'));

app.use(cookieParser());
app.use(
  expressJWT({
    secret: process.env.SECRET,
    algorithms: ["HS256"],
    getToken: req => req.cookies.token
  }).unless({ path: ["/autenticar", "/logar", "/cadastrar"] })
);

app.get('/autenticar', async function(req, res){
  res.render('autenticar');
})

app.get('/', async function(req, res){
  res.render("home")
})

app.get('/sobre', async function(req, res){
  res.render("sobre")
})

app.get('/cadastrar', async function(req, res){
  res.render("cadastrar")
})

app.post('/cadastrar', async function(req, res){
  const user = {user : req.body.user,
               nome:req.body.nome,
              senha: encrypt(req.body.senha)}
  const usuarios = await usuario.create(user);
  res.render('cadastrar')
})

app.get('/usuarios', async function(req, res){
  const usuarios = await usuario.findAll()
  res.render('usuarios',{usuarios})
})

app.post('/logar', async (req, res) => {
  
  const usuarios = await usuario.findOne({where:{user: req.body.user}})

  if(req.body.user === usuarios.user && req.body.password === decrypt(usuarios.senha)){
    const id = 1;
    const token = jwt.sign({ id }, process.env.SECRET, {
      expiresIn: 3600 // expires in 1 hr
    });

    res.cookie('token', token, { httpOnly: true });
    return res.render("sobre")
    //res.json({ auth: true, token: token });
  }

  res.status(500).json({message: 'Login inválido!'});
})

app.post('/deslogar', function(req, res) {
  res.cookie('token', null, { httpOnly: true });
  res.json({deslogado: true})
})

app.listen(3000, function() {
  console.log('App de Exemplo escutando na porta 3000!')
});