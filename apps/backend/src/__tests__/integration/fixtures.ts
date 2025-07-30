import { nanoid } from 'nanoid';
import { hashPassword } from '../../utils/auth';

export const testUserDefaults = {
  password: 'TestPass123!',
  enabled: true,
  emailVerified: false,
  weekStartDay: 1,
};

export async function createTestUserData(overrides = {}) {
  const id = nanoid();
  const hashedPassword = await hashPassword(testUserDefaults.password);
  
  return {
    id,
    email: `user-${id}@test.com`,
    username: `user-${id}`,
    password: hashedPassword,
    enabled: testUserDefaults.enabled,
    emailVerified: testUserDefaults.emailVerified,
    profilePictureUrl: null,
    givenName: null,
    familyName: null,
    locale: null,
    weekStartDay: testUserDefaults.weekStartDay,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createTestTodoData(userId: string, overrides = {}) {
  return {
    userId,
    title: 'Test Todo',
    description: 'Test Description',
    status: 'TODO',
    priority: 'MEDIUM',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createTestGoalData(userId: string, overrides = {}) {
  return {
    userId,
    title: 'Test Goal',
    description: 'Test Goal Description',
    goalType: 'PERSONAL',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createTestEventData(userId: string, overrides = {}) {
  const startDateTime = new Date();
  const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour later
  
  return {
    userId,
    title: 'Test Event',
    description: 'Test Event Description',
    startDateTime: startDateTime.toISOString(),
    endDateTime: endDateTime.toISOString(),
    location: 'Test Location',
    allDay: false,
    reminderMinutes: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createTestNoteData(userId: string, overrides = {}) {
  return {
    userId,
    title: 'Test Note',
    content: 'Test Note Content',
    tags: 'test,sample',
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}