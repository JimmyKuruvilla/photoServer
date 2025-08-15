import express, { Request, Response, NextFunction } from 'express';
import { printFile, printPage } from '../../pages/print.ts';
import multer from 'multer';
export const printRouter = express.Router();
const upload = multer({ dest: 'share/__print' });

printRouter.get('/print', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.send(printPage())
  } catch (e) {
    next(e)
  }
})

printRouter.post('/print/upload', upload.single('fileToPrint'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.file) {
      await printFile(req.file.path)
    }
  } catch (e) {
    next(e)
  }
})