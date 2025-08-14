
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

import ffprobe from 'ffprobe';
import ffprobeStatic from 'ffprobe-static';
import { isMedia, isVideo, isPic } from './guards.ts';
import { getItemViaPath } from './db.js';

const statAsync = promisify(fs.stat);
const readdirAsync = promisify(fs.readdir);


import { dockerDb, localDb } from './db/initDb.ts';
const isDockerDb = process.env.DOCKERDB;
const db = isDockerDb ? await dockerDb() : await localDb();

interface FileNode {
  name: string;
  webPath: string;
  fullPath: string;
  thumbnail?: string;
  isDirectory: boolean;
  duration: number | null;
  id: number | null;
  favorite: boolean | null;
  marked?: boolean;
  tags?: Array<{ id: number; value: string }>;
  faceCount?: number | null;
}

interface DbItem {
  id: number;
  path: string;
  thumbnail?: string;
  favorite: boolean;
  marked: boolean;
  tags?: Array<{ id: number; value: string }>;
  face_count?: number | null;
}

interface VideoInfo {
  streams?: Array<{ duration: number }>;
}

interface ListingsResult {
  dirs: FileNode[];
  files: FileNode[];
  media: FileNode[];
}

const getInfoFromDbItem = (dbItem: DbItem, webRoot: string): [string, string, string] => {
  const fullFilePath = dbItem.path;
  const name = fullFilePath.replace(/.*\//, '');
  const webPath = fullFilePath.replace(webRoot, '');
  return [fullFilePath, webPath, name];
};

async function getVideoInfo(absPath: string): Promise<VideoInfo | number> {
  try {
    const info = await ffprobe(absPath, {
      path: ffprobeStatic.path
    });
    return info;
  } catch (err) {
    return 0;
  }
}

export async function getListings(webRoot: string, fullAbsDirPath: string): Promise<ListingsResult> {
  const dirs: FileNode[] = [];
  const files: FileNode[] = [];
  const media: FileNode[] = [];
  let thumbnail: string | undefined;

  const nodes = await readdirAsync(fullAbsDirPath);

  for (let nodeName of nodes) {
    const nodeStats = await statAsync(path.join(fullAbsDirPath, nodeName));
    let container: FileNode[] = nodeStats.isDirectory()
      ? dirs
      : isMedia(nodeName)
        ? media
        : files;

    let duration: number = 0;
    if (!nodeStats.isDirectory()) {
      if (isVideo(nodeName)) {
        const videoInfo = await getVideoInfo(path.join(fullAbsDirPath, nodeName));
        if (typeof videoInfo !== 'number' && videoInfo.streams?.[0]?.duration) {
          duration = Number(videoInfo.streams[0].duration * 1000);
        }
      }
      else if (isPic(nodeName)) {
        const img = await getItemViaPath(db as any, path.join(fullAbsDirPath, nodeName));
        thumbnail = img?.thumbnail;
      }
    }

    container.push({
      name: nodeName,
      webPath: path.join(`${fullAbsDirPath.replace(webRoot, '')}`, nodeName),
      fullPath: path.join(fullAbsDirPath, nodeName),
      thumbnail: thumbnail,
      isDirectory: nodeStats.isDirectory(),
      duration,
      id: null,
      favorite: null
    });
  }

  return {
    dirs,
    files,
    media
  };
}

export function constructMediaListingsFromDb(dbItems: DbItem[], webRoot: string): ListingsResult {
  return {
    dirs: [],
    files: [],
    media: dbItems.map(dbItem => {
      const [fullFilePath, webPath, name] = getInfoFromDbItem(dbItem, webRoot);

      return {
        name: name,
        webPath: webPath,
        fullPath: fullFilePath,
        thumbnail: dbItem.thumbnail,
        id: dbItem.id,
        favorite: dbItem.favorite,
        marked: dbItem.marked,
        isDirectory: false,
        duration: null
      };
    })
  };
}

export async function constructItemFromDb(dbItem: DbItem, webRoot: string): Promise<FileNode> {
  const [fullFilePath, webPath, name] = getInfoFromDbItem(dbItem, webRoot);
  let duration: number = 0;
  if (isVideo(fullFilePath)) {
    const videoInfo = await getVideoInfo(fullFilePath);
    if (typeof videoInfo !== 'number' && videoInfo.streams?.[0]?.duration) {
      duration = Number(videoInfo.streams[0].duration * 1000);
    }
  }

  /*
  db returns {id: null, tagValue: null} when none found
  random doesn't join on tags so we set to empty
  */
  let tags: Array<{ id: number; value: string }> = [];
  if (dbItem.tags && dbItem.tags.length) {
    tags = dbItem.tags[0].id === null ? [] : dbItem.tags;
  }

  return {
    name: name,
    webPath,
    fullPath: fullFilePath,
    thumbnail: dbItem.thumbnail,
    isDirectory: false,
    duration,
    id: dbItem.id,
    favorite: dbItem.favorite,
    marked: dbItem.marked,
    tags,
    faceCount: dbItem.face_count
  };
}

export async function recursiveTraverseDir(
  fullAbsDirPath: string,
  fileCallbackFn: (nodePath: string) => void | Promise<void> = () => { }
): Promise<number> {
  let count = 0;
  const nodes = await readdirAsync(fullAbsDirPath);
  count += nodes.length;

  for (let nodeName of nodes) {
    const nodePath = path.join(fullAbsDirPath, nodeName);
    const nodeStats = await statAsync(nodePath);

    if (nodeStats.isDirectory()) {
      count += await recursiveTraverseDir(nodePath, fileCallbackFn);
    } else {
      await fileCallbackFn(nodePath);
    }
  }
  return count;
}
