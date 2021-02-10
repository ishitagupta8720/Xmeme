const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const urlValidation = require('valid-url');


if (process.env.NODE_ENV !=="production"){
  require('dotenv').config();
}

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/Collection';

const swaggerJSDoc = require('swagger-jsdoc')
const swaggerUI = require('swagger-ui-express')
const cors = require('cors')
//const swaggerApp = express()
app.use(cors())
//swaggerApp.use(cors())


//const swaggerPORT = process.env.PORT || 8080


const swaggerOptions = {
  definition: {
      openapi: '3.0.3',
      info: {
          title: 'XMeme',
          version: '1.0.0',
          description: 'Simple CRUD meme application',
          'contact': {
              'name': 'Ishita Gupta',
              'email': 'ishitagupta8720@gmail.com'
          },
      },
      servers: [{
          url: "http://localhost:8081"
      },
    {
      url: "https://mysterious-hamlet-73374.herokuapp.com/memes/all"
    }]
  },
  apis: ['app.js']
}

const specs = swaggerJSDoc(swaggerOptions)

//swaggerApp.use('/swagger-ui', swaggerUI.serve, swaggerUI.setup(specs));



/**
 * @swagger
 * definitions:
 *  Meme:
 *   type: object
 *   properties:
 *     name:
 *      type: string
 *      description: Name of the author of the meme
 *      example: 'Manthan Gupta'
 *     url:
 *      type: string
 *      description: URL of meme image
 *      example: 'https://static.mommypoppins.com/styles/image620x420/s3/school_meme_3_0.jpg'
 *     caption:
 *      type: string
 *      description: Caption for the meme
 *      example: 'This is a meme'
 *     upload_time:
 *      type: Date
 *      description: Time at which the meme was uploaded by the user
 *      example: ''
 */

const Meme = require('./models/memes');

mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("MONGO CONNECTION OPEN!!!")
    })
    .catch(err => {
        console.log("OH NO MONGO CONNECTION ERROR!!!!")
        console.log(err)
    })

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

/**
 * @swagger
 * /:
 *  get:
 *   summary: get all memes displayed on the homepage
 *   description: get all memes displayed on the homepage
 *   responses:
 *    200:
 *     description: success
 *    500:
 *     description: error
 */

app.get('/memes/all', async(req,res) => {
    try{
    const memes = await Meme.find().sort({ "time": -1 }).limit(100);
    res.render('all/app', { memes })
    }
    catch(err){
        res.status(404).send('404 Not Found');
    }
})

//GET request /memes to display all the memes
/**
 * @swagger
 * /memes:
 *  get:
 *   summary: get all memes
 *   description: get all memes
 *   responses:
 *    200:
 *     description: success
 *    404:
 *     description: error
 */

app.get('/memes', async(req,res) => {
    try{
      const memes = await Meme.find().sort({ "time": 1 }).limit(100);
      let arr=[]
      for(let i=0; i<memes.length; ++i){

        arr[i]={
          "id": memes[i].id,
          "name": memes[i].name,
          "url": memes[i].url,
          "caption": memes[i].caption
        }

      }

      res.send(arr)
     
    }
    catch(err){
        res.status(404).send('404 Not Found');
    }
})

/**
 * @swagger
 * /add-meme:
 *  get:
 *   summary: render form to post memes
 *   description: render form to post memes
 *   responses:
 *    200:
 *     description: success
 *    500:
 *     description: error
 */

app.get('/memes/new', (req, res) => {
    res.render('all/new')
})

/**
  * @swagger
  * /memes:
  *  post:
  *   summary: create meme
  *   description: create meme 
  *   requestBody:
  *    content:
  *     application/json:
  *      schema:
  *       $ref: '#/definitions/Meme'
  *   responses:
  *    200:
  *     description: meme created succesfully
  *    404:
  *     description: URL entered in not valid
  *    409:
  *     description: Duplicate POST request
  */


app.post('/memes', async (req, res) => {
    const newMeme = new Meme(req.body);
    let check = await Meme.exists({ 'name': req.body.name, 'caption': req.body.caption, 'url': req.body.url})
  try{
    if(urlValidation.isUri(newMeme.url)){
       if(!check){
        await newMeme.save();
        res.send({"id": newMeme.id});
       }
       else
       {
        res.status(409).send('409 Conflict');
       }
    }
    else
    {
      res.status(404).send('Url Not found');
    }
  }
  catch(err)
  {
    res.status(404).send('404 Not found');
  }
    
    
})

/**
  * @swagger
  * /memes/redirect:
  *  post:
  *   summary: create meme and redirect to homepage
  *   description: create meme and redirect to homepage
  *   requestBody:
  *    content:
  *     application/json:
  *      schema:
  *       $ref: '#/definitions/Meme'
  *   responses:
  *    200:
  *     description: meme created succesfully
  *    409:
  *     description: Duplicate POST request
  *    500:
  *     description: failure in creating meme
  */

app.post('/memes/posts', async (req, res) => {
  const newMeme = new Meme(req.body);
  let check = await Meme.exists({ 'name': req.body.name, 'caption': req.body.caption, 'url': req.body.url})
try{
  if(urlValidation.isUri(newMeme.url) && !check){
      await newMeme.save();
      res.redirect(`/memes/all`);
  }
  else
  {
     throw err;
  }
}
catch(err)
{
  res.status(404).send('404 Not found');
}
  
  
})





app.post('/memes/:id', async (req, res) => {
    const { id } = req.params;
  try{
    
        const newMeme = await Meme.findById(id)
        newMeme.like += 1;
        await newMeme.save();
        res.redirect(`/memes/all`);
    
    
  }
  catch(err)
  {
    res.status(404).send('404 Not Found');
  }
})

/**
 * @swagger
 * /memes/{meme_id}:
 *  get:
 *   summary: get meme with meme_id id
 *   description: get meme with meme_id id
 *   parameters:
 *    - in: path
 *      name: meme_id
 *      schema:
 *       type: string
 *      required: true
 *      description: id of the meme
 *      example: 1
 *   responses:
 *    200:
 *     description: success
 *    404:
 *     description: error
 */

app.get('/memes/:id', async (req, res) => {
    const { id } = req.params;
  try{
    const meme = await Meme.findById(id)
    res.render('all/show', { meme })
  }
  catch(err)
  {
    res.status(404).send('404 Not Found');
  }
})


/**
 * @swagger
 * /memes/{meme_id}:
 *  patch:
 *   summary: update meme details
 *   description: update meme details
 *   parameters:
 *    - in: path
 *      name: meme_id
 *      schema:
 *       type: string
 *      required: true
 *      description: id of the meme
 *      example: 1
 *   responses:
 *    200:
 *     description: success
 *    404:
 *     description: error
 */

app.patch('/memes/:id', async (req, res) => {
    const { id } = req.params;
  try{
    const meme = await Meme.findById(id);
    const newCaptionText = req.body.caption;
    const newUrl = req.body.url;
    meme.caption = newCaptionText;
    meme.url = newUrl;
    await meme.save();
    res.status(200).send('200 OK');
  }
  catch(err)
   {
    res.status(404).send('404 Not found');
   }
})

app.use('/swagger-ui', swaggerUI.serve, swaggerUI.setup(specs));

app.use((req, res) =>{
    res.status(404).send('404 Not Found');
})

const port = process.env.PORT || 8081;
app.listen(port, () => {
    console.log("APP IS LISTENING ON PORT 8081!")
})

//swaggerApp.listen(swaggerPORT)