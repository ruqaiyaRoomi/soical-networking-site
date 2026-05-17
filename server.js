import express from "express";
import path from "path";
import bodyParser from "body-parser";
import expressSession from "express-session";
import multer from "multer";
import { ObjectId } from "mongodb"; 
import { collection, postsCollection, notificationsCollection } from "./public/database.js";  

const app = express();
app.use(express.static("public"));
app.listen(8080, () => console.log("Server running on http://localhost:8080"));

app.get("/M00908974/index", (request, response) => {
    response.sendFile(path.resolve("public", "index.html"));
});

app.use(bodyParser.json());
app.use(
    expressSession({
        secret: "cst2120 secret",
        resave: false,
        saveUninitialized: true,
    })
);

// Set up Multer for image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads');  // Save files to "uploads" folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));  // Unique filename
    }
});
const upload = multer({ storage: storage });

// POST, user registration data
app.post("/M00908974/users", register);
app.get("/M00908974/users", getUsers);

// login handlers
app.get("/M00908974/login", checklogin); 
app.post("/M00908974/login", login); 
app.delete("/M00908974/login", logout); 

// content handlers
app.post("/M00908974/contents", upload.single('image'), postContent);
app.post("/M00908974/contents/comments", postComment)  
app.get("/M00908974/contents", getContents);
app.delete("/M00908974/contents", removePost)


// following handlers
app.post("/M00908974/follow", followUser);
app.delete("/M00908974/follow", unFollowUser);

// search handlers
app.get("/M00908974/users/search", searchUser);
app.get("/M00908974/contents/search", searchContent);


// notifications
app.get("/M00908974/notifications", getNotifications);



// functions to save notifications
async function createNotification(userName, type, actorName, postId = null) {
    const notification = {
        userName,           // User to notify
        type,               // 'like', 'comment', 'follow', 'post'
        actorName,          // User who performed the action
        postId,             //for post-related notifications
        date: new Date(),  // the time of the notifications
       
    };
    // adding it to the notifcations Collections 
    await notificationsCollection.insertOne(notification);
}

