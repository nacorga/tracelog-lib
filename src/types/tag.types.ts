import { EventType } from './event.types';

export enum TracelogTagLogicalOperator {
  AND = 'AND',
  OR = 'OR',
}

export enum TracelogTagConditionType {
  URL_MATCHES = 'url_matches',
  ELEMENT_MATCHES = 'element_matches',
  DEVICE_TYPE = 'device_type',
  ELEMENT_TEXT = 'element_text',
  ELEMENT_ATTRIBUTE = 'element_attribute',
  UTM_SOURCE = 'utm_source',
  UTM_MEDIUM = 'utm_medium',
  UTM_CAMPAIGN = 'utm_campaign',
}

export enum TracelogTagConditionOperator {
  EQUALS = 'equals',
  CONTAINS = 'contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  REGEX = 'regex',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  EXISTS = 'exists',
  NOT_EXISTS = 'not_exists',
}

export interface TracelogTag {
  id: string;
  name: string;
  description?: string;
  triggerType: EventType;
  logicalOperator: TracelogTagLogicalOperator;
  conditions: TracelogTagCondition[];
  isActive: boolean;
}

export interface TracelogTagCondition {
  type: TracelogTagConditionType;
  operator: TracelogTagConditionOperator;
  value: string;
  caseSensitive?: boolean;
}
