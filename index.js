const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.port || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send("Mr. Chef server running")
});

app.listen(port, () => {
    console.log(`listening port ${port}`)
});