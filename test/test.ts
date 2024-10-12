import dotenv from "dotenv";
import process from "process";
import assert = require("assert");

// Make sure we are in test mode!
process.env.TEST = "true";

// Also need to load the .env file
dotenv.config();

import type { SessionDoc } from "../server/concepts/sessioning";

// Test mode must be set before importing the routes
import { app } from "../server/routes";

import db, { client } from "../server/db";
if (db.databaseName !== "test-db") {
  throw new Error("Not connected to test database");
}

// Actual sessions are created by Express, here we use a mock session
function getEmptySession() {
  return { cookie: {} } as SessionDoc;
}

// Before each test...
beforeEach(async () => {
  // Drop the test database
  await db.dropDatabase();

  // Add some default users we can use
  await app.createUser(getEmptySession(), "alice", "alice123");
  await app.createUser(getEmptySession(), "bob", "bob123");
  await app.createUser(getEmptySession(), "chris", "chris123");
});

// After all tests are done...
after(async () => {
  // Close the database connection so that Node exits
  await client.close();
});

// describe("Create a user and log in", () => {
//   it("should create a user and log in, checks password", async () => {
//     const session = getEmptySession();

//     const created = await app.createUser(session, "barish", "1234");
//     assert(created.user);
//     await assert.rejects(app.logIn(session, "barish", "123"));
//     await app.logIn(session, "barish", "1234");
//     await assert.rejects(app.logIn(session, "barish", "1234"), "Should not be able to login while already logged-in");
//   });

//   it("duplicate username should fail", async () => {
//     const session = getEmptySession();

//     const created = await app.createUser(session, "barish", "1234");
//     assert(created.user);
//     await assert.rejects(app.createUser(session, "barish", "1234"));
//   });

//   it("get invalid username should fail", async () => {
//     await assert.rejects(app.getUser(""), "Username should be at least 1 character long");
//     await app.getUser("alice");
//   });
// });

// describe("Friend concept testing", () => {
//   it("Adds two friends and check", async () => {
//     const session = getEmptySession();
//     await app.logIn(session, "alice", "alice123");
//     await app.sendFriendRequest(session, "bob");
//     await app.logOut(session);
//     await app.logIn(session, "bob", "bob123");
//     await app.acceptFriendRequest(session, "alice");
//     assert((await app.getFriends(session)).includes("alice"));
//   });

//   it("checks reject friend invitation, should not become friends", async () => {
//     const session = getEmptySession();
//     await app.logIn(session, "alice", "alice123");
//     await app.sendFriendRequest(session, "bob");
//     await app.logOut(session);
//     await app.logIn(session, "bob", "bob123");
//     await app.rejectFriendRequest(session, "alice");
//     assert(!(await app.getFriends(session)).includes("alice"));
//   });

//   it("checks removal friend invitation", async () => {
//     const session = getEmptySession();
//     await app.logIn(session, "alice", "alice123");
//     await app.sendFriendRequest(session, "bob");
//     await app.removeFriendRequest(session, "bob");
//     await app.logOut(session);

//     await app.logIn(session, "bob", "bob123");
//     await assert.rejects(app.removeFriendRequest(session, "alice"));
//   });

//   it("does not give up, keeps sending request after turned down, eventually friends", async () => {
//     const session = getEmptySession();
//     const session2 = getEmptySession();

//     await app.logIn(session, "alice", "alice123");
//     await app.logIn(session2, "bob", "bob123");

//     await app.sendFriendRequest(session, "bob");
//     await app.rejectFriendRequest(session2, "alice");

//     await app.sendFriendRequest(session, "bob");
//     await app.acceptFriendRequest(session2, "alice");

//     assert((await app.getFriends(session2)).includes("alice"));
//   });

//   it("deleted friends :(", async () => {
//     const session = getEmptySession();
//     await app.logIn(session, "alice", "alice123");
//     await app.sendFriendRequest(session, "bob");
//     await app.logOut(session);
//     await app.logIn(session, "bob", "bob123");
//     await app.acceptFriendRequest(session, "alice");
//     await app.removeFriend(session, "alice");
//     assert(!(await app.getFriends(session)).includes("alice"));
//   });

//   it("checks multiple friend requests", async () => {
//     const session = getEmptySession();
//     await app.logIn(session, "alice", "alice123");
//     await app.sendFriendRequest(session, "bob");
//     await assert.rejects(app.sendFriendRequest(session, "bob"));
//   });
// });

// describe("interface testing", async () => {
//   it("makes sure user starts at focus mode", async () => {
//     const session = getEmptySession();
//     await app.logIn(session, "alice", "alice123");
//     assert((await app.checkInterface(session, "alice"))["interfaceString"] === "Focus");
//   });

