import { MongoClient, ServerApiVersion} from "mongodb";

const password = "rukie607";
const userName = "ruqaiyah731";
const server = "cluster0.hp71o.mongodb.net";

const encodedUsername = encodeURIComponent(userName);
const encodedPassword =  encodeURIComponent(password);

const connectURI = `mongodb+srv://${encodedUsername}:${encodedPassword}@${server}/?retryWrites=true&w=majority`;
console.log(connectURI);


const client = new MongoClient( connectURI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: false,
        deprecationErrors: true,
    }
});


const database =  client.db("Social_NetworkingCoursework");
const collection = database.collection("users");
const postsCollection = database.collection("posts")
const notificationsCollection = database.collection("notifications");

export {collection, postsCollection, notificationsCollection};

