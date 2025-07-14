import { DeviceType, TagCondition, EventClickData, TagConditionType, TagConditionOperator } from '../types';

export class TagManager {
  static matchUrlMatches(condition: TagCondition, url: string): boolean {
    if (condition.type !== TagConditionType.URL_MATCHES) {
      return false;
    }

    const targetValue = condition.caseSensitive ? condition.value : condition.value.toLowerCase();
    const targetUrl = condition.caseSensitive ? url : url.toLowerCase();

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
          const flags = condition.caseSensitive ? 'g' : 'gi';
          const regex = new RegExp(targetValue, flags);

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

  static matchDeviceType(condition: TagCondition, deviceType: DeviceType): boolean {
    if (condition.type !== TagConditionType.DEVICE_TYPE) {
      return false;
    }

    const targetValue = condition.caseSensitive ? condition.value : condition.value.toLowerCase();
    const targetDevice = condition.caseSensitive ? deviceType : deviceType.toLowerCase();

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
          const flags = condition.caseSensitive ? 'g' : 'gi';
          const regex = new RegExp(targetValue, flags);
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

  static matchElementSelector(condition: TagCondition, clickData: EventClickData): boolean {
    if (condition.type !== TagConditionType.ELEMENT_MATCHES) {
      return false;
    }

    const elementData = [
      clickData.elementId ?? '',
      clickData.elementClass ?? '',
      clickData.elementTag ?? '',
      clickData.elementText ?? '',
      clickData.elementHref ?? '',
      clickData.elementTitle ?? '',
      clickData.elementAlt ?? '',
      clickData.elementRole ?? '',
      clickData.elementAriaLabel ?? '',
      ...Object.values(clickData.elementDataAttributes ?? {}),
    ].join(' ');

    const targetValue = condition.caseSensitive ? condition.value : condition.value.toLowerCase();
    const targetElementData = condition.caseSensitive ? elementData : elementData.toLowerCase();

    switch (condition.operator) {
      case TagConditionOperator.EQUALS: {
        return this.checkElementFieldEquals(clickData, targetValue, condition.caseSensitive);
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
          const flags = condition.caseSensitive ? 'g' : 'gi';
          const regex = new RegExp(targetValue, flags);
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

  static matchUtmCondition(condition: TagCondition, utmValue: string | undefined): boolean {
    if (
      ![TagConditionType.UTM_SOURCE, TagConditionType.UTM_MEDIUM, TagConditionType.UTM_CAMPAIGN].includes(
        condition.type,
      )
    ) {
      return false;
    }

    const value = utmValue ?? '';
    const targetValue = condition.caseSensitive ? condition.value : condition.value.toLowerCase();
    const targetUtmValue = condition.caseSensitive ? value : value.toLowerCase();

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
          const flags = condition.caseSensitive ? 'g' : 'gi';
          const regex = new RegExp(targetValue, flags);
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

  private static checkElementFieldEquals(
    clickData: EventClickData,
    targetValue: string,
    caseSensitive?: boolean,
  ): boolean {
    const fields = [
      clickData.elementId,
      clickData.elementClass,
      clickData.elementTag,
      clickData.elementText,
      clickData.elementHref,
      clickData.elementTitle,
      clickData.elementAlt,
      clickData.elementRole,
      clickData.elementAriaLabel,
    ];

    for (const field of fields) {
      if (field) {
        const fieldValue = caseSensitive ? field : field.toLowerCase();
        const target = caseSensitive ? targetValue : targetValue.toLowerCase();

        if (fieldValue === target) {
          return true;
        }
      }
    }

    if (clickData.elementDataAttributes) {
      for (const dataValue of Object.values(clickData.elementDataAttributes)) {
        const fieldValue = caseSensitive ? dataValue : dataValue.toLowerCase();
        const target = caseSensitive ? targetValue : targetValue.toLowerCase();
        if (fieldValue === target) {
          return true;
        }
      }
    }

    return false;
  }
}
