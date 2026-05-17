// Get elements for buttons and sections
const homeSection = document.getElementById('homeSection');
const profileSection = document.getElementById('profileSection');
const searchSection = document.getElementById('searchSection');
const loginSection = document.getElementById('loginSection');
const signupSection = document.getElementById('signupSection');
const toggleSuggestedUsersBtn = document.getElementById('toggleSuggestedUsers');
const addPostBtn = document.getElementById('addPostBtn');
const addPostPopup = document.getElementById('addPostPopup');
const closePopupBtn = document.getElementById('closePopup');
const notificationsSidebar = document.getElementById('notificationsSidebar');
const homeBtn = document.getElementById('homeBtn');
const searchBtn = document.getElementById('searchBtn');
const profileBtn = document.getElementById('profileBtn');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const notificationsBtn = document.getElementById('notificationsBtn');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const postForm = document.getElementById('postForm');
const postFeed = document.getElementById('postFeed');
const profile_username = document.getElementById('profile_username');
const numberOfPosts = document.getElementById("numberOfPosts");
const profile_posts = document.getElementById("postContainer");
const numberOfFollowers = document.getElementById("numberOfFollowers");
const numberOfFollowing = document.getElementById("numberOfFollowing");


// Function to show the selected section and hide others
function showSection(section) {
    const sections = [homeSection, profileSection, searchSection, loginSection, signupSection];
    sections.forEach((sec) => {
        sec.style.display = sec === section ? 'block' : 'none';
    });

    if(section == homeSection) {
        loadHomePageData();
        
    }

    if(section == profileSection){
        loadProfilePageData();
    }
}

// show the Home section
showSection(homeSection);

// Navigation buttons
homeBtn.addEventListener('click', () => showSection(homeSection));
searchBtn.addEventListener('click', () => showSection(searchSection));
profileBtn.addEventListener('click', () => showSection(profileSection));
loginBtn.addEventListener('click', () => showSection(loginSection));
signupBtn?.addEventListener('click', () => showSection(signupSection));




// User data functions
signupForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent default form submission

    // Collect input values
    const name = document.getElementById('signupName').value;
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address.');
        return;
    }

    // Validate password (at least 8 characters, one uppercase, one lowercase, one number)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
        alert('Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one number.');
        return;
    }

    const userData = {
        name,
        userName: username,
        email,
        password,
    };

    try {
        // Send a POST request to the backend
        const response = await fetch('/M00908974/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        const result = await response.json(); 

        if (result.registration) {
            alert(`Registration successful! Welcome, ${result.name}.`);
            showSection(profileSection);
        } else {
            alert(result.message); 
        }
    } catch (error) {
        console.error('Error during registration:', error);
        alert('An error occurred. Please try again later.');
    }
});

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Get the input values from the form
    const loginUsername = document.getElementById('loginUsername').value.trim();
    const loginPassword = document.getElementById('loginPassword').value.trim();

    // Validate inputs
    if (!loginUsername || !loginPassword) {
        alert('Please enter both username and password.');
        return;
    }

    try {
        // Send login data to the server
        const response = await fetch('/M00908974/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userName: loginUsername,
                password: loginPassword,
            }),
        });

        // Process the server response
        const result = await response.json();

        if (result.login) {
            // Login successful
            alert('Login successful!');
            profile_username.innerText = loginUsername;
            showSection(profileSection);
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'block';
            addPostBtn.style.display = 'block';
            numberOfPosts.textContent = result.postCount;
            numberOfFollowers.innerHTML = result.followersCount;
            numberOfFollowing.innerHTML = result.followingCount;
        } else {
            // Login failed
            alert(result.message || 'Login failed. Please check your credentials.');
        }
    } catch (error) {
        console.error('Error during login:', error);
        alert('An error occurred during login. Please try again.');
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        console.log("Logout button clicked, sending DELETE request...");
        
        // Send a DELETE request to the server to log the user out
        const response = await fetch('/M00908974/login', {
            method: 'DELETE', // Use DELETE for logout
        });

        console.log(`Response status: ${response.status}`);
        const result = await response.json();

        console.log("Logout response received:", result);

        if (result.logout) {
            // Logout successful
            alert(result.message || 'Logout successful!');
            profile_username.innerText = "";
            showSection(loginSection);
            loginBtn.style.display = 'block';
            logoutBtn.style.display = 'none';
            addPostBtn.style.display = 'none';
        } else {
            // Handle logout failure
            alert(result.error || 'Logout failed. Please try again.');
            console.error(result.error);
        }
    } catch (error) {
        console.error('Error during logout:', error);
        alert('An error occurred during logout. Please try again.');
    }
});




