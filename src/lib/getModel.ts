import mongoose from "mongoose";

export const getModel = (name: string, schema: any) => {
  return (mongoose.models[name] as mongoose.Model<any>) ||
    mongoose.model(name, schema);
};