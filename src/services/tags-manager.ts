import { Config } from '../types/config.types';
import { DeviceType } from '../types/device.types';
import { ClickData, EventData, EventType } from '../types/event.types';
import { TagCondition, TagConditionOperator, TagConditionType, TagLogicalOperator } from '../types/tag.types';

export class TagsManager {
  private readonly config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  getEventTagsIds(event: EventData, deviceType: DeviceType): string[] {
    switch (event.type) {
      case EventType.PAGE_VIEW: {
        return this.checkEventTypePageView(event, deviceType);
      }
      case EventType.CLICK: {
        return this.checkEventTypeClick(event, deviceType);
      }
      default: {
        return [];
      }
    }
  }

  private checkEventTypePageView(event: EventData, deviceType: DeviceType): string[] {
    const tags = this.config?.tags?.filter((tag) => tag.triggerType === EventType.PAGE_VIEW) || [];

    if (tags.length === 0) {
      return [];
    }

    const matchedTagIds: string[] = [];

    for (const tag of tags) {
      const { id, logicalOperator, conditions } = tag;
      const results: boolean[] = [];

      for (const condition of conditions) {
        switch (condition.type) {
          case TagConditionType.URL_MATCHES: {
            results.push(this.matchUrlMatches(condition, event.page_url));

            break;
          }
          case TagConditionType.DEVICE_TYPE: {
            results.push(this.matchDeviceType(condition, deviceType));

            break;
          }
          case TagConditionType.UTM_SOURCE: {
            results.push(this.matchUtmCondition(condition, event.utm?.source));

            break;
          }
          case TagConditionType.UTM_MEDIUM: {
            results.push(this.matchUtmCondition(condition, event.utm?.medium));

            break;
          }
          case TagConditionType.UTM_CAMPAIGN: {
            results.push(this.matchUtmCondition(condition, event.utm?.campaign));

            break;
          }
        }
      }

      let isMatch = false;

      isMatch = logicalOperator === TagLogicalOperator.AND ? results.every(Boolean) : results.some(Boolean);

      if (isMatch) {
        matchedTagIds.push(id);
      }
    }

    return matchedTagIds;
  }

  private checkEventTypeClick(event: EventData, deviceType: DeviceType): string[] {
    const tags = this.config?.tags?.filter((tag) => tag.triggerType === EventType.CLICK) || [];

    if (tags.length === 0) {
      return [];
    }

    const matchedTagIds: string[] = [];

    for (const tag of tags) {
      const { id, logicalOperator, conditions } = tag;
      const results: boolean[] = [];

      for (const condition of conditions) {
        if (!event.click_data) {
          results.push(false);
          continue;
        }

        const clickData = event.click_data;

        switch (condition.type) {
          case TagConditionType.ELEMENT_MATCHES: {
            results.push(this.matchElementSelector(condition, clickData));

            break;
          }
          case TagConditionType.DEVICE_TYPE: {
            results.push(this.matchDeviceType(condition, deviceType));

            break;
          }
          case TagConditionType.URL_MATCHES: {
            results.push(this.matchUrlMatches(condition, event.page_url));

            break;
          }
          case TagConditionType.UTM_SOURCE: {
            results.push(this.matchUtmCondition(condition, event.utm?.source));

            break;
          }
          case TagConditionType.UTM_MEDIUM: {
            results.push(this.matchUtmCondition(condition, event.utm?.medium));

            break;
          }
          case TagConditionType.UTM_CAMPAIGN: {
            results.push(this.matchUtmCondition(condition, event.utm?.campaign));

            break;
          }
        }
      }

      let isMatch = false;

      isMatch = logicalOperator === TagLogicalOperator.AND ? results.every(Boolean) : results.some(Boolean);

      if (isMatch) {
        matchedTagIds.push(id);
      }
    }

    return matchedTagIds;
  }

  private matchUrlMatches(condition: TagCondition, url: string): boolean {
    if (condition.type !== TagConditionType.URL_MATCHES) {
      return false;
    }

    const targetValue = condition.value.toLowerCase();
    const targetUrl = url.toLowerCase();

    switch (condition.operator) {
      case TagConditionOperator.EQUALS: {
        return targetUrl === targetValue;
      }

      case TagConditionOperator.CONTAINS: {
        return targetUrl.includes(targetValue);
      }

      case TagConditionOperator.STARTS_WITH: {
        return targetUrl.startsWith(targetValue);
      }

      case TagConditionOperator.ENDS_WITH: {
        return targetUrl.endsWith(targetValue);
      }

      case TagConditionOperator.REGEX: {
        try {
          const regex = new RegExp(targetValue, 'gi');

          return regex.test(targetUrl);
        } catch {
          return false;
        }
      }

      default: {
        return false;
      }
    }
  }

