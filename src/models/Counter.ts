import mongoose, { Schema, Document, Model } from "mongoose";



// we need to create a counter schema in db first like this:
// {
//   name: "submissionNumber",
//   seq: 182671
// }

export interface ICounter extends Document {
  name: string;
  seq: number;
}

const CounterSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, required: true },
});

const Counter: Model<ICounter> =
  mongoose.models.Counter ||
  mongoose.model<ICounter>("Counter", CounterSchema);

export default Counter;
