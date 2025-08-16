const { MongoClient, ObjectId } = require('mongodb');

const uri = "mongodb+srv://alanduarteautoarmada:YZUSFxKgPBuoIbQz@cluster0.3wjnxae.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const dbName = "sample_mflix";
const collectionName = "comments";

// Global variable to cache connection between calls
let cachedClient = null;

async function connectToDatabase() {
    if (cachedClient && cachedClient.topology && cachedClient.topology.isConnected()) {
        return cachedClient;
    }

    const client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        keepAlive: true,
        connectTimeoutMS: 5000 // fail faster if slow
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

        const comments = await collection
            .find(query)
            .skip(skip)
            .limit(limit)
            .toArray();

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(comments),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" })
        };
    }
};