async function getNotifications(request, response) {
    if (!request.session.userName) {
        return response.status(401).json({ error: "User not logged in." });
    }

    const currentUserName = request.session.userName;

    try {
        // Fetch notifications for the logged-in user
        const notifications = await notificationsCollection
            .find({ userName: currentUserName })
            .sort({ date: -1 })  // Sort by most recent
            .toArray();

        // Format the notifications based on the actions
        const formattedNotifications = notifications.map(notification => {
            let actionMessage = '';
            switch (notification.type) {
                case 'like':
                    actionMessage = `${notification.actorName} liked your post.`;
                    break;
                case 'comment':
                    actionMessage = `${notification.actorName} commented on your post.`;
                    break;
                case 'follow':
                    actionMessage = `${notification.actorName} followed you.`;
                    break;
                case 'post':
                    actionMessage = `${notification.actorName} posted something new.`;
                    break;
                default:
                    actionMessage = `Unknown action by ${notification.actorName}.`;
            }

            return {
                message: actionMessage,
                date: notification.date,
                postId: notification.postId
            };
        });

        response.status(200).json({ notifications: formattedNotifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        response.status(500).json({ error: "An error occurred while fetching notifications." });
    }
}


// functions for post related actions

// posting images
async function postContent(request, response) {
    const { caption } = request.body; 
    const image = request.file;

    if (!request.session.userName) {
        return response.status(401).json({ error: "User not logged in." });
    }

    if (!caption && !image) {
        return response.status(400).json({ posted: false, message: 'Please provide a caption or an image.' });
    }

    try {
        const imageUrl = image ? `../uploads/${image.filename}` : null; // creates a url for the uploaded image
        const currentUser = request.session.userName;

        const newPost = {
            caption,
            imageUrl,
            userName: currentUser,
            likeCount: 0,
            likedBy: [], // array to show the users who liked the post
            comments: [], // array to show the users who comments
            date: new Date(),
        };
        // adds the post to the postCollection
        const insertResult = await postsCollection.insertOne(newPost);
        const postId = insertResult.insertedId;

        // Notify followers about the new post
        const userDoc = await collection.findOne({ userName: currentUser });
        if (userDoc && userDoc.followers) {
            const notificationPromises = userDoc.followers.map(follower => 
                createNotification(follower, 'post', currentUser, postId)
            );
            await Promise.all(notificationPromises);
        }

        // updates the post count
        const postCount = await postsCollection.countDocuments({
            userName: currentUser,
        });

        response.json({
            posted: true,
            postId,
            imageUrl: newPost.imageUrl,
            postCount,
        });
    } catch (error) {
        console.error('Error posting content:', error);
        response.status(500).json({ posted: false, message: 'An error occurred while posting.' });
    }
}

//geting images
async function getContents(request, response) {
    try {

        if (!request.session.userName) {
            return response.status(401).json({ error: "User not logged in." });
        }

        const currentUserName = request.session.userName;
        const { postId, action, comment } = request.query; // Extract parameters from the request query

        // If a post ID and action are provided, handle post-specific actions
        if (postId && action) {
            let postObjectId;

            // Validate the postId format
            try {
                postObjectId = new ObjectId(postId);
            } catch (e) {
                return response.status(400).json({ error: "Invalid postId." });
            }

            // Ensure the action is one of the allowed values
            const actionLower = action.toLowerCase();
            if (!['like', 'unlike', 'comment'].includes(actionLower)) {
                return response.status(400).json({ error: "Invalid action." });
            }

            // Fetch the post from the database
            const post = await postsCollection.findOne({ _id: postObjectId });
            if (!post) {
                return response.status(404).json({ error: "Post not found." });
            }

            if (actionLower === 'like' || actionLower === 'unlike') {
                // Construct the database update query based on the action
                const updateQuery =
                    actionLower === "like"
                        ? { $addToSet: { likedBy: currentUserName } } // Add user to 'likedBy' array
                        : { $pull: { likedBy: currentUserName } };    // Remove user from 'likedBy' array

                // Update the post in the database
                const result = await postsCollection.updateOne({ _id: postObjectId }, updateQuery);

                if (result.modifiedCount > 0) {
                    // If the action is 'like', create a notification (if the post owner is not the current user)
                    if (actionLower === 'like' && post.userName !== currentUserName) {
                        await createNotification(post.userName, 'like', currentUserName, postId);
                    }

                    // Fetch the updated post data
                    const updatedPost = await postsCollection.findOne({ _id: postObjectId });
                    return response.status(200).json({
                        success: true,
                        postId: postId,
                        likeCount: updatedPost.likedBy.length, // Updated like count
                        liked: updatedPost.likedBy.includes(currentUserName), // Whether the current user liked the post
                    });
                }
            } else if (actionLower === 'comment') {
                // If the action is 'comment', ensure the comment text is provided
                if (!comment) {
                    return response.status(400).json({ error: "Comment text is required." });
                }

                // Add the comment to the post in the database
                const result = await postsCollection.updateOne(
                    { _id: postObjectId },
                    { $push: { comments: { text: comment, userName: currentUserName, date: new Date() } } }
                );

                if (result.modifiedCount > 0) {
                    // Create a notification for the comment (if the post owner is not the current user)
                    if (post.userName !== currentUserName) {
                        await createNotification(post.userName, 'comment', currentUserName, postId);
                    }

                    return response.status(200).json({
                        success: true,
                        postId: postId,
                        comment, // The submitted comment
                        commentedBy: currentUserName, // The user who commented
                    });
                }
            }

            // If no modifications were made, return an error response
            return response.status(400).json({ success: false, message: "Failed to update post." });
        }

        // Fetch the current user's details from the database
        const currentUser = await collection.findOne({ userName: currentUserName });
        const following = currentUser?.following || []; // Get the list of users the current user is following
        following.push(currentUserName); // Include the current user in the list (to see their own posts)

        // Fetch posts from users the current user is following
        const userPosts = await postsCollection
            .find({ userName: { $in: following } })
            .sort({ date: -1 }) // Sort posts by date in descending order
            .toArray();

        // Add like status and like count for each post
        const postsWithLikeStatus = userPosts.map(post => ({
            ...post,
            liked: post.likedBy?.includes(currentUserName) || false, // Whether the current user liked the post
            likeCount: post.likedBy?.length || 0, // Total number of likes
        }));

        // Send the list of posts along with login status
        response.status(200).json({
            posts: postsWithLikeStatus,
            loggedIn: true,
        });
    } catch (error) {
        // Handle unexpected errors
        console.error("Error:", error);
        response.status(500).json({ error: "An error occurred." });
    }
}

// deleting posts
async function removePost(request, response) {
    try {
        // Check if the user is logged in
        if (!request.session.userName) {
            return response.status(401).json({ error: "User not logged in." });
        }

        const currentUserName = request.session.userName;
        const { postId } = request.body;

        if (!postId) {
            return response.status(400).json({ error: "PostId is required." });
        }

        // Convert postId string to MongoDB ObjectId
        const objectId = new ObjectId(postId);

        // Find the post to check if the current user is the owner
        const post = await postsCollection.findOne({ _id: objectId });

        if (!post) {
            return response.status(404).json({ error: "Post not found." });
        }

        if (post.userName !== currentUserName) {
            return response.status(403).json({ error: "You can only delete your own posts." });
        }

        // Delete the post
        const result = await postsCollection.deleteOne({ _id: objectId });

        if (result.deletedCount > 0) {
            return response.status(200).json({ success: true, message: "Post deleted successfully." });
        } else {
            return response.status(400).json({ error: "Failed to delete the post." });
        }
    } catch (error) {
        console.error("Error deleting post:", error);
        response.status(500).json({ error: "An error occurred while deleting the post." });
    }
}

// post comments 
async function postComment(request, response) {
    try {
        // Check if the user is logged in
        if (!request.session.userName) {
            return response.status(401).json({ error: "User not logged in." });
        }

        const currentUserName = request.session.userName;
        const { postId, comment } = request.body; 

        // Validate that postId and comment text are provided
        if (!postId || !comment) {
            return response.status(400).json({ error: "PostId and comment text are required." });
        }

        // Convert postId to ObjectId for MongoDB query
        let postObjectId;
        try {
            postObjectId = new ObjectId(postId);
        } catch (e) {
            return response.status(400).json({ error: "Invalid postId." });
        }

        //  comment object
        const commentObject = {
            text: comment,
            userName: currentUserName,
            date: new Date()
        };

        // Push the comment into the comments array of the post
        const result = await postsCollection.updateOne(
            { _id: postObjectId },
            { $push: { comments: commentObject } }
        );

        if (result.modifiedCount > 0) {
            if (post.userName !== currentUserName) {
                await createNotification(post.userName, 'comment', currentUserName, postId);
            }
            // Retrieve the updated post to return the latest comment details
            const updatedPost = await postsCollection.findOne({ _id: postObjectId });
            return response.status(200).json({
                success: true,
                postId: postId,
                comment: commentObject,
                commentedBy: currentUserName,
                commentCount: updatedPost.comments.length, 
            });
        } else {
            return response.status(400).json({ error: "Failed to add comment." });
        }
    } catch (error) {
        console.error("Error:", error);
        response.status(500).json({ error: "An error occurred." });
    }
}


// functions for user authentication
// login
async function login(request, response) {
    let usrlogin = request.body;

    // Look to see if we have a matching user
    const user = await collection.findOne({
        userName: usrlogin.userName,
        password: usrlogin.password,
    });

    if (user) {
        request.session.userName = usrlogin.userName;

        // Get the post count for the logged-in user from the posts collection
        const postCount = await postsCollection.countDocuments({
            userName: usrlogin.userName
        });

        // Get followers and following counts
        const followersCount = user.followers ? user.followers.length : 0;
        const followingCount = user.following ? user.following.length : 0;


        // Send the login status along with all counts
        response.send({
            login: true,
            postCount: postCount,
            followersCount: followersCount,
            followingCount: followingCount
        });
    } else {
        response.send(
            '{"login": false, "message":"Username or password incorrect."}'
        );
    }
}

// checking the users status
function checklogin(request, response) {
    if (!("userName" in request.session)) {
        response.send('{"login": false}');
    } else {
        response.send(
            `{"login":true, "userName": "${request.session.userName}"}`
        );
    }
}

// log the user out
function logout(request, response) {
    if (!request.session.userName) {
        return response.status(400).json({ logout: false, message: "User not logged in." });
    }

    // Destroy the session
    request.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return response.status(500).json({ logout: false, message: "Failed to log out." });
        }

        response.status(200).json({ logout: true, message: "Successfully logged out." });
    });
}

