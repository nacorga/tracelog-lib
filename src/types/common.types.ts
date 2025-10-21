/**
 * Primitive types allowed in event metadata
 * Covers the basic data types for event properties
 */
type MetadataPrimitive = string | number | boolean;

/**
 * Values allowed in nested objects
 * Supports primitives, string arrays, and arrays of flat objects
 */
type MetadataNestedValue = MetadataPrimitive | string[] | Record<string, MetadataPrimitive>[];

/**
 * Nested object structure (one level deep)
 * Allows complex event metadata without infinite nesting
 */
type MetadataNestedObject = Record<string, MetadataNestedValue>;

/**
 * Comprehensive metadata type for custom events and global metadata
 *
 * **Supported Structures**:
 * - Primitives: `string`, `number`, `boolean`
 * - String arrays: `string[]`
 * - Flat objects: `{ key: primitive }`
 * - Nested objects (one level): `{ key: { nested: primitive } }`
 * - Arrays of objects: `[{ key: primitive }]`
 *
 * **Limitations**:
 * - Maximum nesting depth: 2 levels
 * - Arrays can only contain primitives or flat objects
 * - Designed for JSON serialization compatibility
 *
 * @example
 * ```typescript
 * // Primitives
 * const metadata1: MetadataType = 'string value';
 * const metadata2: MetadataType = 123;
 * const metadata3: MetadataType = true;
 *
 * // String arrays
 * const metadata4: MetadataType = ['tag1', 'tag2', 'tag3'];
 *
 * // Flat objects
 * const metadata5: MetadataType = {
 *   productId: 'abc-123',
 *   price: 299.99,
 *   inStock: true
 * };
 *
 * // Nested objects (one level)
 * const metadata6: MetadataType = {
 *   user: {
 *     id: 'user-123',
 *     isPremium: true
 *   },
 *   tags: ['new', 'featured']
 * };
 *
 * // Arrays of objects (e-commerce items)
 * const metadata7: MetadataType = [
 *   { id: 'prod-1', name: 'Product 1', price: 99 },
 *   { id: 'prod-2', name: 'Product 2', price: 149 }
 * ];
 * ```
 */
export type MetadataType = MetadataPrimitive | string[] | MetadataNestedObject | MetadataNestedObject[];
