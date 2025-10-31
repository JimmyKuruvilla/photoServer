// #!/usr/bin/env node
// import { unlink } from 'fs/promises';
// import { COLS, TABLES } from '../../src/constants.ts';
// import { localDb } from '../../src/db/initDb.ts';
// import { log } from '../lib/log.ts';

// /*
//  Search db for a file path pattern, and delete those files from disk, and from db
//  Requires aws sync --delete to remove from remote
// */

// const db = await localDb();

// (async () => {
//   const recordsStream = await db(TABLES.MEDIA).whereILike(COLS.MEDIA.PATH, '%.avi').stream()

//   for await (const record of recordsStream) {
//     try {
//       await unlink(record.path)
//       await db(TABLES.MEDIA).where('id', record.id).delete()
//       console.log(record.path);
//     } catch (error: any) {
//       log(`ERROR: ${error.message}`)
//     }
//   }
//   process.exit();
// })();
// // 