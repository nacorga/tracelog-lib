import {
  TracelogTagCondition,
  TracelogEventClickData,
  TracelogTagConditionType,
  TracelogTagConditionOperator,
} from '@/types';
import { DeviceType } from '@/constants';

export class TagManager {
  /**
   * Matches URL-based conditions against a given URL
   */
  static matchUrlMatches(condition: TracelogTagCondition, url: string): boolean {
    if (condition.type !== TracelogTagConditionType.URL_MATCHES) {
      return false;
    }

    const targetValue = condition.caseSensitive ? condition.value : condition.value.toLowerCase();
    const targetUrl = condition.caseSensitive ? url : url.toLowerCase();

    switch (condition.operator) {
      case TracelogTagConditionOperator.EQUALS: {
        return targetUrl === targetValue;
      }

      case TracelogTagConditionOperator.CONTAINS: {
        return targetUrl.includes(targetValue);
      }

      case TracelogTagConditionOperator.STARTS_WITH: {
        return targetUrl.startsWith(targetValue);
      }

      case TracelogTagConditionOperator.ENDS_WITH: {
        return targetUrl.endsWith(targetValue);
      }

      case TracelogTagConditionOperator.REGEX: {
        try {
          const flags = condition.caseSensitive ? 'g' : 'gi';
          const regex = new RegExp(targetValue, flags);
          return regex.test(targetUrl);
        } catch {
          // Invalid regex - return false
          return false;
        }
      }

      default: {
        return false;
      }
    }
  }

  /**
   * Matches device type conditions
   */
  static matchDeviceType(condition: TracelogTagCondition, deviceType: DeviceType): boolean {
    if (condition.type !== TracelogTagConditionType.DEVICE_TYPE) {
      return false;
    }

    const targetValue = condition.caseSensitive ? condition.value : condition.value.toLowerCase();
    const targetDevice = condition.caseSensitive ? deviceType : deviceType.toLowerCase();

    switch (condition.operator) {
      case TracelogTagConditionOperator.EQUALS: {
        return targetDevice === targetValue;
      }

      case TracelogTagConditionOperator.CONTAINS: {
        return targetDevice.includes(targetValue);
      }

      case TracelogTagConditionOperator.STARTS_WITH: {
        return targetDevice.startsWith(targetValue);
      }

      case TracelogTagConditionOperator.ENDS_WITH: {
        return targetDevice.endsWith(targetValue);
      }

      case TracelogTagConditionOperator.REGEX: {
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

  /**
   * Matches element selector conditions against click data
   */
  static matchElementSelector(condition: TracelogTagCondition, clickData: TracelogEventClickData): boolean {
    if (condition.type !== TracelogTagConditionType.ELEMENT_MATCHES) {
      return false;
    }

    // Extract all relevant element data for matching
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
      // Include data attributes as well
      ...Object.values(clickData.elementDataAttributes ?? {}),
    ].join(' ');

    const targetValue = condition.caseSensitive ? condition.value : condition.value.toLowerCase();
    const targetElementData = condition.caseSensitive ? elementData : elementData.toLowerCase();

    switch (condition.operator) {
      case TracelogTagConditionOperator.EQUALS: {
        // For elements, check if any individual field equals the value
        return this.checkElementFieldEquals(clickData, targetValue, condition.caseSensitive);
      }

      case TracelogTagConditionOperator.CONTAINS: {
        return targetElementData.includes(targetValue);
      }

      case TracelogTagConditionOperator.STARTS_WITH: {
        return targetElementData.startsWith(targetValue);
      }

      case TracelogTagConditionOperator.ENDS_WITH: {
        return targetElementData.endsWith(targetValue);
      }

      case TracelogTagConditionOperator.REGEX: {
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

  /**
   * Matches UTM parameter conditions
   */
  static matchUtmCondition(condition: TracelogTagCondition, utmValue: string | undefined): boolean {
    if (
      ![
        TracelogTagConditionType.UTM_SOURCE,
        TracelogTagConditionType.UTM_MEDIUM,
        TracelogTagConditionType.UTM_CAMPAIGN,
      ].includes(condition.type)
    ) {
      return false;
    }

    const value = utmValue ?? '';
    const targetValue = condition.caseSensitive ? condition.value : condition.value.toLowerCase();
    const targetUtmValue = condition.caseSensitive ? value : value.toLowerCase();

    switch (condition.operator) {
      case TracelogTagConditionOperator.EQUALS: {
        return targetUtmValue === targetValue;
      }

      case TracelogTagConditionOperator.CONTAINS: {
        return targetUtmValue.includes(targetValue);
      }

      case TracelogTagConditionOperator.STARTS_WITH: {
        return targetUtmValue.startsWith(targetValue);
      }

      case TracelogTagConditionOperator.ENDS_WITH: {
        return targetUtmValue.endsWith(targetValue);
      }

      case TracelogTagConditionOperator.REGEX: {
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

  /**
   * Helper method to check if any element field equals the target value
   */
  private static checkElementFieldEquals(
    clickData: TracelogEventClickData,
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

    // Check main fields
    for (const field of fields) {
      if (field) {
        const fieldValue = caseSensitive ? field : field.toLowerCase();
        const target = caseSensitive ? targetValue : targetValue.toLowerCase();
        if (fieldValue === target) {
          return true;
        }
      }
    }

    // Check data attributes
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
