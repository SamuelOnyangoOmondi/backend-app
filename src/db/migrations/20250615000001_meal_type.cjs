/** Add meal_type to meal_events for breakfast/lunch/supper/snack (dashboard). */
exports.up = async function (knex) {
  await knex.schema.alterTable('meal_events', (t) => {
    t.string('meal_type').defaultTo('lunch');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('meal_events', (t) => {
    t.dropColumn('meal_type');
  });
};