  private matchDeviceType(condition: TagCondition, deviceType: DeviceType): boolean {
    if (condition.type !== TagConditionType.DEVICE_TYPE) {
      return false;
    }

    const targetValue = condition.value.toLowerCase();
    const targetDevice = deviceType.toLowerCase();

    switch (condition.operator) {
      case TagConditionOperator.EQUALS: {
        return targetDevice === targetValue;
      }

      case TagConditionOperator.CONTAINS: {
        return targetDevice.includes(targetValue);
      }

      case TagConditionOperator.STARTS_WITH: {
        return targetDevice.startsWith(targetValue);
      }

      case TagConditionOperator.ENDS_WITH: {
        return targetDevice.endsWith(targetValue);
      }

      case TagConditionOperator.REGEX: {
        try {
          const regex = new RegExp(targetValue, 'gi');

          return regex.test(targetDevice);
        } catch {
          return false;
        }
      }

      default: {
        return false;
      }
    }
  }

  private matchElementSelector(condition: TagCondition, clickData: ClickData): boolean {
    if (condition.type !== TagConditionType.ELEMENT_MATCHES) {
      return false;
    }

    const elementData = [
      clickData.id ?? '',
      clickData.class ?? '',
      clickData.tag ?? '',
      clickData.text ?? '',
      clickData.href ?? '',
      clickData.title ?? '',
      clickData.alt ?? '',
      clickData.role ?? '',
      clickData.ariaLabel ?? '',
      ...Object.values(clickData.dataAttributes ?? {}),
    ].join(' ');

    const targetValue = condition.value.toLowerCase();
    const targetElementData = elementData.toLowerCase();

    switch (condition.operator) {
      case TagConditionOperator.EQUALS: {
        return this.checkElementFieldEquals(clickData, targetValue);
      }

      case TagConditionOperator.CONTAINS: {
        return targetElementData.includes(targetValue);
      }

      case TagConditionOperator.STARTS_WITH: {
        return targetElementData.startsWith(targetValue);
      }

      case TagConditionOperator.ENDS_WITH: {
        return targetElementData.endsWith(targetValue);
      }

      case TagConditionOperator.REGEX: {
        try {
          const regex = new RegExp(targetValue, 'gi');

          return regex.test(targetElementData);
        } catch {
          return false;
        }
      }

      default: {
        return false;
      }
    }
  }

  private matchUtmCondition(condition: TagCondition, utmValue: string | undefined): boolean {
    if (
      ![TagConditionType.UTM_SOURCE, TagConditionType.UTM_MEDIUM, TagConditionType.UTM_CAMPAIGN].includes(
        condition.type,
      )
    ) {
      return false;
    }

    const value = utmValue ?? '';
    const targetValue = condition.value.toLowerCase();
    const targetUtmValue = value.toLowerCase();

    switch (condition.operator) {
      case TagConditionOperator.EQUALS: {
        return targetUtmValue === targetValue;
      }

      case TagConditionOperator.CONTAINS: {
        return targetUtmValue.includes(targetValue);
      }

      case TagConditionOperator.STARTS_WITH: {
        return targetUtmValue.startsWith(targetValue);
      }

      case TagConditionOperator.ENDS_WITH: {
        return targetUtmValue.endsWith(targetValue);
      }

      case TagConditionOperator.REGEX: {
        try {
          const regex = new RegExp(targetValue, 'gi');

          return regex.test(targetUtmValue);
        } catch {
          return false;
        }
      }

      default: {
        return false;
      }
    }
  }

  private checkElementFieldEquals(clickData: ClickData, targetValue: string): boolean {
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

    for (const field of fields) {
      if (field) {
        const fieldValue = field.toLowerCase();
        const target = targetValue.toLowerCase();

        if (fieldValue === target) {
          return true;
        }
      }
    }

    if (clickData.dataAttributes) {
      for (const dataValue of Object.values(clickData.dataAttributes)) {
        const fieldValue = dataValue.toLowerCase();
        const target = targetValue.toLowerCase();

        if (fieldValue === target) {
          return true;
        }
      }
    }

    return false;
  }
}
