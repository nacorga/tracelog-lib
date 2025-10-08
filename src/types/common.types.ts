// Base primitive types for metadata values
type MetadataPrimitive = string | number | boolean;

// Nested object type (one level deep) - can contain primitives, string arrays, or arrays of objects
type MetadataNestedValue = MetadataPrimitive | string[] | Record<string, MetadataPrimitive>[];
type MetadataNestedObject = Record<string, MetadataNestedValue>;

// Full metadata type supporting primitives, arrays, and nested objects
export type MetadataType = MetadataPrimitive | string[] | MetadataNestedObject | MetadataNestedObject[];
