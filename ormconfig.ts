module.exports = [
  {
    type: 'postgres',
    url: 'postgresql://postgres:KSvmIsYKeKnOJztSvhkS@containers-us-west-3.railway.app:7303/railway',
    entities: ['dist/**/*.entity{.ts,.js}'],
    synchronize: false,
    migrations: ['dist/migrations/*{.ts,.js}'],
    cli: {
      migrationsDir: 'src/migrations',
    },
  },
];