// Post related functions

// open and close post pop up 
closePopupBtn?.addEventListener('click', () => {
    addPostPopup.style.display = 'none';
});

addPostBtn?.addEventListener('click', () => {
    addPostPopup.style.display = 'flex';
});

// handle post form 
postForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const captionInput = document.getElementById('caption');
    const imageInput = document.getElementById('image');
    const caption = captionInput.value;
    const image = imageInput.files[0];

    if (!caption && !image) {
        alert('Please provide a caption or an image!');
        return;
    }

    const formData = new FormData();
    formData.append('caption', caption);
    if (image) formData.append('image', image);

    try {
        const response = await fetch('/M00908974/contents', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (result.posted) {
            
            const postFeed = document.getElementById('postFeed');
            const newPost = document.createElement('div');
            newPost.classList.add('post');

            
            const usernameHeader = document.createElement('div');
            usernameHeader.classList.add('post-header');
            usernameHeader.textContent = profile_username.innerText;
            newPost.appendChild(usernameHeader);

            
            if (result.imageUrl) {
                const img = document.createElement('img');
                img.src = result.imageUrl;
                img.alt = 'Post Image';
                img.classList.add('post-image');
                newPost.appendChild(img);
            }

          
            const actionButtons = document.createElement('div');
            actionButtons.classList.add('post-actions');
            
            const likeButton = document.createElement('button');
            likeButton.textContent = "❤️ Like";
            likeButton.classList.add('like-button');
            
            const commentButton = document.createElement('button');
            commentButton.textContent = "💬 Comment";
            commentButton.classList.add('comment-button');
            
            actionButtons.appendChild(likeButton);
            actionButtons.appendChild(commentButton);
            newPost.appendChild(actionButtons);

            if (caption) {
                const captionContainer = document.createElement('div');
                captionContainer.classList.add('post-caption');
                captionContainer.innerHTML = `<strong>${profile_username.innerText}</strong> ${caption}`;
                newPost.appendChild(captionContainer);
            }

         
            const commentSection = document.createElement('div');
            commentSection.classList.add('comments-section');
            commentSection.innerHTML = `
                <div class="comments"></div>
                <input type="text" placeholder="Add a comment..." class="comment-input">
            `;
            newPost.appendChild(commentSection);

            postFeed.prepend(newPost);
            showSection(homeSection);
            numberOfPosts.textContent = result.postCount;

            // Clear input fields
            captionInput.value = '';
            imageInput.value = '';
        } else {
            alert('Failed to create post: ' + result.message);
        }
    } catch (error) {
        console.error('Error while creating post:', error);
        alert('An error occurred while creating the post.');
    }
});

// function to delete posts
function createDeleteButton(postId) {
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.classList.add('delete-button');
    deleteButton.style.position = 'absolute';
    deleteButton.style.top = '10px';
    deleteButton.style.right = '10px';

    deleteButton.addEventListener('click', async () => {
        const confirmDelete = confirm("Are you sure you want to delete this post?");
        if (confirmDelete) {
            try {
                const response = await fetch('/M00908974/contents', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ postId }),
                });
                const result = await response.json();

                if (result.success) {
                    alert('Post deleted successfully!');
                    // Remove the post from the UI
                    document.getElementById(`post-${postId}`).remove();
                } else {
                    alert('Failed to delete the post: ' + result.message);
                }
            } catch (error) {
                console.error('Error deleting post:', error);
                alert('An error occurred while deleting the post.');
            }
        }
    });

    return deleteButton;
}

