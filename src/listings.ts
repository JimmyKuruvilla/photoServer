
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

import ffprobe, { FFProbeResult } from 'ffprobe';
import ffprobeStatic from 'ffprobe-static';
import { isMedia, isVideo, isPic } from './guards.ts';
import { getItemViaPath } from './db.js';

const statAsync = promisify(fs.stat);
const readdirAsync = promisify(fs.readdir);


import { dockerDb, localDb } from './db/initDb.ts';
const isDockerDb = process.env.DOCKERDB;
const db = isDockerDb ? await dockerDb() : await localDb();

export interface FileItem {
  name: string;
  dbPath: string;
  viewPath: string;
  parentViewPath: string;
  srcPath: string;
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

export interface DirList {
  dirs: FileItem[];
  files: FileItem[];
  media: FileItem[];
}

const createFileViewPath = (fullAbsPath: string = '', name: string = '') => path.join('/fileView', fullAbsPath, name)
const createFilePath = (fullAbsPath: string = '', name: string = '') => path.join('/file', fullAbsPath, name)
const createDirViewPath = (fullAbsPath: string = '', name: string = '') => path.join('/dirView', fullAbsPath, name)
const createParentDirViewPath = (fullAbsPath: string) => createDirViewPath(fullAbsPath).split(path.sep).slice(0, -1).join(path.sep)

const getInfoFromDbItem = (dbItem: DbItem) => {
  const dbPath = dbItem.path;
  const name = dbPath.replace(/.*\//, '');

  return {
    dbPath,
    srcPath: createFilePath(dbPath),
    viewPath: createFileViewPath(dbPath),
    parentViewPath: createParentDirViewPath(dbPath),
    name
  };
};

async function getVideoInfo(absPath: string): Promise<Partial<FFProbeResult>> {
  try {
    const info = await ffprobe(absPath, { path: ffprobeStatic.path });
    return info;
  } catch (err) {
    return { streams: [{ duration: '0' }] } as Partial<FFProbeResult>;
  }
}

export async function getListings(fullAbsDirPath: string): Promise<DirList> {
  const dirs: FileItem[] = [];
  const files: FileItem[] = [];
  const media: FileItem[] = [];
  let thumbnail: string | undefined;

  const nodes = await readdirAsync(fullAbsDirPath);

  for (let nodeName of nodes) {
    const fullAbsFilePath = path.join(fullAbsDirPath, nodeName)
    const nodeStats = await statAsync(fullAbsFilePath);
    const isDir = nodeStats.isDirectory()
    let container: FileItem[] = isDir
      ? dirs
      : isMedia(nodeName)
        ? media
        : files;

    let duration: number = 0;
    if (!isDir) {
      if (isVideo(nodeName)) {
        const videoInfo = await getVideoInfo(fullAbsFilePath);
        if (videoInfo.streams?.[0]?.duration) {
          duration = Number(videoInfo.streams[0].duration) * 1000;
        }
      }
      else if (isPic(nodeName)) {
        const img = await getItemViaPath(db as any, fullAbsFilePath);
        thumbnail = img?.thumbnail;
      }
    }
    const viewPathFn = isDir ? createDirViewPath : createFileViewPath

    container.push({
      name: nodeName,
      dbPath: fullAbsFilePath,
      srcPath: createFilePath(fullAbsDirPath, nodeName),
      viewPath: viewPathFn(fullAbsDirPath, nodeName),
      parentViewPath: createParentDirViewPath(fullAbsDirPath),
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

export function constructMediaListingsFromDb(dbItems: DbItem[]): DirList {
  return {
    dirs: [],
    files: [],
    media: dbItems.map(dbItem => {
      const { dbPath, srcPath, name, viewPath, parentViewPath } = getInfoFromDbItem(dbItem);

      return {
        name: name,
        dbPath,
        srcPath,
        viewPath,
        parentViewPath,
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

export async function constructFileViewFromDb(dbItem: DbItem): Promise<FileItem> {
  const { dbPath, srcPath, name, viewPath, parentViewPath } = getInfoFromDbItem(dbItem);
  let duration: number = 0;
  if (isVideo(dbPath)) {
    const videoInfo = await getVideoInfo(dbPath);
    if (videoInfo.streams?.[0]?.duration) {
      duration = Number(videoInfo.streams[0].duration) * 1000;
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
    dbPath,
    srcPath,
    viewPath,
    parentViewPath,
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
