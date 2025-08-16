const { MongoClient, ObjectId } = require('mongodb');

const uri = "mongodb+srv://alanduarteautoarmada:YZUSFxKgPBuoIbQz@cluster0.3wjnxae.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const dbName = "sample_mflix";
const collectionName = "comments";

let cachedClient = null;

async function connectToDatabase() {
    if (cachedClient) {
        return cachedClient;
    }
    const client = new MongoClient(uri, {
        connectTimeoutMS: 5000
    });
    await client.connect();
    cachedClient = client;
    return client;
}

exports.handler = async (event) => {
    try {
        const client = await connectToDatabase();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        const method = event.httpMethod;

        // --- GET (Read) ---
        if (method === "GET") {
            const params = event.queryStringParameters;
            const query = {};

            if (params._id) query._id = new ObjectId(params._id);
            if (params.name) query.name = params.name;
            if (params.email) query.email = params.email;
            if (params.movie_id) query.movie_id = new ObjectId(params.movie_id);
            if (params.text) query.text = { $regex: params.text, $options: "i" };
            if (params.date) {
                const dateVal = new Date(params.date);
                if (!isNaN(dateVal)) query.date = dateVal;
            }

            const limit = parseInt(params.limit) || 10;
            const skip = parseInt(params.skip) || 0;

            const comments = await collection.find(query).skip(skip).limit(limit).toArray();
            return { statusCode: 200, body: JSON.stringify(comments) };
        }

        // --- POST (Create) ---
        if (method === "POST") {
            const body = JSON.parse(event.body);
            const newComment = {
                name: body.name,
                email: body.email,
                movie_id: new ObjectId(body.movie_id),
                text: body.text,
                date: new Date()
            };

            const result = await collection.insertOne(newComment);
            return { statusCode: 201, body: JSON.stringify({ insertedId: result.insertedId }) };
        }

        // --- PUT (Update) ---
        if (method === "PUT") {
            const body = JSON.parse(event.body);
            if (!body._id) {
                return { statusCode: 400, body: JSON.stringify({ error: "_id is required" }) };
            }
            const filter = { _id: new ObjectId(body._id) };
            const update = { $set: {} };

            if (body.name) update.$set.name = body.name;
            if (body.email) update.$set.email = body.email;
            if (body.movie_id) update.$set.movie_id = new ObjectId(body.movie_id);
            if (body.text) update.$set.text = body.text;
            if (body.date) update.$set.date = new Date(body.date);

            const result = await collection.updateOne(filter, update);
            return { statusCode: 200, body: JSON.stringify({ matchedCount: result.matchedCount, modifiedCount: result.modifiedCount }) };
        }

        // --- DELETE (Remove) ---
        if (method === "DELETE") {
            const params = event.queryStringParameters;
            if (!params._id) {
                return { statusCode: 400, body: JSON.stringify({ error: "_id query parameter is required" }) };
            }
            const result = await collection.deleteOne({ _id: new ObjectId(params._id) });
            return { statusCode: 200, body: JSON.stringify({ deletedCount: result.deletedCount }) };
        }

        return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
    } catch (error) {
        console.error(error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
