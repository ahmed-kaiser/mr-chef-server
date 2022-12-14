const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.port || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.fixmo2v.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const verifyToken = (req, res, next) => {
    const header = req.headers.authorization;
    if(!header) {
        res.status(401).send({message: 'Unauthorized access'});
    }else{
        const token = header.split(' ')[1];
        jwt.verify(token, process.env.SIGNATURE, (err, decoded) => {
            if(err) {
                res.status(401).send({message: 'Unauthorized access'});
            }else{
                req.decoded = decoded;
                next();
            }
        });
    }
};

const run = async() => {
    try{
        const serviceCollection = client.db("MrChef").collection("services");
        const reviewCollection = client.db("MrChef").collection("reviews");

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

        app.get('/services/:id', async(req, res) => {
            let query = { _id: ObjectId(req.params.id)};
            const service = await serviceCollection.findOne(query);
            res.send(service);
        });

        app.post('/reviews', async(req, res) => {
            const result = await reviewCollection.insertOne(req.body);
            res.send(result);
        });

        app.get('/reviews', async(req, res) => {
            const query = { serviceTitle: req.query.serviceTitle };
            const cursor = reviewCollection.find(query).sort({date:-1});
            const reviews = await cursor.toArray();
            res.send(reviews);
        });

        app.get('/my_reviews', verifyToken, async(req, res) => {
            if(req.decoded.email !== req.query.email ) {
                res.status(401).send({message: 'Unauthorized access'});
            }
            const cursor = reviewCollection.aggregate([
                {
                    $lookup:{
                        from: 'services',
                        localField: 'serviceTitle',
                        foreignField: 'title',
                        as: 'service'
                    }
                },
                {
                    "$match":{userEmail: req.query.email}
                }
            ])
            const result = await cursor.toArray()
            res.send(result);
        });

        app.put('/my-reviews', async(req, res) => {
            const data = req.body;
            const filter = { _id: ObjectId(req.query.id ) };
            const result = await reviewCollection.updateOne(filter, {$set: data });
            res.send(result);
        });
        
        app.delete('/my-reviews/:id', async(req, res) => {
            const query = { _id: ObjectId(req.params.id) };
            const result = await reviewCollection.deleteOne(query);
            res.send(result);
        });

        app.post('/add_service', async(req, res) => {
            const result = await serviceCollection.insertOne(req.body);
            res.send(result);
        });
    }
    catch(err){
        console.log(err);
    }
}

run().catch(err => console.log(err));

app.post('/verify', (req, res) => {
    const user = req.body;
    const token = jwt.sign(user, process.env.SIGNATURE, { expiresIn: '1h' });
    res.send({token});
});

app.get('/', (req, res) => {
    res.send("Mr. Chef server running")
});

app.listen(port, () => {
    console.log(`listening port ${port}`)
});