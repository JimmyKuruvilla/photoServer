"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.localDb = exports.dockerDb = void 0;
const dockerDb = () => {
    return require('knex')({
        client: 'pg',
        connection: {
            host: 'db',
            port: '5432',
            user: 'postgres',
            password: 'example',
            database: 'postgres'
        }
    });
};
exports.dockerDb = dockerDb;
const localDb = () => {
    return require('knex')({
        client: 'pg',
        pool: { min: 0, max: 7 },
        connection: {
            host: '127.0.0.1',
            port: '54320',
            user: 'postgres',
            password: 'example',
            database: 'postgres'
        }
    });
};
exports.localDb = localDb;
//# sourceMappingURL=initDb.js.map