import mongoose from "mongoose";

// MongoDB transactions need a replica set (Atlas always has one). A local standalone
// mongod does not, so the first failure disables transactions for the process and the
// caller's body runs sequentially instead. Recorded in docs/DECISIONS.md.
let txSupported: boolean | null = null;

function isNoTransactionSupport(err: unknown) {
  const e = err as { code?: number; codeName?: string; message?: string };
  return (
    e?.code === 20 ||
    e?.codeName === "IllegalOperation" ||
    (e?.message ?? "").includes("Transaction numbers are only allowed on a replica set")
  );
}

export async function withOptionalTransaction<T>(
  fn: (session?: mongoose.ClientSession) => Promise<T>,
): Promise<T> {
  if (txSupported === false) return fn();
  const session = await mongoose.startSession();
  try {
    let result!: T;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    txSupported = true;
    return result;
  } catch (err) {
    if (isNoTransactionSupport(err)) {
      txSupported = false;
      console.warn("[db] transactions unavailable, running this operation without a session");
      return fn();
    }
    throw err;
  } finally {
    await session.endSession();
  }
}
