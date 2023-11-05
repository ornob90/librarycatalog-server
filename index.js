const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5000"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bwy9xp9.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;

  if (!token) {
    return res.status(401).send("unauthorized access");
  }

  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).send("unauthorized access");
    }

    req.user = decoded;
    next();
  });
};

// Inserting all the data to the database complete

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const booksCollection = client.db("LibraryCatalog").collection("books");

    /*
     * GET METHODS
     */

    /*
     * POST METHODS
     */

    app.post("/book", async (req, res) => {
      try {
        const book = req.body;

        const result = await booksCollection.insertOne(book);

        if (result.acknowledged) {
          res.status(200).send({ success: true });
        } else {
          res.status(500).send({ message: "There was a server side error!!" });
        }
      } catch (error) {
        console.log(error);
        res.status(500).send({ message: "There was a server side error!!" });
      }
    });

    /*
     * PUT METHODS
     */

    app.put("/book/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const filter = { _id: new ObjectId(id) };

        const updatedBook = req.body;
        const option = { upsert: true };

        const book = {
          $set: {
            ...updatedBook,
          },
        };

        const result = await booksCollection.updateOne(filter, book, option);

        res.send(result);
      } catch (error) {
        console.log(error);
        res.status(500).send({ message: "There was a server side error!!" });
      }
    });

    /*
     * DELETE METHODS
     */

    // Send a ping to confirm a successful connection
    await client.db("users").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server Running...");
});

app.listen(port, () => {
  console.log("Server Running");
});
