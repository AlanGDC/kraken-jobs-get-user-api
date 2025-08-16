const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const port = 3000;

const uri = "mongodb+srv://alanduarteautoarmada:YZUSFxKgPBuoIbQz@cluster0.3wjnxae.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const dbName = "sample_mflix";
const collectionName = "comments";

const client = new MongoClient(uri);

async function main() {
    try {
        await client.connect();
        console.log("✅ Connected to MongoDB");

        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // GET /comments with filters
        app.get('/comments', async (req, res) => {
            try {
                const query = {};

                // Convert query params to MongoDB filters
                if (req.query._id) {
                    try {
                        query._id = new ObjectId(req.query._id);
                    } catch (err) {
                        return res.status(400).json({ error: "Invalid _id format" });
                    }
                }
                if (req.query.name) query.name = req.query.name;
                if (req.query.email) query.email = req.query.email;
                if (req.query.movie_id) {
                    try {
                        query.movie_id = new ObjectId(req.query.movie_id);
                    } catch (err) {
                        return res.status(400).json({ error: "Invalid movie_id format" });
                    }
                }
                if (req.query.text) query.text = { $regex: req.query.text, $options: "i" }; // case-insensitive
                if (req.query.date) {
                    const dateVal = new Date(req.query.date);
                    if (!isNaN(dateVal)) {
                        query.date = dateVal;
                    } else {
                        return res.status(400).json({ error: "Invalid date format (use YYYY-MM-DD)" });
                    }
                }

                // Pagination
                const limit = parseInt(req.query.limit) || 10;
                const skip = parseInt(req.query.skip) || 0;

                const comments = await collection
                    .find(query)
                    .skip(skip)
                    .limit(limit)
                    .toArray();

                res.json(comments);
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: 'Failed to fetch comments' });
            }
        });

        app.listen(port, () => {
            console.log(`🚀 Server running at http://localhost:${port}`);
        });

    } catch (err) {
        console.error("❌ MongoDB connection error:", err);
    }
}

main();
