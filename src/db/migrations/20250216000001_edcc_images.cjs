/** @param { import("knex").Knex } knex */
exports.up = async function (knex) {
  await knex.schema.alterTable('palm_templates', (t) => {
    t.binary('rgb_image_enc').nullable();
    t.binary('ir_image_enc').nullable();
  });
};

/** @param { import("knex").Knex } knex */
exports.down = async function (knex) {
  await knex.schema.alterTable('palm_templates', (t) => {
    t.dropColumn('rgb_image_enc');
    t.dropColumn('ir_image_enc');
  });
};
