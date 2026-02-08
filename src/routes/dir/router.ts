import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { SERVED_PATH } from '../../constants.ts';
import { ListingsPage } from '../../templates/listings.ts';
import { getListings } from '../../services/listings.ts';
export const dirRouter = express.Router();

/**
 * Directory listing at root
 */
dirRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  const listings = await getListings(SERVED_PATH);
  res.send(ListingsPage(listings));
});

/**
 * Directory listing at path
 */
dirRouter.get('/dirView/:path(*)', async (req: Request, res: Response, next: NextFunction) => {
  const targetPath = path.join(path.sep, req.params.path);
  try {
    const listings = await getListings(targetPath);
    res.send(ListingsPage(listings));
  } catch (error: any) {
    next(error)
  }
});