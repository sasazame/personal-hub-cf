import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8787';

export interface TestUser {
  email: string;
  password: string;
  username: string;
}

export const defaultTestUser: TestUser = {
  email: 'test@example.com',
  password: 'Password123!',
  username: 'testuser',
};

export async function ensureTestUser(user: TestUser = defaultTestUser): Promise<void> {
  try {
    // First try to login
    const loginResponse = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
      usernameOrEmail: user.email,
      password: user.password,
    });

    if (loginResponse.status === 200) {
      console.log(`Test user ${user.email} already exists and can login`);
      return;
    }
  } catch (error) {
    // Login failed, try to register
    console.log(`Test user ${user.email} doesn't exist or can't login, creating...`);
  }

  try {
    // Try to register the user
    const registerResponse = await axios.post(`${API_BASE_URL}/api/v1/auth/register`, {
      email: user.email,
      password: user.password,
      confirmPassword: user.password,
      username: user.username,
    });

    if (registerResponse.status === 201 || registerResponse.status === 200) {
      console.log(`Test user ${user.email} created successfully`);
      return;
    }
  } catch (error: any) {
    if (error.response?.status === 409) {
      // User already exists, that's fine
      console.log(`Test user ${user.email} already exists`);
      return;
    }
    throw new Error(`Failed to create test user: ${error.message}`);
  }
}

// Run if called directly
if (require.main === module) {
  ensureTestUser()
    .then(() => {
      console.log('Test user setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to set up test user:', error);
      process.exit(1);
    });
}