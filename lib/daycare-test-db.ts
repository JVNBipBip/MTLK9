/** Isolated serializable in-memory Firestore double. Never connects to a real project. */
import type { Firestore } from "firebase-admin/firestore";
export function daycareMemoryDb() {
  const data = new Map<string, any>();
  let sequence = 0,
    queue = Promise.resolve();
  const snapshot = (path: string) => ({
    id: path.split("/").pop(),
    exists: data.has(path),
    data: () => (data.has(path) ? structuredClone(data.get(path)) : undefined),
    ref: ref(path),
  });
  const ref = (path: string): any => ({
    path,
    id: path.split("/").pop(),
    get: async () => snapshot(path),
    set: async (value: any) => data.set(path, value),
    update: async (value: any) =>
      data.set(path, { ...data.get(path), ...value }),
    collection: (name: string) => ({
      doc: (id = `auto-${++sequence}`) => ref(`${path}/${name}/${id}`),
    }),
  });
  const db = {
    collection: (name: string) => ({
      doc: (id = `auto-${++sequence}`) => ref(`${name}/${id}`),
    }),
    runTransaction: (handler: any) => {
      const run = queue.then(async () => {
        let wrote = false;
        const writes: (() => void)[] = [];
        const write = (action: () => void) => {
          wrote = true;
          writes.push(action);
        };
        const result = await handler({
          get: async (r: any) => {
            if (wrote) throw new Error("Firestore reads must precede writes");
            return snapshot(r.path);
          },
          create: (r: any, value: any) =>
            write(() => {
              if (data.has(r.path)) throw new Error("Already exists");
              data.set(r.path, structuredClone(value));
            }),
          set: (r: any, value: any) =>
            write(() => data.set(r.path, structuredClone(value))),
          update: (r: any, value: any) =>
            write(() =>
              data.set(r.path, {
                ...data.get(r.path),
                ...structuredClone(value),
              }),
            ),
          delete: (r: any) => write(() => data.delete(r.path)),
        });
        writes.forEach((write) => write());
        return result;
      });
      queue = run.catch(() => {});
      return run;
    },
  };
  return { db: db as unknown as Firestore, data };
}
