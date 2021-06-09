import { JsonArray, JsonObject } from "@angular-devkit/core";

/**
 * stores the values of the options defined in the schema.json file
 */
export interface Schema {
    type: string;
    project: string | number | boolean | JsonArray | JsonObject | null | undefined;
}