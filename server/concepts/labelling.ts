import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError } from "./errors";

export interface LabelDoc extends BaseDoc {
  item: ObjectId;
  label: Array<string>;
}

/**
 * concept: Labelling [Item]
 */
export default class LabellingConcept {
  public readonly labels: DocCollection<LabelDoc>;

  /**
   * Make an instance of Posting.
   */
  constructor(collectionName: string) {
    this.labels = new DocCollection<LabelDoc>(collectionName);
  }

  async getCorrspondingLabelDoc(item: ObjectId) {
    const labelsOfItem = await this.labels.readMany({ item });
    if (labelsOfItem.length === 0) {
      return null;
    } else if (labelsOfItem.length === 1) {
      return labelsOfItem[0];
    } else {
      throw new LabelInvariantBrokenError(item);
    }
  }

  async appendLabel(item: ObjectId, content: string) {
    var targetLabelDoc = await this.getCorrspondingLabelDoc(item);
    if (targetLabelDoc === null) {
      const label = await this.labels.createOne({ item, label: [content] });
      return { msg: `This is your first label for this item! You labelled ${content}` };
    } else {
      targetLabelDoc.label.push(content);
      return { msg: `Successfully added label ${targetLabelDoc.label} to this item!` };
    }
  }

  async checkLabel(item: ObjectId) {
    const targetLabelDoc = await this.getCorrspondingLabelDoc(item);
    return targetLabelDoc;
  }

  //   async removeLabelByContent(item: ObjectId, content: string) {
  //     const targetLabelDoc = await this.getCorrspondingLabelDoc(item);
  //     if (targetLabelDoc === null) {
  //       const label = await this.labels.createOne({ item, label: [content] });
  //       return { msg: `This is your first label for this item! You labelled ${content}` };
  //     } else {
  //       targetLabelDoc.label.push(content);
  //       return { msg: `Successfully added label ${content} to this item!` };
  //     }
  //   }
}

export class LabelInvariantBrokenError extends NotAllowedError {
  constructor(item_id: ObjectId) {
    super(`LabelDoc rep invariant is broken. Check why there are more than one label objects correspond to the same item ${item_id.toString()}.`);
  }
}