// functon to render posts on the home page
async function loadHomePageData() {
    try {
        const response = await fetch('/M00908974/contents');
        const data = await response.json();

        if (data.posts) {
            postFeed.innerHTML = ''; // Clear the home feed

            data.posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.classList.add('post');
                postElement.id = `post-${post._id}`;
                postElement.style.position = 'relative'; // For positioning the delete button

                // Add username at the top
                const usernameHeader = document.createElement('div');
                usernameHeader.classList.add('post-header');
                usernameHeader.textContent = post.userName;
                postElement.appendChild(usernameHeader);

                // Add delete button for the current user's posts
                if (post.userName === profile_username.innerText) {
                    const deleteButton = createDeleteButton(post._id);
                    postElement.appendChild(deleteButton);
                }

                // Add image if exists
                if (post.imageUrl) {
                    const img = document.createElement('img');
                    img.src = post.imageUrl;
                    img.alt = 'User Post';
                    img.classList.add('post-image');
                    postElement.appendChild(img);
                }

                // Add like and comment buttons
                const actionButtons = document.createElement('div');
                actionButtons.classList.add('post-actions');
                
                const likeButton = document.createElement('button');
                likeButton.innerHTML = `❤️ (${post.likeCount || 0})`;
                likeButton.classList.add('like-button');
                actionButtons.appendChild(likeButton);

                const commentButton = document.createElement('button');
                commentButton.textContent = "💬 Comment";
                commentButton.classList.add('comment-button');
                actionButtons.appendChild(commentButton);

                postElement.appendChild(actionButtons);

                // Add caption with username
                if (post.caption) {
                    const captionContainer = document.createElement('div');
                    captionContainer.classList.add('post-caption');
                    captionContainer.innerHTML = `<strong>${post.userName}</strong> ${post.caption}`;
                    postElement.appendChild(captionContainer);
                }

                // Add comment section
                const commentSection = document.createElement('div');
                commentSection.classList.add('comments-section');

                // Render existing comments
                const commentsContainer = document.createElement('div');
                commentsContainer.classList.add('comments');
                if (post.comments) {
                    post.comments.forEach(comment => {
                        const commentElement = document.createElement('div');
                        commentElement.classList.add('comment');
                        commentElement.innerHTML = `<strong>${comment.userName}</strong> ${comment.text}`;
                        commentsContainer.appendChild(commentElement);
                    });
                }

                commentSection.appendChild(commentsContainer);

                // Comment input (hidden by default)
                const commentInput = document.createElement('input');
                commentInput.type = 'text';
                commentInput.placeholder = 'Add a comment...';
                commentInput.classList.add('comment-input');
                commentInput.style.display = 'none';
                commentSection.appendChild(commentInput);

                postElement.appendChild(commentSection);

                // Add to home feed
                postFeed.appendChild(postElement);

                // Event listeners for like and comment
                likeButton.addEventListener('click', async () => {
                    const action = post.liked ? 'unlike' : 'like';
                    const result = await handleLikeAction(post._id, action);
                    if (result.success) {
                        post.liked = !post.liked; // Toggle like status
                        post.likeCount = result.likeCount; // Update like count
                        likeButton.textContent = `❤️ ${post.likeCount}`;
                    }
                });

                commentButton.addEventListener('click', () => {
                    commentInput.style.display = 'block';
                    commentInput.focus();
                });

                commentInput.addEventListener('keydown', async (event) => {
                    if (event.key === 'Enter' && commentInput.value.trim() !== '') {
                        const commentText = commentInput.value.trim();

                        // Dynamically add the comment to the post
                        const newComment = document.createElement('div');
                        newComment.classList.add('comment');
                        newComment.innerHTML = `<strong>${profile_username.innerText}</strong> ${commentText}`;
                        commentsContainer.appendChild(newComment);

                        // Clear input field
                        commentInput.value = '';
                        commentInput.style.display = 'none';

                        // Send comment to the server
                        await handlePostComment(post._id, commentText);
                    }
                });
            });
        }
    } catch (error) {
        console.error("Error loading posts:", error);
    }
}

