// One serialised write queue for every wizard save (docs/03 SECTION 5.6).
// Next, Save draft, autosave, media reorder, captions and memory linking all go
// through a single queue so two PATCHes can never race for the same revision.

export type QueueTask = { run: () => Promise<void> };

// The retry factory is called again after a reconnect, so a parked task can take a
// fresh snapshot of the current revision instead of replaying stale numbers.
export type RetryableTask = { run: () => Promise<void>; retry?: () => QueueTask };

export type WriteQueue = {
  // Runs fn strictly after every earlier task has settled; resolves with its result.
  enqueue<T>(fn: () => Promise<T>): Promise<T>;
  // Runs a save step; a network failure parks it for the next drain/online event.
  enqueueStep(task: RetryableTask): Promise<void>;
  // Resolves once nothing is left to run, retrying parked tasks (up to a bounded
  // number of passes) so a reconnect flush cannot spin forever.
  drain(): Promise<void>;
  // Tasks not finished yet: running, waiting in line or parked for a retry.
  pending(): number;
};

// Tasks are chained onto a tail promise, so each one starts only after the previous
// settled. That ordering guarantee is what keeps two PATCHes from racing.
export function createWriteQueue(): WriteQueue {
  let tail: Promise<void> = Promise.resolve();
  let running = 0;
  // Bumped every time one queued task finishes, so drain() can tell a real pass from
  // a queue that is still parked and offline.
  let version = 0;
  let deferred: Array<() => void> = [];
  let parked: Array<() => RetryableTask | null> = [];

  const settleWaiters = () => {
    const waiters = deferred;
    deferred = [];
    for (const resolve of waiters) resolve();
  };

  const waitForPass = async (seen: number) => {
    while (!(version > seen)) {
      await new Promise<void>((resolve) => deferred.push(resolve));
    }
  };

  // Appends a task to the tail and keeps the pending counters honest.
  const schedule = (
    run: () => Promise<void>,
    onSettled: () => void,
    makeRetry: () => RetryableTask | null,
  ) => {
    running += 1;
    const chained = tail.then(async () => {
      let parkedRetry: (() => RetryableTask | null) | null = null;
      try {
        await run();
      } catch (caught) {
        // A network failure must not lose the edit: park it and retry on drain().
        // Every other error belongs to the caller.
        if (isNetworkError(caught)) parkedRetry = makeRetry;
      }
      if (parkedRetry) parked.push(parkedRetry);
      running -= 1;
      onSettled();
      version += 1;
      settleWaiters();
    });
    // The chain must never stay rejected: the next task is appended to `chained`.
    tail = chained.catch(() => undefined);
  };

  return {
    enqueue<T>(fn: () => Promise<T>): Promise<T> {
      let resolveOuter!: (value: T) => void;
      let rejectOuter!: (reason: unknown) => void;
      const outer = new Promise<T>((resolve, reject) => {
        resolveOuter = resolve;
        rejectOuter = reject;
      });
      // The waiter is only for the first attempt: a retry that succeeds later has
      // nobody left to notify, and a retry that fails again is parked once more.
      const attempt = () => {
        let waiting = true;
        return {
          run: () =>
            Promise.resolve(fn()).then(
              (value) => {
                if (waiting) {
                  waiting = false;
                  resolveOuter(value);
                }
              },
              (err) => {
                if (waiting) {
                  waiting = false;
                  rejectOuter(err);
                }
                throw err;
              },
            ),
        };
      };
      schedule(
        () => attempt().run(),
        () => undefined,
        () => {
          const retryFn = fn;
          return {
            run: () =>
              new Promise<void>((resolve, reject) => {
                Promise.resolve(retryFn()).then(() => resolve(), reject);
              }),
          };
        },
      );
      // Nobody must ever see an unhandled rejection for a parked task.
      outer.catch(() => undefined);
      return outer;
    },

    enqueueStep(task: RetryableTask): Promise<void> {
      let resolveOuter!: () => void;
      const outer = new Promise<void>((resolve) => {
        resolveOuter = resolve;
      });
      schedule(
        () => task.run(),
        () => resolveOuter(),
        () => task.retry?.() ?? task,
      );
      return outer;
    },

    async drain() {
      // Wait for the work that is already in flight. A parked task does not block
      // this loop, which is why the version counter is used instead of "is idle".
      while (running > 0) {
        await waitForPass(version);
      }
      // Bounded passes: a queue that is still offline keeps its tasks parked and the
      // indication stays "Offline / Unsaved" instead of looping forever.
      for (let pass = 0; pass < 3 && parked.length > 0; pass++) {
        const retries = parked;
        parked = [];
        for (const makeRetry of retries) {
          const task = makeRetry();
          if (!task) continue;
          schedule(
            () => task.run(),
            () => undefined,
            () => task.retry?.() ?? task,
          );
        }
        while (running > 0) {
          await waitForPass(version);
        }
      }
    },

    pending() {
      return running + parked.length;
    },
  };
}

// True for failures that mean "the network is down", not "the server rejected this".
export function isNetworkError(err: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  if (err instanceof TypeError) return true;
  const message = err instanceof Error ? err.message.toLowerCase() : "";
  return (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("load failed")
  );
}
