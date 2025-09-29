import {
  DeviceType,
  ClickData,
  EventData,
  TagCondition,
  TagConditionOperator,
  TagConditionType,
  TagLogicalOperator,
} from '../types';
import { StateManager } from './state.manager';

interface ConditionMatchContext {
  event: EventData;
  deviceType: DeviceType;
  clickData?: ClickData;
}

export class TagsManager extends StateManager {
  /**
   * Gets matching tag IDs for an event based on configured tag conditions
   */
  getEventTagsIds(event: EventData, deviceType: DeviceType): string[] {
    const tags = this.get('config')?.tags?.filter((tag) => tag.triggerType === event.type) ?? [];

    if (tags.length === 0) {
      return [];
    }

    const context: ConditionMatchContext = {
      event,
      deviceType,
      clickData: event.click_data,
    };

    return tags.filter((tag) => this.evaluateTagConditions(tag, context)).map((tag) => tag.id);
  }

  /**
   * Evaluates all conditions for a tag using logical operators
   */
  private evaluateTagConditions(
    tag: { conditions: TagCondition[]; logicalOperator?: TagLogicalOperator },
    context: ConditionMatchContext,
  ): boolean {
    const { conditions, logicalOperator = TagLogicalOperator.OR } = tag;

    if (!conditions || conditions.length === 0) {
      return false;
    }

    const results = conditions.map((condition: TagCondition) => this.evaluateCondition(condition, context));

    return logicalOperator === TagLogicalOperator.AND ? results.every(Boolean) : results.some(Boolean);
  }

  /**
   * Evaluates a single tag condition
   */
  private evaluateCondition(condition: TagCondition, context: ConditionMatchContext): boolean {
    try {
      switch (condition.type) {
        case TagConditionType.URL_MATCHES:
          return this.matchStringCondition(condition, context.event.page_url);

        case TagConditionType.DEVICE_TYPE:
          return this.matchStringCondition(condition, context.deviceType);

        case TagConditionType.UTM_SOURCE:
          return this.matchStringCondition(condition, context.event.utm?.source ?? '');

        case TagConditionType.UTM_MEDIUM:
          return this.matchStringCondition(condition, context.event.utm?.medium ?? '');

        case TagConditionType.UTM_CAMPAIGN:
          return this.matchStringCondition(condition, context.event.utm?.campaign ?? '');

        case TagConditionType.ELEMENT_MATCHES:
          return context.clickData ? this.matchElementCondition(condition, context.clickData) : false;

        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * Unified string matching logic for all string-based conditions
   */
  private matchStringCondition(condition: TagCondition, value: string): boolean {
    if (
      !value &&
      condition.operator !== TagConditionOperator.EXISTS &&
      condition.operator !== TagConditionOperator.NOT_EXISTS
    ) {
      return false;
    }

    const conditionValue = condition.value.toLowerCase();
    const targetValue = value.toLowerCase();

    switch (condition.operator) {
      case TagConditionOperator.EQUALS:
        return targetValue === conditionValue;

      case TagConditionOperator.CONTAINS:
        return targetValue.includes(conditionValue);

      case TagConditionOperator.STARTS_WITH:
        return targetValue.startsWith(conditionValue);

      case TagConditionOperator.ENDS_WITH:
        return targetValue.endsWith(conditionValue);

      case TagConditionOperator.REGEX:
        return this.testRegex(conditionValue, targetValue);

      case TagConditionOperator.EXISTS:
        return !!value;

      case TagConditionOperator.NOT_EXISTS:
        return !value;

      default:
        return false;
    }
  }

  /**
   * Element-specific matching logic with optimized data extraction
   */
  private matchElementCondition(condition: TagCondition, clickData: ClickData): boolean {
    if (condition.operator === TagConditionOperator.EQUALS) {
      return this.matchElementFieldExact(condition, clickData);
    }

    // Build searchable element data string once
    const elementData = this.buildElementDataString(clickData).toLowerCase();
    const conditionValue = condition.value.toLowerCase();

    switch (condition.operator) {
      case TagConditionOperator.CONTAINS:
        return elementData.includes(conditionValue);

      case TagConditionOperator.STARTS_WITH:
        return elementData.startsWith(conditionValue);

      case TagConditionOperator.ENDS_WITH:
        return elementData.endsWith(conditionValue);

      case TagConditionOperator.REGEX:
        return this.testRegex(conditionValue, elementData);

      default:
        return false;
    }
  }

  /**
   * Exact field matching for element EQUALS operations
   */
  private matchElementFieldExact(condition: TagCondition, clickData: ClickData): boolean {
    const conditionValue = condition.value.toLowerCase();

    const fields = [
      clickData.id,
      clickData.class,
      clickData.tag,
      clickData.text,
      clickData.href,
      clickData.title,
      clickData.alt,
      clickData.role,
      clickData.ariaLabel,
    ];

    // Check standard fields
    if (fields.some((field) => field && field.toLowerCase() === conditionValue)) {
      return true;
    }

    // Check data attributes
    if (clickData.dataAttributes) {
      return Object.values(clickData.dataAttributes).some((value) => value.toLowerCase() === conditionValue);
    }

    return false;
  }

  /**
   * Builds searchable element data string with null safety
   */
  private buildElementDataString(clickData: ClickData): string {
    const parts = [
      clickData.id,
      clickData.class,
      clickData.tag,
      clickData.text,
      clickData.href,
      clickData.title,
      clickData.alt,
      clickData.role,
      clickData.ariaLabel,
    ].filter(Boolean);

    if (clickData.dataAttributes) {
      parts.push(...Object.values(clickData.dataAttributes));
    }

    return parts.join(' ');
  }

  /**
   * Safe regex testing with error handling
   */
  private testRegex(pattern: string, text: string): boolean {
    try {
      const regex = new RegExp(pattern, 'gi');
      return regex.test(text);
    } catch {
      return false;
    }
  }
}
