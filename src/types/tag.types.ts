import { EventType } from './event.types';

export enum TagLogicalOperator {
  AND = 'AND',
  OR = 'OR',
}

export enum TagConditionType {
  URL_MATCHES = 'url_matches',
  ELEMENT_MATCHES = 'element_matches',
  DEVICE_TYPE = 'device_type',
  ELEMENT_TEXT = 'element_text',
  ELEMENT_ATTRIBUTE = 'element_attribute',
  UTM_SOURCE = 'utm_source',
  UTM_MEDIUM = 'utm_medium',
  UTM_CAMPAIGN = 'utm_campaign',
}

export enum TagConditionOperator {
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

export type TagConfig = Pick<Tag, 'key' | 'triggerType' | 'logicalOperator' | 'conditions'> & {
  id: string;
};

export interface Tag {
  key: string;
  name: string;
  description?: string;
  active: boolean;
  triggerType: EventType;
  logicalOperator?: TagLogicalOperator;
  conditions: TagCondition[];
}

export interface TagCondition {
  type: TagConditionType;
  operator: TagConditionOperator;
  value: string;
}
