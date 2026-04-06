import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPDFCache extends Document {
    hash: string;
    pdfBuffer: Buffer;
    createdAt: Date;
}

const PDFCacheSchema: Schema = new Schema({
    hash: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    pdfBuffer: {
        type: Buffer,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 604800, // Auto-delete document after 7 days (604800 seconds)
    },
});

const PDFCache: Model<IPDFCache> =
    mongoose.models.PDFCache || mongoose.model<IPDFCache>("PDFCache", PDFCacheSchema);

export default PDFCache;
