#!/usr/bin/env node
import express from 'express';
import morgan from 'morgan';

import { errorMiddleware } from './middleware/error.ts';
import { clientRouter } from './routes/client/router.ts';
import { dirRouter } from './routes/dir/router.ts';
import { fileRouter } from './routes/file/router.ts';
import { mediaRouter } from './routes/media/router.ts';
import { printRouter } from './routes/print/router.ts';
import { randomRouter } from './routes/random/router.ts';
import { metadataRouter } from './routes/metadata/router.ts';

export const app = express();

// TODO replace morgan with pino logger
app.use(morgan('dev'))
app.use(express.json());

app.use(clientRouter)
app.use(printRouter)
app.use(randomRouter)
app.use(mediaRouter)
app.use(fileRouter)
app.use(dirRouter)
app.use(metadataRouter)

app.use(errorMiddleware);

