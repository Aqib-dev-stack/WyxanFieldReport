import mongoose from 'mongoose';

import type { StoredReport } from '../domain.ts';
import type { ReportStore } from './reportStore.ts';

/**
 * `_id` is the phone's report UUID, so MongoDB's built-in unique index on
 * `_id` is the idempotency guarantee: the same report can never be stored
 * twice, even if two commits race.
 */
const reportSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    description: { type: String, required: true },
    images: [
      {
        _id: false,
        position: { type: Number, required: true },
        file: { type: String, required: true },
        sizeBytes: { type: Number, required: true },
      },
    ],
    createdAt: { type: String, required: true },
    receivedAt: { type: String, required: true },
  },
  { versionKey: false },
);
reportSchema.index({ receivedAt: -1 });

const ReportModel = mongoose.model('Report', reportSchema);

type ReportDoc = {
  _id: string;
  description: string;
  images: StoredReport['images'];
  createdAt: string;
  receivedAt: string;
};

const toReport = (doc: ReportDoc): StoredReport => ({
  id: doc._id,
  description: doc.description,
  images: doc.images.map(({ position, file, sizeBytes }) => ({
    position,
    file,
    sizeBytes,
  })),
  createdAt: doc.createdAt,
  receivedAt: doc.receivedAt,
});

const DUPLICATE_KEY = 11000;

export const createMongoStore = (): ReportStore => ({
  async findById(id) {
    const doc = await ReportModel.findById(id).lean<ReportDoc>();
    return doc ? toReport(doc) : null;
  },

  async insertIfAbsent(report) {
    const { id, ...fields } = report;
    try {
      // Insert; the unique _id index rejects a second copy atomically.
      await ReportModel.create({ _id: id, ...fields });
      return { report, created: true };
    } catch (error) {
      // Already there (a repeated or racing commit): return the stored one.
      if ((error as { code?: number }).code === DUPLICATE_KEY) {
        const existing = await ReportModel.findById(id).lean<ReportDoc>();
        if (existing) {
          return { report: toReport(existing), created: false };
        }
      }
      throw error;
    }
  },

  async list() {
    const docs = await ReportModel.find()
      .sort({ receivedAt: -1 })
      .lean<ReportDoc[]>();
    return docs.map(toReport);
  },

  async deleteAll() {
    await ReportModel.deleteMany({});
  },
});

export const connectMongo = (uri: string) =>
  mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
