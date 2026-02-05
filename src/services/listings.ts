
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

import ffprobe, { FFProbeResult } from 'ffprobe';
import ffprobeStatic from 'ffprobe-static';
import { DbMedia, DbMediaWithTags, DbTag, getItemByPath } from '../db.ts';
import { isImage, isMedia, isVideo } from '../guards.ts';

const statAsync = promisify(fs.stat);
const readdirAsync = promisify(fs.readdir);

import { getDb } from '../db/initDb.ts';
import { StructuredImageDescriptionResponseJson } from '../libs/models/prompts.ts';
const db = await getDb();

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
  tags?: Array<{ id: number; value: string }>;
  faceCount?: number | null;
  metadata?: StructuredImageDescriptionResponseJson | null;
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

const getInfoFromDbItem = (dbItem: DbMedia) => {
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
      else if (isImage(nodeName)) {
        const img = await getItemByPath(db as any, fullAbsFilePath);
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
    });
  }

  return {
    dirs,
    files,
    media
  };
}

export function constructMediaListingsFromDb(dbItems: DbMedia[]): DirList {
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
        isDirectory: false,
        duration: null
      };
    })
  };
}

export async function constructFileViewFromDb(dbItem: DbMediaWithTags): Promise<FileItem> {
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
  */
  const tags: DbTag[] = dbItem.tags[0].id === null ? [] : dbItem.tags;

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
    tags,
    faceCount: dbItem.face_count,
    metadata: dbItem.metadata
  };
}

