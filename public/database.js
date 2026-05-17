import { MongoClient, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const connectURI = process.env.MONGODB_URI;

if (!connectURI) {
  throw new Error("MONGODB_URI is missing. Create a .env file using .env.example.");
}

const client = new MongoClient(connectURI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: true,
  },
});

const database = client.db("Social_NetworkingCoursework");

const collection = database.collection("users");
const postsCollection = database.collection("posts");
const notificationsCollection = database.collection("notifications");

export { collection, postsCollection, notificationsCollection };