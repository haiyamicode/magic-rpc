import * as h from "@haiyami/hyperstruct";
import {
  CustomLoaders,
  FieldMapping,
  FieldMappingLike,
  FieldMappings,
  ResolverContext,
  ResolverFieldSchema,
  ResolverSchema,
  TypeRegistry,
} from "./types";

export class DataResolver<TTypeRegistry extends TypeRegistry, TCustomLoaders extends CustomLoaders = {}> {
  constructor(
    public typesSchema: TTypeRegistry,
    public resolverSchema: ResolverSchema<TTypeRegistry, TCustomLoaders>,
    public context: ResolverContext<TTypeRegistry, TCustomLoaders>
  ) {}

  async resolveOne<T>(
    item: T,
    typeKey: keyof TTypeRegistry,
    mappings: FieldMappingLike
  ): Promise<T> {
    if (!item) {
      return item;
    }
    mappings = mappings || {};
    const resolver = this.resolverSchema[typeKey];
    const type = this.typesSchema[typeKey];
    const typeName = String(typeKey);
    for (const [key, fieldMapping] of Object.entries(mappings)) {
      if (!type) throw new Error(`no type schema available for ${typeName}`);
      if (!resolver)
        throw new Error(`no resolver available for type ${typeName}`);
      const fieldSchema = resolver[key] as
        | ResolverFieldSchema<TTypeRegistry, TCustomLoaders, T>
        | undefined;
      if (!fieldSchema) {
        throw new Error(
          `no resolver available for field '${key}' of type '${typeName}'`
        );
      }
      const result = await fieldSchema.resolve(item, this.context);
      (item as any)[key] = result;
      await this.resolve(
        result,
        typeof fieldSchema.type === "object"
          ? fieldSchema.type
          : this.typesSchema[fieldSchema.type as string],
        fieldMapping
      );
    }
    return item;
  }

  async resolveItems<T>(
    items: T[],
    typeName: string,
    mappings: FieldMappingLike
  ): Promise<T[]> {
    return await Promise.all(
      items.map((item) => this.resolveOne(item, typeName, mappings))
    );
  }

  async resolve(
    result: any,
    typeSchema: h.Struct<any>,
    mappings: FieldMappings | FieldMapping
  ): Promise<any> {
    const { schema, type, name } = typeSchema as any;
    if (name && this.typesSchema[name]) {
      await this.resolveOne(result, name, mappings);
    }
    if (!schema) {
      return result;
    }

    switch (type) {
      case "object":
      case "type": {
        if (!mappings) return;
        await Promise.all(
          Object.entries(mappings).map(async ([fieldKey, fieldMapping]) => {
            const typeSchema = schema[fieldKey];
            if (!typeSchema) {
              if (!name || !this.resolverSchema[name]?.[fieldKey]) {
                throw new Error(
                  `Invalid field '${fieldKey}'${
                    name ? ` of type '${name}'` : ""
                  }`
                );
              }
              return;
            }

            const fieldResult = await this.resolve(
              result[fieldKey],
              typeSchema,
              fieldMapping
            );
            return fieldResult;
          })
        );
        break;
      }
      case "array": {
        await this.resolveItems(result, schema.name, mappings);
        break;
      }
    }
    return result;
  }
}
