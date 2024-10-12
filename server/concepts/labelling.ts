import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError } from "./errors";

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

  async getLabelsOfItem(item: ObjectId) {
    /*
     * make sure each item only correspond to one label object in this.labels
     * Like a checkRep
     */
    const labelsOfItem = await this.labels.readMany({ item });
    if (labelsOfItem.length > 1) {
      throw new LabelInvariantBrokenError(item);
    }
    return labelsOfItem;
  }

  async getLabelDoc(item: ObjectId) {
    await this.getLabelsOfItem(item);
    const labelsOfItem = await this.labels.readOne({ item });
    if (labelsOfItem === null) {
      throw new NotLabelledError(item);
    }
    return labelsOfItem;
  }

  async appendLabel(item: ObjectId, content: string) {
    var labelsOfItem = await this.getLabelsOfItem(item);

    if (labelsOfItem.length === 0) {
      const label = await this.labels.createOne({ item, label: [content] });
      return { msg: `First label for this item! You labelled ${content}` };
    } else {
      const targetLabelDoc = await this.getLabelDoc(item);
      var listOfLabels = targetLabelDoc.label;
      listOfLabels.push(content);
      await this.labels.partialUpdateOne({ item }, { label: listOfLabels });
      return { msg: `Added ${listOfLabels.length}-th label: ${content}!` };
    }
  }

  async removeLabelByIndex(item: ObjectId, index: string) {
    const targetLabelDoc = await this.getLabelDoc(item);

    const numIdx = parseInt(index) - 1;

    const toRemove = targetLabelDoc.label[numIdx];

    if (Number(index) !== parseInt(index) || toRemove === undefined) {
      throw new LabelIndexError(item, targetLabelDoc.label.length, index);
    }

    targetLabelDoc.label.splice(numIdx, 1);
    await this.labels.partialUpdateOne({ item }, { label: targetLabelDoc.label });
    return { msg: `The ${index}-th label: ${toRemove} is now removed!` };
  }

  async removeLabelByContent(item: ObjectId, content: string) {
    const targetLabelDoc = await this.getLabelDoc(item);
    var newLabelArray = targetLabelDoc.label.filter((x) => x !== content);
    await this.labels.partialUpdateOne({ item }, { label: newLabelArray });
    return { msg: `All ${content} labels are now removed!` };
  }

  async searchLabel(itemsToSearch: Array<ObjectId>, label: string) {
    var itemHasThisLabel = new Array<ObjectId>();

    for (const item of itemsToSearch) {
      const labelDoc = await this.getLabelDoc(item);
      for (const labelOfItem of labelDoc.label) {
        if (labelOfItem.includes(label)) {
          itemHasThisLabel.push(item);
          break;
        }
      }
    }

    return itemHasThisLabel;
  }
}

export class LabelInvariantBrokenError extends NotAllowedError {
  constructor(item_id: ObjectId) {
    super(`LabelDoc rep invariant is broken. Check why there are more than one label objects correspond to the same item ${item_id.toString()}.`);
  }
}

export class LabelIndexError extends BadValuesError {
  constructor(item_id: ObjectId, max_idx: number, idx: string) {
    super(`Please select positive integer no larger than ${max_idx}. You selected ${idx}.`);
  }
}

export class NotLabelledError extends BadValuesError {
  constructor(item_id: ObjectId) {
    super(`Item ${item_id.toString()} has no labels yet!`);
  }
}
