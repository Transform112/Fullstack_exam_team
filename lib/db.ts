import mongoose from "mongoose";

// One shared MongoDB connection per serverless instance, cached on globalThis so
// hot reloads and repeated invocations do not open a new pool every time.
type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const g = globalThis as unknown as { _mongoose?: Cache };
const cache: Cache = g._mongoose ?? (g._mongoose = { conn: null, promise: null });

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not set");
  if (cache.conn) return cache.conn;
  // serverSelectionTimeoutMS keeps a bad or unreachable URI from hanging a request for
  // the 30 second default: the error surfaces as a controlled 503 instead.
  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10_000,
    });
  }
  try {
    cache.conn = await cache.promise;
    return cache.conn;
  } catch (err) {
    // A failed attempt must not be cached, otherwise every later request fails.
    cache.promise = null;
    throw err;
  }
}