// register a new users
async function register(request, response) {
    try {
        let newUser = request.body;
        console.log("Data received: " + JSON.stringify(newUser));

        // Validate that all required fields are provided
        if (!newUser.userName || !newUser.name || !newUser.email || !newUser.password) {
            return response.status(400).send({
                registration: false, 
                message: "All fields are required.",
            });
        }

        // Check if a user with the same username or email already exists
        const user = await collection.findOne({
            $or: [{ userName: newUser.userName }, { email: newUser.email }],
        }); 

        newUser.postCount = 0;

        if (!user) {
            // Insert the new user into the database
            await collection.insertOne(newUser);
            response.send({
                registration: true,
                userName: newUser.userName,
                name: newUser.name,
                email: newUser.email,
                postsCount: newUser.postCount
            });
        } else {
            // If a user exists with the same username or email, return an error response
            response.send({
                registration: false,
                message: "Username or email already exists.",
            });
        }
    } catch (error) {
        console.error("Error during registration:", error);
        response.status(500).send({
            registration: false,
            message: "An error occurred during registration.",
        });
    }
}


// get all the users 
async function getUsers(request, response) {
    try {
        const users = await collection.find().toArray();
        response.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        response.status(500).json({ error: "Failed to fetch users." });
    }
}


// functions to follow/ unfollow users
async function followUser(request, response) {
    // checks if the user is logged in
    if (!request.session.userName) {
        return response.status(401).json({ follow: false, message: "User not logged in." });
    }

    const { userToFollow } = request.body;
    // checks if the input is valid
    if (!userToFollow) {
        return response.status(400).json({ follow: false, message: "User to follow is not specified." });
    }

    try {
        // checks if the users tries to follow themself
        const currentUser = request.session.userName;

        if (currentUser === userToFollow) {
            return response.status(400).json({ follow: false, message: "You cannot follow yourself." });
        }

        const userToFollowExists = await collection.findOne({ userName: userToFollow });
        // if the user tries to follow  a user that doesnt exist
        if (!userToFollowExists) {
            return response.status(404).json({ follow: false, message: "User to follow does not exist." });
        }
        // update the following of the user and the followers of the other user
        const updateFollowers = await collection.updateOne(
            { userName: userToFollow },
            { $addToSet: { followers: currentUser } }
        );

        const updateFollowing = await collection.updateOne(
            { userName: currentUser },
            { $addToSet: { following: userToFollow } }
        );

        if (updateFollowers.modifiedCount > 0 && updateFollowing.modifiedCount > 0) {
            // Create notification for follow
            await createNotification(userToFollow, 'follow', currentUser);

            const updatedFollowersCount = userToFollowExists.followers
                ? userToFollowExists.followers.length + 1
                : 1;

            response.status(200).json({
                follow: true,
                message: `You are now following ${userToFollow}.`,
                followersCount: updatedFollowersCount,
            });
        } else {
            response.status(400).json({ follow: false, message: "Failed to follow the user." });
        }
    } catch (error) {
        console.error("Error following user:", error);
        response.status(500).json({ follow: false, message: "An error occurred while trying to follow the user." });
    }
}
async function unFollowUser(request, response) {
    // Check if the user is logged in
    if (!request.session.userName) {
        return response.status(401).json({ 
            unfollow: false, 
            message: "User not logged in." 
        });
    }

    const { userToUnfollow } = request.body;

    // Validate the userToUnfollow input
    if (!userToUnfollow) {
        return response.status(400).json({ 
            unfollow: false, 
            message: "User to unfollow is not specified." 
        });
    }

    try {
        const currentUser = request.session.userName;

        // Prevent self-unfollow
        if (currentUser === userToUnfollow) {
            return response.status(400).json({ 
                unfollow: false, 
                message: "You cannot unfollow yourself." 
            });
        }

        // Remove current user from userToUnfollow's followers
        const updateFollowers = await collection.updateOne(
            { userName: userToUnfollow },
            { $pull: { followers: currentUser } }
        );

        // Remove userToUnfollow from currentUser's following
        const updateFollowing = await collection.updateOne(
            { userName: currentUser },
            { $pull: { following: userToUnfollow } }
        );

        // Check if both operations succeeded
        if (updateFollowers.modifiedCount > 0 && updateFollowing.modifiedCount > 0) {
            // Fetch the updated userToUnfollow data
            const userToUnfollowData = await collection.findOne({ userName: userToUnfollow });
            const updatedFollowersCount = userToUnfollowData.followers
                ? userToUnfollowData.followers.length
                : 0;

            // Respond with success and updated follower count
            return response.status(200).json({
                unfollow: true,
                message: `You have unfollowed ${userToUnfollow}.`,
                followersCount: updatedFollowersCount,
            });
        } else {
            // One of the updates failed
            return response.status(400).json({ 
                unfollow: false, 
                message: "Failed to unfollow the user. Please try again." 
            });
        }
    } catch (error) {
        // Handle unexpected errors
        console.error("Error unfollowing user:", error);
        return response.status(500).json({ 
            unfollow: false, 
            message: "An error occurred while trying to unfollow the user." 
        });
    }
}



