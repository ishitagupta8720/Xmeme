const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const urlValidation = require('valid-url');
const swaggerJSDoc = require('swagger-jsdoc')
const swaggerUI = require('swagger-ui-express')
const cors = require('cors')

if (process.env.NODE_ENV !=="production"){
  require('dotenv').config();
}

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/Collection';


//const swaggerApp = express()

//swaggerApp.use(cors())


//const swaggerPORT = process.env.PORT || 8080



const Meme = require('./models/memes');


//Connecting the mongodb database
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
 *      example: 'Ishita Gupta'
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


app.use(cors())


app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

/**
 * @swagger
 * /memes/all:
 *  get:
 *   summary: get all memes displayed on the homepage
 *   description: get all memes displayed on the homepage
 *   responses:
 *    200:
 *     description: success
 *    404:
 *     description: error
 */


 // Get route to render html to display all the memes
app.get('/memes/all', async(req,res) => {
    try{
    const memes = await Meme.find().sort({ "time": -1 }).limit(100);
    if(memes.length>0)
    {
       res.render('all/app', { memes })
    }
    else{
      res.render('all/Nomeme')
    }
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


 //Get route to send json data back for all the memes
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
 * /memes/new:
 *  get:
 *   summary: render form to post memes
 *   description: render form to post memes
 *   responses:
 *    200:
 *     description: success
 *    500:
 *     description: error
 */


 //Get route to render frontend to create a new meme
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
  *     description: Failure in creating meme
  *    409:
  *     description: Duplicate POST request
  */

//Post route to add new meme through curl command
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
      res.status(404).send('404 Not Found');
    }
  }
  catch(err)
  {
    res.status(404).send('404 Not found');
  }
    
    
})

/**
  * @swagger
  * /memes/posts:
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
  *    404:
  *     description: failure in creating meme
  */


//Post route to add new meme through the frontend

app.post('/memes/posts', async (req, res) => {
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
    res.status(404).send('404 Not Found');
  }
}
catch(err)
{
  res.status(404).send('404 Not found');
}
  
  
})



//Post route to incrememnt the number of likes for a particular meme
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


 //Get route to display a specific meme
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

 //Patch route to update a specific meme
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
      url: "https://mysterious-hamlet-73374.herokuapp.com/"
    }]
  },
  apis: ['app.js']
}

const specs = swaggerJSDoc(swaggerOptions)

app.use('/swagger-ui', swaggerUI.serve, swaggerUI.setup(specs));

app.use((req, res) =>{
    res.status(404).send('404 Not Found');
})

const port = process.env.PORT || 8081;
app.listen(port, () => {
    console.log("APP IS LISTENING ON PORT 8081!")
})

//swaggerApp.listen(swaggerPORT)