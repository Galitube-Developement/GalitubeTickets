const {test}=require('node:test');
const assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const fs=require('node:fs');
test('SQLite branding migration preserves guilds, categories, custom footers and foreign keys',()=>{
 const db=new DatabaseSync(':memory:');
 db.exec(fs.readFileSync('db/sqlite/migrations/20230309142817_4_0_0/migration.sql','utf8'));
 db.exec("INSERT INTO guilds (id) VALUES ('old'); INSERT INTO guilds (id,footer) VALUES ('custom','My custom footer');");
 db.exec("INSERT INTO categories (channelName,description,discordCategory,emoji,guildId,name,openingMessage,staffRoles) VALUES ('ticket','Help','discord','ticket','old','Support','Welcome','[]')");
 db.exec(fs.readFileSync('db/sqlite/migrations/20260910170000_galitube_branding/migration.sql','utf8'));
 assert.equal(db.prepare('SELECT count(*) AS n FROM categories').get().n,1);
 assert.equal(db.prepare("SELECT footer FROM guilds WHERE id='old'").get().footer,'Galitube Tickets by Galitube Hosting');
 assert.equal(db.prepare("SELECT footer FROM guilds WHERE id='custom'").get().footer,'My custom footer');
 db.exec("INSERT INTO guilds (id) VALUES ('new')");
 assert.equal(db.prepare("SELECT footer FROM guilds WHERE id='new'").get().footer,'Galitube Tickets by Galitube Hosting');
 assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
 db.close();
});
