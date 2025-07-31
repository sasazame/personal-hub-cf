#!/bin/bash

# Replace array inserts with individual inserts for line 153
sed -i '153,161d' src/__tests__/integration/analytics.integration.db.test.ts
sed -i '153i\      for (const todoData of [\
        {\
          ...createTestTodoData(testUser.id, { status: '\''DONE'\'' }),\
          updatedAt: today + '\''T10:00:00.000Z'\'',\
        },\
        {\
          ...createTestTodoData(testUser.id, { status: '\''DONE'\'' }),\
          updatedAt: today + '\''T14:00:00.000Z'\'',\
        },\
        {\
          ...createTestTodoData(testUser.id, { status: '\''DONE'\'' }),\
          updatedAt: yesterday + '\''T10:00:00.000Z'\'',\
        },\
      ]) {\
        await db.insert(schema.todos).values(todoData);\
      }' src/__tests__/integration/analytics.integration.db.test.ts

# Fix line around 256
sed -i '/await db\.insert(schema\.todos)\.values(\[/{
N
N  
N
N
N
s/await db\.insert(schema\.todos)\.values(\[\n.*\n.*\n.*\n.*\]);/for (const todoData of [\
        {\
          ...createTestTodoData(testUser.id, { status: '\''DONE'\'' }),\
          createdAt: new Date().toISOString().replace(\/T\\d{2}\/, '\''T09'\''),\
        },\
        {\
          ...createTestTodoData(testUser.id, { status: '\''DONE'\'' }),\
          createdAt: new Date().toISOString().replace(\/T\\d{2}\/, '\''T09'\''),\
        },\
        {\
          ...createTestTodoData(testUser.id, { status: '\''DONE'\'' }),\
          createdAt: new Date().toISOString().replace(\/T\\d{2}\/, '\''T14'\''),\
        },\
      ]) {\
        await db.insert(schema.todos).values(todoData);\
      }/
}' src/__tests__/integration/analytics.integration.db.test.ts