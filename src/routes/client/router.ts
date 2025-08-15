import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
const __dirname = import.meta.dirname;

export const clientRouter = express.Router();

clientRouter.get(/.*[/]{1,1}(.*)\.css$/, (req: Request, res: Response, next: NextFunction) => {
  res.sendFile(path.join(__dirname, `../../client/styles/${req.params[0]}.css`));
});

clientRouter.get(/.*[/]{1,1}(.*)\.js$/, (req: Request, res: Response, next: NextFunction) => {
  res.sendFile(path.join(__dirname, `../../client/scripts/${req.params[0]}.js`));
});

clientRouter.get('/favicon.ico/', (req: Request, res: Response, next: NextFunction) => {
  res.sendFile(path.join(__dirname, '../../client/assets/favicon.ico'));
});
