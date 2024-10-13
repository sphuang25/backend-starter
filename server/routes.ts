import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Authing, Friending, Interfacing, Labelling, Messaging, Posting, Sessioning } from "./app";
import { SessionDoc } from "./concepts/sessioning";
import Responses from "./responses";

import { z } from "zod";
import { InterfaceType } from "./concepts/interfacing";

/**
 * Web server routes for the app. Implements synchronizations between concepts.
 */
class Routes {
  // Synchronize the concepts from `app.ts`.

  @Router.get("/session")
  async getSessionUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await Authing.getUsers();
  }

  @Router.get("/users/:username")
  @Router.validate(z.object({ username: z.string().min(1) }))
  async getUser(username: string) {
    return await Authing.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: SessionDoc, username: string, password: string) {
    Sessioning.isLoggedOut(session);
    const message = await Authing.create(username, password);
    Interfacing.createInterface(message.id);
    return message;
  }

  @Router.patch("/users/username")
  async updateUsername(session: SessionDoc, username: string) {
    const user = Sessioning.getUser(session);
    return await Authing.updateUsername(user, username);
  }

  @Router.patch("/users/password")
  async updatePassword(session: SessionDoc, currentPassword: string, newPassword: string) {
    const user = Sessioning.getUser(session);
    return Authing.updatePassword(user, currentPassword, newPassword);
  }

  @Router.delete("/users")
  async deleteUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    Sessioning.end(session);
    return await Authing.delete(user);
  }

  @Router.post("/login")
  async logIn(session: SessionDoc, username: string, password: string) {
    const u = await Authing.authenticate(username, password);
    Sessioning.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: SessionDoc) {
    Sessioning.end(session);
    return { msg: "Logged out!" };
  }

  @Router.get("/posts")
  @Router.validate(z.object({ author: z.string().optional() }))
  async getPosts(author?: string) {
    let posts;
    if (author) {
      const id = (await Authing.getUserByUsername(author))._id;
      posts = await Posting.getByAuthor(id);
    } else {
      posts = await Posting.getPosts();
    }
    return Responses.posts(posts);
  }

  @Router.post("/posts")
  async createPost(session: SessionDoc, content: string) {
    const user = Sessioning.getUser(session);
    const created = await Posting.create(user, content);
    return { msg: created.msg, post: await Responses.post(created.post), id: created.postID };
  }

  @Router.patch("/posts/:id")
  async updatePost(session: SessionDoc, id: string, content?: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertAuthorIsUser(oid, user);
    return await Posting.update(oid, content);
  }

  @Router.delete("/posts/:id")
  async deletePost(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertAuthorIsUser(oid, user);
    return Posting.delete(oid);
  }

  @Router.get("/friends")
  async getFriends(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.idsToUsernames(await Friending.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: SessionDoc, friend: string) {
    const user = Sessioning.getUser(session);
    const friendOid = (await Authing.getUserByUsername(friend))._id;
    return await Friending.removeFriend(user, friendOid);
  }

  @Router.get("/friend/requests")
  async getRequests(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Responses.friendRequests(await Friending.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    return await Friending.sendRequest(user, toOid);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    return await Friending.removeRequest(user, toOid);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: SessionDoc, from: string) {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    return await Friending.acceptRequest(fromOid, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: SessionDoc, from: string) {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    return await Friending.rejectRequest(fromOid, user);
  }

  @Router.post("/label/add")
  async addLabel(session: SessionDoc, id: string, content: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertAuthorIsUser(oid, user);

    const label = await Labelling.appendLabel(oid, content);
    return { msg: label.msg };
  }

  @Router.get("/label/check")
  async checkLabel(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertAuthorIsUser(oid, user);

    const label = await Labelling.getLabelDoc(oid);
    return { msg: `Labels in this post: ${label.label}.` };
  }

  @Router.post("/label/removeIdx")
  async deleteLabelByIndex(session: SessionDoc, id: string, labelIdx: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertAuthorIsUser(oid, user);

    const label = await Labelling.removeLabelByIndex(oid, labelIdx);
    return label;
  }

  @Router.delete("/label/removeContent")
  async deleteLabelByContent(session: SessionDoc, id: string, content: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertAuthorIsUser(oid, user);

    const label = await Labelling.removeLabelByContent(oid, content);
    return label;
  }

  @Router.get("/interface/check/:usernameToCheck")
  async checkInterface(session: SessionDoc, usernameToCheck: string) {
    const user = Sessioning.getUser(session);
    const toCheckOid = (await Authing.getUserByUsername(usernameToCheck))._id;
    await Friending.assertFriendsOrSelf(user, toCheckOid);
    const thisInterface = await Interfacing.getInterface(toCheckOid);
    const interfaceString: string = thisInterface;
    return { msg: `User ${usernameToCheck} is on interface ${interfaceString}`, interfaceString: interfaceString };
  }

  @Router.post("/interface/set")
  async setInterface(session: SessionDoc, interfaceType: string) {
    const user = Sessioning.getUser(session);
    const interfaceItem = await Interfacing.getInterfaceEnumBystring(interfaceType);
    Interfacing.switchInterface(user, interfaceItem);
    return { msg: `You now have interface ${interfaceType}.`, interfaceType: interfaceType };
  }

  @Router.post("/interface/poke")
  async poke(session: SessionDoc, username: string, messageString?: string) {
    const user = Sessioning.getUser(session);
    const friend = (await Authing.getUserByUsername(username))._id;
    await Friending.assertFriendsOrSelf(user, friend);
    const friendsInterface = await Interfacing.getInterface(friend);

    if (friendsInterface == InterfaceType.Leisure) {
      const messageStringFinal = messageString === undefined ? "Focus Bro!" : messageString;
      const messageId = await Messaging.createMessage(undefined, messageStringFinal);
      await Messaging.sendMessage(user, friend, messageId);
      return { msg: `You just poked ${username} and told your friend ${messageStringFinal}!` };
    } else {
      return { msg: `Nah, your friend ${username} is locked in!` };
    }
  }

  @Router.get("/message/getAll")
  async getAllMessages(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    const allMessages = await Messaging.getAllMessageUser(user);
    return allMessages;
  }

  @Router.post("/message/send")
  async sendMessage(session: SessionDoc, receiverName: string, messageItemID: string, messageContent: string) {
    const user = Sessioning.getUser(session);

    const receiverID = (await Authing.getUserByUsername(receiverName))._id;
    const messageID = await Messaging.createMessage(messageItemID === undefined ? undefined : new ObjectId(messageItemID), messageContent);
    // this message should be accessible for both sender and receiver
    const itemInMessage = (await Messaging.getMessageItem(messageID))["msg"].item;
    if (itemInMessage !== undefined) {
      const authorOfItem = await Posting.getAuthorOfPost(itemInMessage);
      const userClear = (await Friending.isFriend(authorOfItem, user)) || authorOfItem.toString() == user.toString();
      const receiverClear = (await Friending.isFriend(authorOfItem, receiverID)) || authorOfItem.toString() == receiverID.toString();
      if (!(userClear && receiverClear)) {
        throw new Error(`You cannot share this content (${itemInMessage}) because either one of you are not friends with the author.`);
      }
    }
    await Messaging.sendMessage(user, receiverID, messageID);
    return { msg: `Message ${messageID} sent to ${receiverName}`, id: messageID };
  }

  @Router.get("/message/search")
  async searchMessageWithLabel(session: SessionDoc, label: string) {
    const userID = Sessioning.getUser(session);
    const itemsThisUser = await Messaging.getAllItemUser(userID);
    const messagesWithThisLabel = await Labelling.searchLabel(itemsThisUser, label);
    return messagesWithThisLabel;
  }

  @Router.delete("/message/delete")
  async deleteMessage(session: SessionDoc, messageIDStr: string) {
    const user = Sessioning.getUser(session);
    const messageID = new ObjectId(messageIDStr);
    if (user.toString() == (await Messaging.getMessageSender(messageID)).toString()) {
      await Messaging.deleteMessage(messageID);
    }
  }
}

/** The web app. */
export const app = new Routes();

/** The Express router. */
export const appRouter = getExpressRouter(app);
