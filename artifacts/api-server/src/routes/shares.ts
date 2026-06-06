import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";
import { eq, desc, count, sql } from "drizzle-orm";
import { db, sharesTable } from "@workspace/db";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);
import {
  ListSharesQueryParams,
  ListSharesResponse,
  CreateShareBody,
  GetShareParams,
  GetShareResponse,
  DeleteShareParams,
  GetStatsResponse,
  UploadFileBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

router.get("/shares", async (req, res): Promise<void> => {
  const parsed = ListSharesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { limit = 20, type = "all" } = parsed.data;

  let query = db
    .select()
    .from(sharesTable)
    .orderBy(desc(sharesTable.createdAt))
    .limit(limit ?? 20);

  const shares = await query;

  const filtered = type === "all" ? shares : shares.filter((s) => s.type === type);

  const result = filtered.map((s) => ({
    ...s,
    downloadUrl: s.type === "file" ? `/api/shares/${s.id}/download` : null,
  }));

  res.setHeader("Cache-Control", "no-store");
  res.json(ListSharesResponse.parse(result));
});

router.post("/shares", async (req, res): Promise<void> => {
  const parsed = CreateShareBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { type, content, title, authorName } = parsed.data;

  const id = nanoid(10);

  const [share] = await db
    .insert(sharesTable)
    .values({
      id,
      type,
      content,
      title: title ?? null,
      authorName: authorName ?? "Anonymous",
    })
    .returning();

  res.status(201).json(
    GetShareResponse.parse({
      ...share,
      downloadUrl: null,
    })
  );
});

router.post("/shares/upload", upload.single("file"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const title = req.body?.title ?? null;
  const authorName = req.body?.authorName ?? "Anonymous";
  const id = nanoid(10);

  const uniqueName = `${nanoid()}-${req.file.originalname}`;
  
  const { error: storageError } = await supabase.storage
    .from('shares')
    .upload(uniqueName, req.file.buffer, {
      contentType: req.file.mimetype,
    });

  if (storageError) {
    console.error("Supabase Storage Error:", storageError);
    res.status(500).json({ error: "Failed to upload to storage", details: storageError });
    return;
  }

  const [share] = await db
    .insert(sharesTable)
    .values({
      id,
      type: "file",
      title: title || req.file.originalname,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      filePath: uniqueName,
      authorName,
    })
    .returning();

  res.status(201).json(
    GetShareResponse.parse({
      ...share,
      downloadUrl: `/api/shares/${share.id}/download`,
    })
  );
});

router.get("/shares/:id/download", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const [share] = await db
    .select()
    .from(sharesTable)
    .where(eq(sharesTable.id, rawId));

  if (!share) {
    res.status(404).json({ error: "Share not found" });
    return;
  }

  if (share.type !== "file" || !share.filePath) {
    res.status(400).json({ error: "Not a file share" });
    return;
  }

  const { data: fileData, error: storageError } = await supabase.storage
    .from('shares')
    .download(share.filePath);

  if (storageError || !fileData) {
    res.status(404).json({ error: "File not found in storage" });
    return;
  }

  await db
    .update(sharesTable)
    .set({ downloadCount: (share.downloadCount ?? 0) + 1 })
    .where(eq(sharesTable.id, rawId));

  const buffer = Buffer.from(await fileData.arrayBuffer());
  res.setHeader("Content-Length", share.fileSize ?? buffer.length);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Disposition", `attachment; filename="${share.fileName ?? "download"}"`);
  res.send(buffer);
});

router.get("/shares/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetShareParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [share] = await db
    .select()
    .from(sharesTable)
    .where(eq(sharesTable.id, params.data.id));

  if (!share) {
    res.status(404).json({ error: "Share not found" });
    return;
  }

  res.json(
    GetShareResponse.parse({
      ...share,
      downloadUrl: share.type === "file" ? `/api/shares/${share.id}/download` : null,
    })
  );
});

router.delete("/shares/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteShareParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [share] = await db
    .select()
    .from(sharesTable)
    .where(eq(sharesTable.id, params.data.id));

  if (!share) {
    res.status(404).json({ error: "Share not found" });
    return;
  }

  if (share.filePath) {
    await supabase.storage.from('shares').remove([share.filePath]);
  }

  await db.delete(sharesTable).where(eq(sharesTable.id, params.data.id));

  res.json({ success: true });
});

router.get("/stats", async (_req, res): Promise<void> => {
  const [totalRow] = await db.select({ count: count() }).from(sharesTable);
  const [fileRow] = await db
    .select({ count: count() })
    .from(sharesTable)
    .where(eq(sharesTable.type, "file"));
  const [textRow] = await db
    .select({ count: count() })
    .from(sharesTable)
    .where(eq(sharesTable.type, "text"));
  const [urlRow] = await db
    .select({ count: count() })
    .from(sharesTable)
    .where(eq(sharesTable.type, "url"));
  const [downloadsRow] = await db
    .select({ total: sql<number>`coalesce(sum(${sharesTable.downloadCount}), 0)` })
    .from(sharesTable);

  res.json(
    GetStatsResponse.parse({
      totalShares: totalRow?.count ?? 0,
      totalFiles: fileRow?.count ?? 0,
      totalTextShares: textRow?.count ?? 0,
      totalUrlShares: urlRow?.count ?? 0,
      totalDownloads: Number(downloadsRow?.total ?? 0),
    })
  );
});

export default router;
