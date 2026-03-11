/** @param { import("knex").Knex } knex */
exports.up = async function (knex) {
  await knex.schema.alterTable('palm_scan_events', (t) => {
    t.string('source').notNullable().defaultTo('local'); // local | edcc
  });
};

/** @param { import("knex").Knex } knex */
exports.down = async function (knex) {
  await knex.schema.alterTable('palm_scan_events', (t) => {
    t.dropColumn('source');
  });
};

