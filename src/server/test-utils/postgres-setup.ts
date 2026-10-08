import { execSync } from 'child_process';

function setup() {
  try {
    execSync(
      'docker container run -d --rm --name test-postgres-container -p 5432:5432 -e POSTGRES_PASSWORD=password -e POSTGRES_DB=saas postgres',
      { stdio: 'inherit' },
    );
  } catch (error) {
    console.log('Failed to start a test container:', error);
    process.exit(1);
  }
}

function teardown() {
  try {
    execSync('docker stop test-postgres-container', { stdio: 'inherit' });
  } catch (error) {
    console.log('Failed to stop a test container', error);
  }
}

export { setup, teardown };
