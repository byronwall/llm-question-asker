import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Session } from "~/lib/domain";

const nowIso = () => new Date().toISOString();
const id = () => crypto.randomUUID();

function getSessionsDirPath() {
  return path.join(process.cwd(), "data", "sessions");
}

class JsonDb {
  private writeQueue: Promise<void> = Promise.resolve();

  private getSessionFilePath(sessionId: string) {
    return path.join(getSessionsDirPath(), `${sessionId}.json`);
  }

  private async readSessionFile(sessionId: string): Promise<Session | null> {
    const filePath = this.getSessionFilePath(sessionId);
    try {
      const raw = await readFile(filePath, "utf8");
      return JSON.parse(raw) as Session;
    } catch (err: any) {
      if (err?.code === "ENOENT") return null;
      throw err;
    }
  }

  private async writeSessionFile(
    sessionId: string,
    data: Session
  ): Promise<void> {
    const filePath = this.getSessionFilePath(sessionId);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
  }

  private async mutateSession<T>(
    sessionId: string,
    fn: (data: Session) => T | Promise<T>
  ): Promise<T> {
    let result!: T;
    this.writeQueue = this.writeQueue.then(async () => {
      const data = await this.readSessionFile(sessionId);
      if (!data) throw new Error("Session not found");
      result = await fn(data);
      await this.writeSessionFile(sessionId, data);
    });
    await this.writeQueue;
    return result;
  }

  async createSession(prompt: string): Promise<Session> {
    const sessionId = id();
    const session: Session = {
      id: sessionId,
      prompt,
      rounds: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    this.writeQueue = this.writeQueue.then(async () => {
      await this.writeSessionFile(sessionId, session);
    });
    await this.writeQueue;
    return session;
  }

  async getSession(sessionId: string): Promise<Session | null> {
    return this.readSessionFile(sessionId);
  }

  async updateSession(
    sessionId: string,
    patch: Partial<Pick<Session, "rounds" | "title" | "description">>
  ): Promise<Session> {
    return this.mutateSession(sessionId, (session) => {
      Object.assign(session, patch);
      session.updatedAt = nowIso();
      return session;
    });
  }

  async listSessions(): Promise<Session[]> {
    const dir = getSessionsDirPath();
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      const files = entries
        .filter((e) => e.isFile() && e.name.endsWith(".json"))
        .map((e) => e.name.slice(0, -".json".length));

      const sessions: Session[] = [];
      for (const id of files) {
        const s = await this.readSessionFile(id);
        if (s) sessions.push(s);
      }
      return sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    } catch (err: any) {
      if (err?.code === "ENOENT") return [];
      throw err;
    }
  }
}

let singleton: JsonDb | null = null;

export function db() {
  if (!singleton) singleton = new JsonDb();
  return singleton;
}
