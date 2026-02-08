import express, { Request, Response, NextFunction } from 'express';
import { printFile, PrintPage } from '../../templates/print.ts';
import multer from 'multer';
export const printRouter = express.Router();
const upload = multer({ dest: 'share/__print' });

printRouter.get('/print', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.send(PrintPage())
  } catch (e) {
    next(e)
  }
})

printRouter.post('/print/upload', upload.single('fileToPrint'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(req.file)
    
    if (req.file) {
      await printFile(req.file.path)
    }
    res.status(201).send(PrintPage())
  } catch (e) {
    next(e)
  }
})