// function to render posts on the user profile
async function loadProfilePageData() {
    try {
        const response = await fetch('/M00908974/contents');
        const data = await response.json();

        if (data.posts) {
            profile_posts.innerHTML = ''; // Clear the profile posts

            data.posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.classList.add('post');
                postElement.id = `post-${post._id}`;
                postElement.style.position = 'relative'; // For positioning the delete button

                // Add username at the top
                const usernameHeader = document.createElement('div');
                usernameHeader.classList.add('post-header');
                usernameHeader.textContent = post.userName;
                postElement.appendChild(usernameHeader);

                // Add delete button for the current user's posts
                if (post.userName === profile_username.innerText) {
                    const deleteButton = createDeleteButton(post._id);
                    postElement.appendChild(deleteButton);
                }

                // Add image if exists
                if (post.imageUrl) {
                    const img = document.createElement('img');
                    img.src = post.imageUrl;
                    img.alt = 'User Post';
                    img.classList.add('post-image');
                    postElement.appendChild(img);
                }

                // Add caption with username
                if (post.caption) {
                    const captionContainer = document.createElement('div');
                    captionContainer.classList.add('post-caption');
                    captionContainer.innerHTML = `<strong>${post.userName}</strong> ${post.caption}`;
                    postElement.appendChild(captionContainer);
                }

                // Add to profile posts only
                if (post.userName === profile_username.innerText) {
                    profile_posts.appendChild(postElement);
                }
            });
        }
    } catch (error) {
        console.error("Error loading profile posts:", error);
    }
}

// function  to like posts
async function handleLikeAction(postId, action) {
    try {
        const response = await fetch(`/M00908974/contents?postId=${postId}&action=${action}`, {
            method: 'GET',
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error liking/unliking post:", error);
    }
}
 
// function to post a comment
async function handlePostComment(postId, commentText) {
    try {
        const data = {
            postId: postId,
            comment: commentText
        };
        console.log('Sending comment data:', data); 
        const response = await fetch('/M00908974/contents/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const responseData = await response.json();
        return responseData;
    } catch (error) {
        console.error("Error posting comment:", error);
    }
}


// follow/ unfollow users 
async function followUser(userName, buttonElement) {
    try {
        const response = await fetch("/M00908974/follow", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userToFollow: userName }),
        });

        const result = await response.json();

        if (response.ok && result.follow) {
            buttonElement.innerText = "Unfollow"; // Update button text
            buttonElement.dataset.state = "following"; // Update state
        } else {
            alert(result.message || "Failed to follow user.");
        }
    } catch (error) {
        console.error("Error following user:", error);
        alert("An error occurred while trying to follow the user.");
    }
}

async function unfollowUser(userName, buttonElement) {
    try {
        const response = await fetch("/M00908974/follow", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userToUnfollow: userName }),
        });

        const result = await response.json();

        if (response.ok && result.unfollow) {
            buttonElement.innerText = "Follow"; // Update button text
            buttonElement.dataset.state = "not-following"; // Update state
        } else {
            alert(result.message || "Failed to unfollow user.");
        }
    } catch (error) {
        console.error("Error unfollowing user:", error);
        alert("An error occurred while trying to unfollow the user.");
    }
}

// switching between follow and unfollow button
function toggleFollow(event) {
    const buttonElement = event.target; // Get the button that was clicked
    const userName = buttonElement.dataset.username; // Get the username from the data attribute

    if (buttonElement.dataset.state === "not-following") {
        followUser(userName, buttonElement); // Call the follow function
    } else if (buttonElement.dataset.state === "following") {
        unfollowUser(userName, buttonElement); // Call the unfollow function
    } else {
        console.error("Unexpected button state:", buttonElement.dataset.state);
    }
}


