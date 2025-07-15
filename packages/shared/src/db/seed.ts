import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

// This is a placeholder seed script
// In a real scenario, you would get the D1 database instance from your environment
export async function seed(db: D1Database) {
  const drizzleDb = drizzle(db, { schema });

  console.log('Seeding database...');

  // Create a test user
  const testUser = await drizzleDb
    .insert(schema.users)
    .values({
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      password: 'hashed_password_here', // In real app, this would be properly hashed
      emailVerified: true,
      enabled: true,
    })
    .returning()
    .get();

  console.log('Created test user:', testUser);

  // Create some sample todos
  await drizzleDb.insert(schema.todos).values([
    {
      userId: testUser.id,
      title: 'Complete project setup',
      description: 'Set up the monorepo with all necessary tools',
      status: 'COMPLETED',
      priority: 'HIGH',
    },
    {
      userId: testUser.id,
      title: 'Implement authentication',
      description: 'Add Lucia Auth with OAuth providers',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
    },
    {
      userId: testUser.id,
      title: 'Write documentation',
      description: 'Document the API and setup process',
      status: 'PENDING',
      priority: 'MEDIUM',
    },
  ]);

  // Create a sample event
  await drizzleDb.insert(schema.events).values({
    userId: testUser.id,
    title: 'Project Launch Meeting',
    description: 'Discuss the launch strategy for Personal Hub',
    startDateTime: new Date('2024-02-01T10:00:00Z'),
    endDateTime: new Date('2024-02-01T11:00:00Z'),
    allDay: false,
    reminderMinutes: 15,
  });

  // Create a sample note
  await drizzleDb.insert(schema.notes).values({
    userId: testUser.id,
    title: 'Project Ideas',
    content: 'Ideas for future features:\n- Dark mode\n- Mobile app\n- API integrations',
    tags: JSON.stringify(['ideas', 'features']),
  });

  // Create a sample goal
  await drizzleDb.insert(schema.goals).values({
    userId: testUser.id,
    title: 'Complete Migration',
    description: 'Migrate all features from the legacy Personal Hub',
    type: 'MONTHLY',
    targetValue: 100,
    currentValue: 25,
    unit: 'percent',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    status: 'ACTIVE',
  });

  // Create pomodoro config for the user
  await drizzleDb.insert(schema.pomodoroConfigs).values({
    userId: testUser.id,
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    soundEnabled: true,
  });

  console.log('Database seeded successfully!');
}

// For CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Seed script can only be run through Wrangler D1 commands');
  console.log('Use: wrangler d1 execute personal-hub-db --local --file=./migrations/seed.sql');
}