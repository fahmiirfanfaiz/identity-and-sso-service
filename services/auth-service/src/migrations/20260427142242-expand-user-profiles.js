/**
 * Migration: Expand users table for mahasiswa/mitra profiles
 */
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'nim', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'university', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'major', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'organization_name', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'organization_type', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_role_new') THEN
          CREATE TYPE "enum_users_role_new" AS ENUM ('mahasiswa', 'mitra', 'admin');
        END IF;
      END $$;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "users"
      ALTER COLUMN "role" DROP DEFAULT,
      ALTER COLUMN "role" TYPE "enum_users_role_new"
      USING (
        CASE
          WHEN "role" = 'client' THEN 'mahasiswa'
          WHEN "role" = 'freelancer' THEN 'mitra'
          ELSE "role"
        END
      )::"enum_users_role_new";
    `);

    await queryInterface.sequelize.query('DROP TYPE "enum_users_role";');
    await queryInterface.sequelize.query('ALTER TYPE "enum_users_role_new" RENAME TO "enum_users_role";');

    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('mahasiswa', 'mitra', 'admin'),
      allowNull: false,
      defaultValue: 'mahasiswa',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_role_old') THEN
          CREATE TYPE "enum_users_role_old" AS ENUM ('client', 'freelancer', 'admin');
        END IF;
      END $$;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "users"
      ALTER COLUMN "role" DROP DEFAULT,
      ALTER COLUMN "role" TYPE "enum_users_role_old"
      USING (
        CASE
          WHEN "role" = 'mahasiswa' THEN 'client'
          WHEN "role" = 'mitra' THEN 'freelancer'
          ELSE "role"
        END
      )::"enum_users_role_old";
    `);

    await queryInterface.sequelize.query('DROP TYPE "enum_users_role";');
    await queryInterface.sequelize.query('ALTER TYPE "enum_users_role_old" RENAME TO "enum_users_role";');

    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('client', 'freelancer', 'admin'),
      allowNull: false,
      defaultValue: 'client',
    });

    await queryInterface.removeColumn('users', 'organization_type');
    await queryInterface.removeColumn('users', 'organization_name');
    await queryInterface.removeColumn('users', 'major');
    await queryInterface.removeColumn('users', 'university');
    await queryInterface.removeColumn('users', 'nim');
  },
};
