require('dotenv').config()
const express = require('express')
const cors = require('cors')
const app = express()

// Basic Configuration
const port = process.env.PORT || 3000

app.use(cors())

app.use('/public', express.static(`${process.cwd()}/public`))

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html')
})

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' })
})

// ----------------------------------My Code----------------------------------//

const dns = require('dns')

const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: true }))

// WITHOUT USING DATABASE - Data resetted if program stop//
// let originalUrl = [];
// let i = 0;

// app.post('/api/shorturl', (req, res, next) => {
//   let postedUrl = req.body.url;
//   let formattedUrl = new URL(postedUrl);
//   dns.lookup(formattedUrl.hostname, (err, address, family) => {
//     if(err) {
//       return res.json({"error":"invalid url"});
//     } else{
//       res.locals.url = postedUrl
//       next();
//     }
//   })
// }, (req,res) => {
//   let postedUrl = res.locals.url;
//   if(originalUrl.indexOf(postedUrl) == -1){
//     originalUrl.push(postedUrl);
//   }
//   return res.json({"original_url": postedUrl, "short_url": originalUrl.indexOf(postedUrl)});
// });

// app.get('/api/shorturl/:shortenedUrl', (req, res) => {
//   let short = parseInt(req.params.shortenedUrl);
//   if(short < originalUrl.length && short >= 0){
//     return res.redirect(originalUrl[short]);
//   } else{
//     return res.json({"error": "invalid url"});
//   }
// });
// WITHOUT USING DATABASE //

// USING DATABASE (MONGODB)//
const mongoose = require('mongoose')
const MONGO_URI = process.env.MONGO_URI
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
const urlSchema = new mongoose.Schema({ original: String, shortened: String })
const Url = mongoose.models.Url || mongoose.model('Url', urlSchema)

app.post('/api/shorturl', async (req, res, next) => {
  const postedUrl = req.body.url
  const formattedUrl = new URL(postedUrl)
  await dns.lookup(formattedUrl.hostname, (err, address, family) => {
    if (err) {
      return res.json({ error: 'invalid url' })
    } else {
      res.locals.url = postedUrl
      next()
    }
  })
}, async (req, res) => {
  const postedUrl = res.locals.url
  const found = await Url.findOne({ original: postedUrl })
  if (!found) {
    const newShort = parseInt(await Url.count()) + 1
    const newUrl = new Url({ original: postedUrl, shortened: newShort })
    await newUrl.save()
    return res.json({ original_url: postedUrl, short_url: newShort })
  } else {
    return res.json({ original_url: found.original, short_url: found.shortened })
  };
})

app.get('/api/shorturl/:shortenedUrl', async (req, res) => {
  const short = req.params.shortenedUrl
  const found = await Url.findOne({ shortened: short })
  if (found) {
    return res.redirect(found.original)
  } else {
    return res.json({ error: 'invalid url' })
  }
})

// USING DATABASE//

// ----------------------------------My Code----------------------------------//

app.listen(port, function () {
  console.log(`Listening on port ${port}`)
})
