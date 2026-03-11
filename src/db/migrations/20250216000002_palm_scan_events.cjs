/** @param { import("knex").Knex } knex */
exports.up = async function (knex) {
  await knex.schema.createTable('palm_scan_events', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('terminal_id').notNullable();
    t.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    t.bigInteger('ts').notNullable();
    t.string('match_status').notNullable(); // VERIFIED, LOW_CONFIDENCE, NO_MATCH
    t.uuid('student_id').nullable().references('id').inTable('students').onDelete('SET NULL');
    t.string('external_id').nullable();
    t.float('confidence').nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

/** @param { import("knex").Knex } knex */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('palm_scan_events');
};
