
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
  viewPath?: string;
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
const getInfoFromDbItem = (dbItem: DbItem, webRoot: string) => {
  const fullFilePath = dbItem.path;
  const name = fullFilePath.replace(/.*\//, '');
  return {
    fullFilePath: dbItem.path,
    srcPath: createFilePath(fullFilePath),
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

export async function getListings(webRoot: string, fullAbsDirPath: string): Promise<DirList> {
  const dirs: FileItem[] = [];
  const files: FileItem[] = [];
  const media: FileItem[] = [];
  let thumbnail: string | undefined;

  const nodes = await readdirAsync(fullAbsDirPath);

  for (let nodeName of nodes) {
    const nodeStats = await statAsync(path.join(fullAbsDirPath, nodeName));
    const isDir = nodeStats.isDirectory()
    let container: FileItem[] = isDir
      ? dirs
      : isMedia(nodeName)
        ? media
        : files;

    let duration: number = 0;
    if (!isDir) {
      if (isVideo(nodeName)) {
        const videoInfo = await getVideoInfo(path.join(fullAbsDirPath, nodeName));
        if (videoInfo.streams?.[0]?.duration) {
          duration = Number(videoInfo.streams[0].duration) * 1000;
        }
      }
      else if (isPic(nodeName)) {
        const img = await getItemViaPath(db as any, path.join(fullAbsDirPath, nodeName));
        thumbnail = img?.thumbnail;
      }
    }
    const viewPathFn = isDir ? createDirViewPath : createFileViewPath

    container.push({
      name: nodeName,
      srcPath: createFilePath(fullAbsDirPath, nodeName),
      viewPath: viewPathFn(fullAbsDirPath, nodeName),
      thumbnail: thumbnail,
      isDirectory: nodeStats.isDirectory(),
      duration,
      id: null,
      favorite: null
    });
  }
  // all these webroots should be imported not passed. 

  return {
    dirs,
    files,
    media
  };
}

// fix me
export function constructMediaListingsFromDb(dbItems: DbItem[], webRoot: string): DirList {
  return {
    dirs: [],
    files: [],
    media: dbItems.map(dbItem => {
      const { fullFilePath, srcPath, name } = getInfoFromDbItem(dbItem, webRoot);

      return {
        name: name,
        srcPath,
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

export async function constructFileViewFromDb(dbItem: DbItem, webRoot: string): Promise<FileItem> {
  const { fullFilePath, srcPath, name } = getInfoFromDbItem(dbItem, webRoot);
  let duration: number = 0;
  if (isVideo(fullFilePath)) {
    const videoInfo = await getVideoInfo(fullFilePath);
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
    srcPath,
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