//   it("let users set between modes", async () => {
//     const session = getEmptySession();
//     await app.logIn(session, "alice", "alice123");
//     assert((await app.setInterface(session, "Leisure"))["interfaceType"] === "Leisure");
//   });

//   it("rejects invalid interface name", async () => {
//     const session = getEmptySession();
//     await app.logIn(session, "alice", "alice123");
//     await assert.rejects(app.setInterface(session, "NotRealInterface"));
//   });

//   it("rejects poking if friend is focusing", async () => {
//     const session = getEmptySession();
//     await app.logIn(session, "alice", "alice123");
//     await app.sendFriendRequest(session, "bob");
//     await app.logOut(session);
//     await app.logIn(session, "bob", "bob123");
//     await app.acceptFriendRequest(session, "alice");

//     assert((await app.poke(session, "alice", "YO"))["msg"] == "Nah, your friend alice is locked in!");
//   });

//   it("pokes friend and say YO", async () => {
//     const session = getEmptySession();
//     await app.logIn(session, "alice", "alice123");
//     await app.setInterface(session, "Leisure");
//     await app.sendFriendRequest(session, "bob");

//     const session2 = getEmptySession();
//     await app.logIn(session2, "bob", "bob123");
//     await app.acceptFriendRequest(session2, "alice");
//     assert((await app.poke(session2, "alice", "YO"))["msg"] == "You just poked alice and told your friend YO!");
//   });

//   it("rejects looking at non-friend interface", async () => {
//     const session = getEmptySession();
//     await app.logIn(session, "alice", "alice123");
//     await app.setInterface(session, "Leisure");

//     const session2 = getEmptySession();
//     await app.logIn(session2, "bob", "bob123");

//     assert.rejects(app.checkInterface(session2, "alice"));
//   });
// });

// describe("Posting", async () => {
//   it("create posts", async () => {
//     const session = getEmptySession();
//     await app.logIn(session, "alice", "alice123");
//     await app.createPost(session, "1");
//     await app.createPost(session, "2");
//     await app.createPost(session, "3");
//     assert((await app.getPosts("alice")).length === 3);
//   });

//   it("checks delete posts", async () => {
//     const session = getEmptySession();
//     await app.logIn(session, "alice", "alice123");
//     const toDelete = (await app.createPost(session, "1"))["id"];
//     await app.createPost(session, "2");
//     await app.deletePost(session, toDelete.toString());
//     assert((await app.getPosts("alice")).length === 1);
//   });

//   it("rejects wrong posts", async () => {
//     const session = getEmptySession();
//     await app.logIn(session, "alice", "alice123");
//     const toDelete = (await app.createPost(session, "1"))["id"];
//     await app.createPost(session, "2");

//     const session2 = getEmptySession();
//     await app.logIn(session2, "bob", "bob123");
//     const toDelete2 = (await app.createPost(session2, "1"))["id"];
//     await assert.rejects(app.deletePost(session, toDelete2.toString()));
//   });

//   it("checks posts updating", async () => {
//     const session = getEmptySession();
//     await app.logIn(session, "alice", "alice123");
//     const toUpdate = (await app.createPost(session, "1"))["id"];
//     await app.updatePost(session, toUpdate.toString(), "2");
//     assert((await app.getPosts("alice"))[0]["content"] === "2");
//   });
// });

// describe("Labelling", async () => {
//   it("labels the post", async () => {
//     const session = getEmptySession();
//     await app.logIn(session, "alice", "alice123");
//     const postID = (await app.createPost(session, "1"))["id"];
//     await app.addLabel(session, postID.toString(), "first post");
//     assert((await app.checkLabel(session, postID.toString()))["msg"] === "Labels in this post: first post.");
//   });

//   it("multiple labels", async () => {
//     const session = getEmptySession();
//     await app.logIn(session, "alice", "alice123");
//     const postID = (await app.createPost(session, "1"))["id"];

//     await app.addLabel(session, postID.toString(), "label1");
//     await app.addLabel(session, postID.toString(), "label2");
//     assert((await app.checkLabel(session, postID.toString()))["msg"] === "Labels in this post: label1,label2.");
//   });

//   it("delete label by index", async () => {
//     const session = getEmptySession();
//     await app.logIn(session, "alice", "alice123");
//     const postID = (await app.createPost(session, "1"))["id"];

//     await app.addLabel(session, postID.toString(), "label1");
//     await app.addLabel(session, postID.toString(), "label2");
//     await app.addLabel(session, postID.toString(), "label3");
//     await app.deleteLabelByIndex(session, postID.toString(), "2");
//     assert((await app.checkLabel(session, postID.toString()))["msg"] === "Labels in this post: label1,label3.");
//   });

