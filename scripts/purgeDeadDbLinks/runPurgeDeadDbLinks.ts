#!/usr/bin/env node

/*
 Check if db file path exists, and if not delete it from db
 tsx purgeDeadDbLinks.ts
*/

import { purgeDeadDbLinks } from './purgeDeadDbLinks.ts';

(async () => {
  await purgeDeadDbLinks()
  process.exit();
})();