// functions for searching content and users 
async function searchUser(request, response) {
    const { query } = request.query;
    const currentUserName = request.session.userName; 

    if (!query) {
        return response.status(400).json({ error: "Query parameter is required." });
    }

    if (!currentUserName) {
        return response.status(401).json({ error: "User not logged in." });
    }

    try {
        // Fetch matching users
        const users = await collection.find({
            $or: [
                { userName: { $regex: query, $options: 'i' } },
                { name: { $regex: query, $options: 'i' } },
            ]
        }).toArray();

        if (!users.length) {
            return response.status(404).json({ message: "No users found matching your search." });
        }

        // Get the current user's following list
        const currentUserData = await collection.findOne(
            { userName: currentUserName },
            { projection: { following: 1 } }
        );

        const followingList = currentUserData?.following || [];

        // Map users and add the `isFollowing` status
        const usersWithFollowStatus = users.map((user) => ({
            userName: user.userName,
            name: user.name,
            isFollowing: followingList.includes(user.userName),
        }));

        return response.status(200).json({ users: usersWithFollowStatus });
    } catch (error) {
        console.error("Error searching for users:", error);
        return response.status(500).json({ error: "An error occurred while searching for users." });
    }
}

async function searchContent(request, response) {
    try {
        // Check if the user is logged in
        if (!request.session.userName) {
            return response.status(401).json({ error: "User not logged in." });
        }

        const { keyword } = request.query;

        // Validate the keyword input
        if (!keyword) {
            return response.status(400).json({ error: "Search keyword is required." });
        }

        // Perform a case-insensitive search for captions containing the keyword
        const regex = new RegExp(keyword, "i"); 
        const matchingPosts = await postsCollection
            .find({ caption: { $regex: regex } })
            .sort({ date: -1 }) // Sort by newest posts first
            .toArray();

        // Return the results
        response.status(200).json({
            success: true,
            results: matchingPosts,
            count: matchingPosts.length,
        });
    } catch (error) {
        console.error("Error searching content:", error);
        response.status(500).json({ success: false, error: "An error occurred while searching for content." });
    }
}



