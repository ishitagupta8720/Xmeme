const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const urlValidation = require('valid-url');


if (process.env.NODE_ENV !=="production"){
  require('dotenv').config();
}

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/Collection';




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



app.get('/memes/all', async(req,res) => {
    try{
    const memes = await Meme.find().sort({ "time": -1 }).limit(100);
    res.render('all/app', { memes })
    }
    catch(err){
        res.status(404).send('404 Not Found');
    }
})

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

app.get('/memes/new', (req, res) => {
    res.render('all/new')
})



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



app.use((req, res) =>{
    res.status(404).send('404 Not Found');
})

const port = process.env.PORT || 8081;
app.listen(port, () => {
    console.log("APP IS LISTENING ON PORT 8081!")
})
