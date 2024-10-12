import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError } from "./errors";

export enum InterfaceType {
  Focus = "Focus",
  Leisure = "Leisure",
}

export interface InterfaceDoc extends BaseDoc {
  user: ObjectId;
  interface: InterfaceType;
}

/**
 * concept: Interface[User]
 */
export default class InterfaceConcept {
  public readonly interfaces: DocCollection<InterfaceDoc>;

  /**
   * Make an instance of Posting.
   */
  constructor(collectionName: string) {
    this.interfaces = new DocCollection<InterfaceDoc>(collectionName);
  }

  async createInterface(userID: ObjectId, interfaceForUser: InterfaceType = InterfaceType.Focus) {
    const checkIfInInterface = await this.interfaces.readOne({ user: userID });
    if (checkIfInInterface !== null) {
      throw new InterfaceAlreadyCreatedError(userID);
    }
    const interfaceID = await this.interfaces.createOne({ user: userID, interface: interfaceForUser });
    return interfaceID;
  }

  async getInterfaceEnumBystring(interfaceString: string) {
    const interfaceValue = InterfaceType[interfaceString as keyof typeof InterfaceType];
    if (interfaceValue === undefined) {
      throw new StringNotDefinedInterface(interfaceString);
    }
    return interfaceValue;
  }

  async switchInterface(userID: ObjectId, interfaceForUser: InterfaceType) {
    const checkIfInInterface = await this.interfaces.readOne({ user: userID });
    if (checkIfInInterface === null) {
      throw new UserHasNoInterfaceError(userID);
    }
    const interfaceID = await this.interfaces.partialUpdateOne({ user: userID }, { interface: interfaceForUser });
    return interfaceID;
  }

  async getInterface(userID: ObjectId) {
    const interfaceDoc = await this.interfaces.readOne({ user: userID });
    if (interfaceDoc === null) {
      throw new UserHasNoInterfaceError(userID);
    }
    return interfaceDoc.interface;
  }

  async getInterfaceOwner(interfaceID: ObjectId) {
    const getInterfaceDoc = await this.interfaces.readOne({ _id: interfaceID });
    if (getInterfaceDoc === null) {
      throw new SearchNotDefinedInterfaceError(interfaceID);
    }
    return getInterfaceDoc.user;
  }
}

export class InterfaceAlreadyCreatedError extends BadValuesError {
  constructor(public readonly userID: ObjectId) {
    super(`The user ${userID} already has interface data!`);
  }
}

export class UserHasNoInterfaceError extends BadValuesError {
  constructor(public readonly userID: ObjectId) {
    super(`The user ${userID} does not have interface data!`);
  }
}

export class SearchNotDefinedInterfaceError extends BadValuesError {
  constructor(public readonly interfaceID: ObjectId) {
    super(`The user ${interfaceID} does not have interface data!`);
  }
}

export class StringNotDefinedInterface extends BadValuesError {
  constructor(public readonly interfaceString: string) {
    super(`${interfaceString} is not a valid interface name!`);
  }
}
