import { DeviceType, TagCondition, ClickData, TagConditionType, TagConditionOperator } from '../types';

export class TagManager {
  static matchUrlMatches(condition: TagCondition, url: string): boolean {
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

  static matchDeviceType(condition: TagCondition, deviceType: DeviceType): boolean {
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

  static matchElementSelector(condition: TagCondition, clickData: ClickData): boolean {
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

  static matchUtmCondition(condition: TagCondition, utmValue: string | undefined): boolean {
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

  private static checkElementFieldEquals(clickData: ClickData, targetValue: string): boolean {
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