//   it("delete label by index, invalid index", async () => {
//     const session = getEmptySession();
//     await app.logIn(session, "alice", "alice123");
//     const postID = (await app.createPost(session, "1"))["id"];

//     await app.addLabel(session, postID.toString(), "label1");
//     await app.addLabel(session, postID.toString(), "label2");
//     await app.addLabel(session, postID.toString(), "label3");
//     await assert.rejects(app.deleteLabelByIndex(session, postID.toString(), "2.5"));
//     await assert.rejects(app.deleteLabelByIndex(session, postID.toString(), "-1"));
//   });

//   it("delete label by content", async () => {
//     const session = getEmptySession();
//     await app.logIn(session, "alice", "alice123");
//     const postID = (await app.createPost(session, "1"))["id"];

//     await app.addLabel(session, postID.toString(), "label1");
//     await app.addLabel(session, postID.toString(), "label2");
//     await app.addLabel(session, postID.toString(), "label1");
//     await app.deleteLabelByContent(session, postID.toString(), "label1");
//     assert((await app.checkLabel(session, postID.toString()))["msg"] === "Labels in this post: label2.");
//   });
// });

describe("Messaging", async () => {
  it("allows sending when the author is both sender and receiver's friend", async () => {
    const session = getEmptySession();
    const session2 = getEmptySession();
    const session3 = getEmptySession();
    await app.logIn(session, "alice", "alice123");
    await app.logIn(session2, "bob", "bob123");
    await app.logIn(session3, "chris", "chris123");

    await app.sendFriendRequest(session2, "chris");
    await app.acceptFriendRequest(session3, "bob");

    await app.sendFriendRequest(session3, "alice");
    await app.acceptFriendRequest(session, "chris");

    const postID = (await app.createPost(session3, "Post from Chris"))["id"];

    await app.sendMessage(session, "bob", postID.toString(), "see the post from Chris?");
  });

  it("allows sending when the author is both sender and receiver's friend", async () => {
    const session = getEmptySession();
    const session2 = getEmptySession();
    const session3 = getEmptySession();
    await app.logIn(session, "alice", "alice123");
    await app.logIn(session2, "bob", "bob123");
    await app.logIn(session3, "chris", "chris123");

    await app.sendFriendRequest(session, "bob");
    await app.acceptFriendRequest(session2, "alice");

    await app.sendFriendRequest(session2, "chris");
    await app.acceptFriendRequest(session3, "bob");

    const postID = (await app.createPost(session3, "Post from Chris"))["id"];

    await assert.rejects(app.sendMessage(session, "bob", postID.toString(), "see the post from Chris?"));
  });

  it("check if labels is working", async () => {
    const session = getEmptySession();
    const session2 = getEmptySession();
    const session3 = getEmptySession();
    await app.logIn(session, "alice", "alice123");
    await app.logIn(session2, "bob", "bob123");
    await app.logIn(session3, "chris", "chris123");

    await app.sendFriendRequest(session2, "chris");
    await app.acceptFriendRequest(session3, "bob");

    await app.sendFriendRequest(session3, "alice");
    await app.acceptFriendRequest(session, "chris");

    const postID1 = (await app.createPost(session3, "Post1 from Chris"))["id"];
    const postID2 = (await app.createPost(session3, "Post2 from Chris"))["id"];

    await app.addLabel(session3, postID1.toString(), "label1");
    await app.addLabel(session3, postID2.toString(), "labe");

    await app.sendMessage(session, "bob", postID1.toString(), "see the post from Chris?");
    await app.sendMessage(session, "bob", postID2.toString(), "see the post from Chris?");

    assert((await app.searchMessageWithLabel(session, "label")).length === 1);
  });

  it("check if deleting labels is working", async () => {
    const session = getEmptySession();
    const session2 = getEmptySession();
    const session3 = getEmptySession();
    await app.logIn(session, "alice", "alice123");
    await app.logIn(session2, "bob", "bob123");
    await app.logIn(session3, "chris", "chris123");

    await app.sendFriendRequest(session2, "chris");
    await app.acceptFriendRequest(session3, "bob");

    await app.sendFriendRequest(session3, "alice");
    await app.acceptFriendRequest(session, "chris");

    const postID1 = (await app.createPost(session3, "Post1 from Chris"))["id"];
    const postID2 = (await app.createPost(session3, "Post2 from Chris"))["id"];

    const messageID = (await app.sendMessage(session, "bob", postID1.toString(), "see the post from Chris?"))["id"];
    await app.sendMessage(session, "bob", postID2.toString(), "see the post from Chris?");

    await app.deleteMessage(session, messageID.toString());
    // assert((await app.getAllMessages(session)).length === 1);
  });
});

/*
 * As you add more tests, remember to put them inside `describe` blocks.
 */
