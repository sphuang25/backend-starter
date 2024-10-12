import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError } from "./errors";

export interface MessageRecordDoc extends BaseDoc {
  sender: ObjectId;
  receiver: ObjectId;
  message: ObjectId;
}

export interface Message extends BaseDoc {
  item: ObjectId | undefined;
  words: string | undefined;
}

/**
 * concept: Messaging [User, Item]
 */
export default class MessagingConcept {
  public readonly messageRecords: DocCollection<MessageRecordDoc>;
  public readonly messages: DocCollection<Message>;

  /**
   * Make an instance of Posting.
   */
  constructor(collectionName: string) {
    this.messageRecords = new DocCollection<MessageRecordDoc>(collectionName);
    this.messages = new DocCollection<Message>(`${collectionName}-bases`);
  }

  async createMessage(item: ObjectId | undefined, words: string | undefined) {
    const messageContent = await this.messages.createOne({ item: item, words: words });
    return messageContent;
  }

  getAllMessage() {
    return this.messageRecords;
  }

  getAllMessageContents() {
    return this.messages;
  }

  async getMessageItem(messageID: ObjectId) {
    const message = await this.messages.readOne({ _id: messageID });

    if (message === null) {
      throw new MessageNotExistError(messageID);
    }

    const itemID: ObjectId | undefined = message.item;
    // throw new MessageNotExistError(message);
    return { msg: message };
  }

  async sendMessage(sender: ObjectId, receiver: ObjectId, message: ObjectId) {
    await this.messageRecords.createOne({ sender: sender, receiver: receiver, message: message });

    return { msg: `Message ${message} is sent from ${sender} to ${receiver}.` };
  }

  async deleteMessage(messageID: ObjectId) {
    const deleteResult = await this.messageRecords.deleteMany({ message: messageID });
    if (deleteResult.deletedCount === 0) {
      throw new MessageRecordNotExistError(messageID);
    } else if (deleteResult.deletedCount === 1) {
      return { msg: `Message ${messageID} item is permanently removed.` };
    } else {
      throw new MessageInvariantBrokenError(messageID);
    }
  }

  async getMessageRecord(messageID: ObjectId) {
    const messageContents = await this.messageRecords.readMany({ message: messageID });
    if (messageContents.length === 0) {
      throw new MessageRecordNotExistError(messageID);
    } else if (messageContents.length === 1) {
      return messageContents[0];
    } else {
      throw new MessageInvariantBrokenError(messageID);
    }
  }

  async getMessageSender(messageID: ObjectId) {
    const sender = (await this.getMessageRecord(messageID)).sender;
    return sender;
  }

  async getMessageReceiver(messageID: ObjectId) {
    const receiver = (await this.getMessageRecord(messageID)).receiver;
    return receiver;
  }

  async getAllMessageRecordUser(userID: ObjectId) {
    const messageRecordsUser = await this.messageRecords.readMany({ $or: [{ sender: userID }, { receiver: userID }] });
    return messageRecordsUser;
  }

  async getAllMessageUser(userID: ObjectId) {
    const messageRecordsUser = await this.getAllMessageRecordUser(userID);
    const messagesUser = messageRecordsUser.map((x) => x.message);
    return messagesUser;
  }

  async getAllItemUser(userID: ObjectId) {
    var itemArray = new Array<ObjectId>();
    const messagesUser = await this.getAllMessageUser(userID);
    const itemsUser = await this.messages.readMany({ _id: { $in: messagesUser } });

    for (const itemUser of itemsUser) {
      if (itemUser.item !== undefined) {
        itemArray.push(itemUser.item);
      }
    }

    return itemArray;
  }

  async getAllSentMessages(userID: ObjectId) {
    const messageContentsOfUser = await this.messageRecords.readMany({ sender: userID });
    return messageContentsOfUser;
  }

  async ownsMessage(userID: ObjectId, messageID: ObjectId) {
    const messageContent = await this.getMessageRecord(messageID);
    return messageContent.sender.toString() === userID.toString() || messageContent.receiver.toString() === userID.toString();
  }
}

export class MessageInvariantBrokenError extends NotAllowedError {
  constructor(item_id: ObjectId) {
    super(`There exists message content ${item_id} that has multiple occurance in message.`);
  }
}

export class MessageRecordNotExistError extends BadValuesError {
  constructor(messageID: ObjectId) {
    super(`The message content ${messageID} does not exist in the record.`);
  }
}

export class MessageNotExistError extends BadValuesError {
  constructor(messageID: ObjectId) {
    super(`The message id ${messageID} does not exist.`);
  }
}
