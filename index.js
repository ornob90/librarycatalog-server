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

    const adminCollection = client.db("LibraryCatalog").collection("admin");
    const booksCollection = client.db("LibraryCatalog").collection("books");
    const borrowedCollection = client
      .db("LibraryCatalog")
      .collection("borrowed");

    /*
     * GET METHODS
     */

    // get all the books
    app.get("/books", async (req, res) => {
      try {
        const page = parseInt(req.query.page) || 0;
        const size = parseInt(req.query.size) || 10;

        const result = await booksCollection
          .find()
          .skip(page * size)
          .limit(size)
          .toArray();

        res.send(result);
      } catch (error) {
        console.log(error);
        res.status(500).send("There was a server side error!!");
      }
    });

    // get a single book by id
    app.get("/book/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const query = { _id: new ObjectId(id) };

        const result = await booksCollection.findOne(query);

        if (result) {
          res.send(result);
        } else {
          res.status(404).send({ message: "Not Found" });
        }
      } catch (error) {
        console.log(error);
        res.status(500).send("Operation unsuccessful");
      }
    });

    // get books by category
    app.get("/books/:category", async (req, res) => {
      try {
        const { category } = req.params;

        const query = { category };

        const result = await booksCollection.find(query).toArray();

        res.send(result);
      } catch (error) {
        console.log(error);
        res.status(500).send("Operation unsuccessful");
      }
    });

    // get all the borrowed books
    app.get("/borrowed", async (req, res) => {
      try {
        const result = await borrowedCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
        res.status(500).send("There was a server side error!!");
      }
    });

    // get a borrowed book by id
    app.get("/borrowed/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const query = { _id: new ObjectId(id) };

        const result = await borrowedCollection.findOne(query);

        if (result) {
          res.send(result);
        } else {
          res.status(404).send({ message: "Not Found" });
        }
      } catch (error) {
        console.log(error);
        res.status(500).send("Operation unsuccessful");
      }
    });

    /*
     * POST METHODS
     */

    app.post("/admin", async (req, res) => {
      try {
        const { email, password } = req.body;

        const query = { email, password };

        const result = await adminCollection.findOne(query);

        if (result) {
          res.send({ status: true });
        } else {
          res.status(401).send({ message: "unauthorized access" });
        }
      } catch (error) {
        console.log(error);
        res.status(500).send({ message: "There was a server side error!!" });
      }
    });

    // post a single book
    app.post("/book", async (req, res) => {
      try {
        const book = req.body;

        if (!book || Object.keys(book).length === 0) {
          res.status(400).send({ message: "Invalid Request" });
        }

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

    // post a single borrowed book
    app.post("/borrowed", async (req, res) => {
      try {
        const borrowedBook = req.body;

        if (!borrowedBook || Object.keys(borrowedBook).length === 0) {
          res.status(400).send({ message: "Invalid Request" });
        }

        const result = await borrowedCollection.insertOne(borrowedBook);

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

    // update a book by id
    app.put("/book/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const filter = { _id: new ObjectId(id) };

        const updatedBook = req.body;

        if (Object.keys(updatedBook).length === 0) {
          res.status(400).send({ message: "Invalid Request" });
        }

        const option = { upsert: true };

        const book = {
          $set: {
            ...updatedBook,
          },
        };

        const result = await booksCollection.updateOne(filter, book, option);

        // res.send(result);

        if (result.acknowledged && result.modifiedCount > 0) {
          res
            .status(200)
            .send({ success: true, message: "Updated Successfully" });
        } else if (result.acknowledged && result.modifiedCount === 0) {
          res.status(200).send({ success: false, message: "No Data Updated" });
        } else {
          res.status(400).send({ message: "Invalid Request" });
        }
      } catch (error) {
        console.log(error);
        res.status(500).send({ message: "There was a server side error!" });
      }
    });

    // update a borrowed book by id
    app.put("/borrowed/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const filter = { _id: new ObjectId(id) };

        const updatedBorrowedBook = req.body;

        if (Object.keys(updatedBorrowedBook).length === 0) {
          res.status(400).send({ message: "Invalid Request" });
        }

        const option = { upsert: true };

        const borrowedBook = {
          $set: {
            ...updatedBorrowedBook,
          },
        };

        const result = await borrowedCollection.updateOne(
          filter,
          borrowedBook,
          option
        );

        // res.send(result);

        if (result.acknowledged && result.modifiedCount > 0) {
          res
            .status(200)
            .send({ success: true, message: "Updated Successfully" });
        } else if (result.acknowledged && result.modifiedCount === 0) {
          res.status(200).send({ success: false, message: "No Data Updated" });
        } else {
          res.status(400).send({ message: "Invalid Request" });
        }
      } catch (error) {
        console.log(error);
        res.status(500).send({ message: "There was a server side error!" });
      }
    });

    /*
     * DELETE METHODS
     */

    // delete a book by id
    app.delete("/book/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const query = { _id: new ObjectId(id) };
        const result = await booksCollection.deleteOne(query);

        console.log(result);

        if (result.acknowledged && result.deletedCount === 1) {
          res
            .status(200)
            .send({ success: true, message: "Deleted Successfully" });
        } else if (result.acknowledged && result.deletedCount === 0) {
          res.status(200).send({ success: false, message: "No Data Deleted" });
        } else {
          res.status(400).send({ message: "Invalid Request" });
        }
      } catch (error) {
        console.log(error);
        res.status(500).send("There was a server side error!!");
      }
    });

    // delete a borrowed book by id
    app.delete("/borrowed/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const query = { _id: new ObjectId(id) };
        const result = await borrowedCollection.deleteOne(query);

        console.log(result);

        if (result.acknowledged && result.deletedCount === 1) {
          res
            .status(200)
            .send({ success: true, message: "Deleted Successfully" });
        } else if (result.acknowledged && result.deletedCount === 0) {
          res.status(200).send({ success: false, message: "No Data Deleted" });
        } else {
          res.status(400).send({ message: "Invalid Request" });
        }
      } catch (error) {
        console.log(error);
        res.status(500).send("There was a server side error!!");
      }
    });

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
