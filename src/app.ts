#!/usr/bin/env node
import express from 'express';
import morgan from 'morgan';

import { printRouter } from './routes/print/router.ts';
import { clientRouter } from './routes/client/router.ts';
import { randomRouter } from './routes/random/router.ts';
import { errorMiddleware } from './middleware/error.ts';
import { mediaRouter } from './routes/media/router.ts';
import { fileRouter } from './routes/file/router.ts';
import { dirRouter } from './routes/dir/router.ts';

export const app = express();

app.use(morgan('dev'))
app.use(express.json());

app.use(clientRouter)
app.use(printRouter)
app.use(randomRouter)
app.use(mediaRouter)
app.use(fileRouter)
app.use(dirRouter)

app.use(errorMiddleware);