//Functions to handle searches
// switch between searching for users and searching for content
function toggleSearch(event) {
    const typeSearch = document.getElementById("typeSearch").value;
    const query = document.getElementById("searchContent").value.trim(); 
    if (!query) {
        console.log("Search query is empty.");
        return;
    }

    const searchResultsContainer = document.getElementById("search-results");
    searchResultsContainer.innerHTML = "";

    if (typeSearch === "user") {
        handleSearch(event); 
    } else if (typeSearch === "content") {
        handleContentSearch(event); 
    } else {
        console.error("Invalid search type selected.");
    }
}

// searching for users
async function handleSearch(event) {
    const query = event.target.value.trim(); // Get the search query from the input field

    const searchResultsContainer = document.getElementById("search-results");
    searchResultsContainer.innerHTML = ""; // Clear previous results

    if (!query) return;

    try {
        const response = await fetch(`/M00908974/users/search?query=${encodeURIComponent(query)}`);
        console.log(encodeURIComponent(query));
        if (!response.ok) {
            if (response.status === 404) {
                searchResultsContainer.innerHTML = "<p>No users found.</p>";
                return;
            }
            throw new Error(`Search failed. Status: ${response.status}`);
        }

        const { users } = await response.json();

        // Dynamically create user cards for each result
        users.forEach((user) => {
            const userCard = createUserCard(user);
            searchResultsContainer.appendChild(userCard);
        });
    } catch (error) {
        console.error("Error fetching search results:", error);
        searchResultsContainer.innerHTML = "<p>An error occurred while searching for users.</p>";
    }
}


// searching for content
async function handleContentSearch(event) {
    const query = event.target.value.trim(); // Get the search query from the input field

    const contentSearchResults = document.getElementById("search-results");
    contentSearchResults.innerHTML = ""; // Clear previous results

    if (!query) return; // Do not send a request if the query is empty

    try {
        // Fetch posts matching the search query
        const response = await fetch(
            `/M00908974/contents/search?keyword=${encodeURIComponent(query)}`
        );

        if (!response.ok) {
            if (response.status === 404) {
                contentSearchResults.innerHTML = "<p>No posts found.</p>";
                return;
            }
            throw new Error(`Search failed. Status: ${response.status}`);
        }

        const data = await response.json();

        // Iterate over search results and display each post
        data.results.forEach((post) => {
            const postElement = createSearchContentPost(post);
            contentSearchResults.appendChild(postElement);
        });
    } catch (error) {
        console.error("Error fetching search results:", error);
        contentSearchResults.innerHTML =
            "<p>An error occurred while searching for posts.</p>";
    }
}


function createUserCard(user) {
    const userCard = document.createElement('div');
    userCard.classList.add('user-card');
    userCard.id = `user-${user.userName}`;

    const userNameElement = document.createElement('h3');
    userNameElement.textContent = `${user.userName}`;

    const followButton = document.createElement('button');
    followButton.classList.add('follow-btn');
    followButton.dataset.username = user.userName; // Store the username

    // Set button text and state based on `isFollowing`
    if (user.isFollowing) {
        followButton.innerText = "Unfollow";
        followButton.dataset.state = "following";
    } else {
        followButton.innerText = "Follow";
        followButton.dataset.state = "not-following";
    }

    followButton.onclick = toggleFollow; // Attach event listener

    userCard.appendChild(userNameElement);
    userCard.appendChild(followButton);

    return userCard;
}

