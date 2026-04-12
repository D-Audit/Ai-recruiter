import crypto from "crypto";
import mongoose, { Schema, Document } from "mongoose";


interface ICache extends Document {
  queryHash: string;
  response: any;
  jobId: string;
  hitCount: number;
  expiresAt: Date;
  createdAt: Date;
}


const CacheSchema = new Schema<ICache>({
  queryHash: { type: String, unique: true, required: true },
  response: { type: Schema.Types.Mixed, required: true },
  jobId: { type: String, required: true },
  hitCount: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

CacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });


const Cache =
  mongoose.models.Cache as mongoose.Model<ICache> ||
  mongoose.model<ICache>("Cache", CacheSchema);


export function generateCacheKey(
  jobId: string,
  applicantIds: string[],
  weights: object
): string {
  const data = JSON.stringify({
    jobId,
    applicantIds: applicantIds.sort(),
    weights,
  });

  return crypto
    .createHash("sha256")
    .update(data)
    .digest("base64");
}


export async function getCachedResult(
  queryHash: string
): Promise<any | null> {
  try {
    const cached = await Cache.findOne({
      queryHash,
      expiresAt: { $gt: new Date() },
    });

    if (cached) {
      await Cache.updateOne(
        { queryHash },
        { $inc: { hitCount: 1 } }
      );

      console.log(
        `✅ Cache hit for hash: ${queryHash.substring(0, 20)}...`
      );

      return cached.response;
    }

    return null;
  } catch {
    return null;
  }
}
export async function setCachedResult(
  queryHash: string,
  jobId: string,
  response: any
): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour cache

    await Cache.findOneAndUpdate(
      { queryHash },
      { queryHash, response, jobId, expiresAt, hitCount: 0 },
      { upsert: true, new: true }
    );

    console.log(`✅ Cached result for 24 hours`);
  } catch (error) {
    console.error("Cache write failed:", error);
  }
}