const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// verifyJWT
// const verifyJWT = (req, res, next) => {
//      console.log("hitting verify JWT");
//      console.log(req.headers.authorization)

//      const authorization = req.headers.authorization;
//      if(!authorization){
//       return res.status(401).send({error: true, message: 'unauthorized access'})
//      }

//      const token = authorization.split(" ")[1];
//      console.log('token inside jwt', token)

//      jwt.verify(token, process.env.ACCESSS_TOKEN_SECRET, (err, decoded) => {
//         if(err){
//           return res.status(403).send({error: true, message: 'unauthorized access'})
//         }
//         req.decoded = decoded;
//         next();
//      })
// }

// verifyJWT
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(402).send({error: true, message: 'unauthorized access'})
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESSS_TOKEN_SECRET, (err, decoded) => {
    if(err){
      return res.status(401).send({error: true, message: 'unauthorized access'})
    }

    req.decoded = decoded;
    next();

  })
}

// check root api
app.get('/', (req, res) => {
    res.send('car doctor server is running...')
})

// mongodb area

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.5julrfk.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    const serviceCollection = client.db('car-doctor').collection('services');
    const bookingCollection = client.db('car-doctor').collection('bookings');
    const productCollection = client.db('car-doctor').collection('products');
    const engineerCollection = client.db('car-doctor').collection('our-engineer');


    // jwt related api
    app.post('/jwt', (req, res) => {
      const user = req.body;
      console.log(user);

      const token = jwt.sign(user, process.env.ACCESSS_TOKEN_SECRET, { expiresIn: "1h"});
      console.log(token)
      res.send({token});

    })


    // Services Related Api
    app.get('/services', async (req, res) => {
        const result = await serviceCollection.find().toArray();
        res.send(result)
    })

    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await serviceCollection.findOne(query);
      res.send(result);
    })

    // -------------------- Booking Related Apis
    app.post('/bookings', async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result)
    })

    // app.get('/bookings', verifyJWT, async (req, res) => {
    app.get('/bookings', verifyJWT, async (req, res) => {
      // console.log(req.query.email)
      // console.log(req.headers.authorization)
      const decoded = req.decoded;
      // console.log('came back after verify', decoded)

      if(decoded.email !== req.query.email){
        return res.status(403).send({error: true, message: 'Forbidden access'}) 
      }
      
      let query = {};
      if(req.query?.email){
        query = { email: req.query.email}
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result)
    })


    // ---------------------- Products Related Apis
    app.get('/products', async (req, res) => {
      const result = await productCollection.find().toArray();
      res.send(result)
    })


    //------------------------ Engineer Profile Related Apis
    app.get('/engineer', async (req, res) =>  {
        const result = await engineerCollection.find().toArray();
        res.send(result)
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


// listening
app.listen(port, () => {
    console.log(`car doctor server is running on port : ${port}`)
})