function createSearchContentPost(post) {
    const postElement = document.createElement("div");
    postElement.classList.add("post");

    // Add username header
    const usernameHeader = document.createElement("div");
    usernameHeader.classList.add("post-header");
    usernameHeader.textContent = post.userName;
    postElement.appendChild(usernameHeader);

    // Add image if it exists
    if (post.imageUrl) {
        const img = document.createElement("img");
        img.src = post.imageUrl;
        img.alt = "Post Image";
        img.classList.add("post-image");
        postElement.appendChild(img);
    }

    // Add caption
    if (post.caption) {
        const captionContainer = document.createElement("div");
        captionContainer.classList.add("post-caption");
        captionContainer.innerHTML = `<strong>${post.userName}</strong> ${post.caption}`;
        postElement.appendChild(captionContainer);
    }

    // Add like and comment buttons
    const actionButtons = document.createElement("div");
    actionButtons.classList.add("post-actions");

    const likeButton = document.createElement("button");
    likeButton.textContent = `❤️ Like (${post.likeCount || 0})`;
    likeButton.classList.add("like-button");
    actionButtons.appendChild(likeButton);

    const commentButton = document.createElement("button");
    commentButton.textContent = "💬 Comment";
    commentButton.classList.add("comment-button");
    actionButtons.appendChild(commentButton);

    postElement.appendChild(actionButtons);

    // Handle Like Button Action
    likeButton.addEventListener("click", async () => {
        const action = post.liked ? "unlike" : "like";
        const result = await handleLikeAction(post._id, action);
        if (result.success) {
            post.liked = !post.liked; // Toggle like status
            post.likeCount = result.likeCount; // Update like count
            likeButton.textContent = `❤️ Like (${post.likeCount})`;
        }
    });

    // Add comments section
    const commentSection = document.createElement("div");
    commentSection.classList.add("comments-section");

    const commentsContainer = document.createElement("div");
    commentsContainer.classList.add("comments");

    // Add existing comments
    if (post.comments) {
        post.comments.forEach((comment) => {
            const commentElement = document.createElement("div");
            commentElement.classList.add("comment");
            commentElement.innerHTML = `<strong>${comment.userName}</strong> ${comment.text}`;
            commentsContainer.appendChild(commentElement);
        });
    }

    commentSection.appendChild(commentsContainer);

    // Add comment input field
    const commentInput = document.createElement("input");
    commentInput.type = "text";
    commentInput.placeholder = "Add a comment...";
    commentInput.classList.add("comment-input");
    commentInput.addEventListener("keydown", async (event) => {
        if (event.key === "Enter" && commentInput.value.trim() !== "") {
            const commentText = commentInput.value.trim();

            // Add the comment locally
            const newComment = document.createElement("div");
            newComment.classList.add("comment");
            newComment.innerHTML = `<strong>${profile_username.innerText}</strong> ${commentText}`;
            commentsContainer.appendChild(newComment);

            // Clear input field
            commentInput.value = "";

            // Send the comment to the server
            await handlePostComment(post._id, commentText);
        }
    });

    commentSection.appendChild(commentInput);
    postElement.appendChild(commentSection);

    return postElement;
}


// handle notifications
async function fetchNotifications() {
    try {
        const response = await fetch('/M00908974/notifications'); 
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const notificationsList = document.getElementById('notificationsList');

        notificationsList.innerHTML = ''; // Clear existing notifications

        if (data && data.notifications && Array.isArray(data.notifications)) {
            data.notifications.forEach(notification => {
                const notificationItem = document.createElement('li');
                notificationItem.classList.add('notification-item');

                notificationItem.innerHTML = `<span>${notification.message}</span>`;


                notificationsList.appendChild(notificationItem);
            });
        } else {
            notificationsList.innerHTML = '<li>No notifications available.</li>';
        }

    } catch (error) {
        console.error('Error fetching notifications:', error);
    }
}

document.getElementById('notificationsBtn').addEventListener('click', () => {
    const notificationsSidebar = document.getElementById('notificationsSidebar');
    notificationsSidebar.classList.toggle('active');
    if (notificationsSidebar.classList.contains('active')) {
        fetchNotifications();
    }
});


// Call fetchNotifications when the page loads or when the user logs in
window.addEventListener('load', fetchNotifications);



