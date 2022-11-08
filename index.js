const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.port || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.fixmo2v.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const run = async() => {
    try{
        const serviceCollection = client.db("MrChef").collection("services");

        app.get('/services', async(req, res) => {
            const limit = parseInt(req.query.limit);
            const query = {};
            let cursor;
            if(limit){
                cursor = serviceCollection.find(query).limit(limit);
            }else{
                cursor = serviceCollection.find(query);
            }
            const result = await cursor.toArray();
            res.send(result);
        });
    }
    catch(err){
        console.log(err);
    }
}

run().catch(err => console.log(err))

app.get('/', (req, res) => {
    res.send("Mr. Chef server running")
});

app.listen(port, () => {
    console.log(`listening port ${port}`)
});