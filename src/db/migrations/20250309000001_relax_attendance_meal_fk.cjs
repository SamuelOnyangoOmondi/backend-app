/** Relax FK constraints on attendance_events and meal_events so device can sync
 *  with student_id/school_id from Supabase (which may not exist in backend's students/schools). */
/** @param { import("knex").Knex } knex */
exports.up = async function (knex) {
  await knex.schema.alterTable('attendance_events', (t) => {
    t.dropForeign('student_id');
    t.dropForeign('school_id');
  });
  await knex.schema.alterTable('meal_events', (t) => {
    t.dropForeign('student_id');
    t.dropForeign('school_id');
  });
};

/** @param { import("knex").Knex } knex */
exports.down = async function (knex) {
  await knex.schema.alterTable('attendance_events', (t) => {
    t.foreign('student_id').references('id').inTable('students');
  });
  await knex.schema.alterTable('attendance_events', (t) => {
    t.foreign('school_id').references('id').inTable('schools');
  });
  await knex.schema.alterTable('meal_events', (t) => {
    t.foreign('student_id').references('id').inTable('students');
  });
  await knex.schema.alterTable('meal_events', (t) => {
    t.foreign('school_id').references('id').inTable('schools');
  });
};
