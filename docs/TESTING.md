# 🧪 Testing Documentation

## Overview

The WhatsApp Scheduler project includes comprehensive test coverage across backend, frontend, and end-to-end testing. This document outlines the testing strategy, tools, and procedures.

## Test Structure

```
whatsapp-scheduler/
├── backend/
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py              # Pytest configuration and fixtures
│   │   ├── test_whatsapp_service.py # WhatsApp service unit tests
│   │   ├── test_scheduling.py       # Scheduling logic tests
│   │   └── test_api_endpoints.py    # API endpoint integration tests
│   ├── pytest.ini                   # Pytest configuration
│   └── requirements-test.txt        # Testing dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── MessageScheduler.test.tsx  # Component tests
│   │   └── setupTests.ts            # Test setup and mocks
│   └── cypress/
│       ├── e2e/
│       │   └── schedule-message.cy.ts  # E2E tests
│       └── support/
│           └── commands.ts          # Custom Cypress commands
│
└── .github/
    └── workflows/
        └── ci.yml                   # CI/CD pipeline configuration
```

## Backend Testing

### Stack
- **pytest** - Testing framework
- **pytest-asyncio** - Async test support
- **pytest-cov** - Coverage reporting
- **pytest-mock** - Mocking utilities
- **factory-boy** - Test data factories
- **faker** - Fake data generation

### Test Categories

#### 1. WhatsApp Service Tests (`test_whatsapp_service.py`)
Tests the WhatsApp API integration layer:
- Message sending functionality
- Phone number formatting
- Error handling (API errors, network issues)
- Template message support
- Message status retrieval

#### 2. Scheduling Tests (`test_scheduling.py`)
Tests the Celery task scheduling:
- Scheduled message processing
- Partial failure handling
- Task queue management
- Database session management
- Time-based scheduling logic

#### 3. API Endpoint Tests (`test_api_endpoints.py`)
Integration tests for REST API:
- CRUD operations for messages, recipients, groups
- Schedule creation and management
- Input validation
- Error responses
- Pagination and filtering

### Running Backend Tests

```bash
# Install test dependencies
cd backend
pip install -r requirements-test.txt

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_whatsapp_service.py -v

# Run tests matching pattern
pytest -k "test_send_message" -v

# Generate HTML coverage report
pytest --cov=app --cov-report=html
# Open htmlcov/index.html in browser
```

### Backend Test Configuration

The `pytest.ini` file configures:
- Test discovery patterns
- Coverage requirements (80% minimum)
- Output formatting
- Custom markers for test categorization

## Frontend Testing

### Stack
- **Jest** - Testing framework (via Create React App)
- **React Testing Library** - Component testing
- **Cypress** - End-to-end testing
- **TypeScript** - Type-safe tests

### Test Categories

#### 1. Component Tests
- `MessageScheduler.test.tsx` - Main scheduler component
  - Form validation
  - API integration
  - Modal interactions
  - Error handling
  - Loading states

#### 2. Unit Tests
- Utility functions
- Custom hooks
- Context providers

#### 3. E2E Tests (`cypress/e2e/schedule-message.cy.ts`)
- Complete user workflows
- Form submission
- Navigation
- Error scenarios
- Multi-language support

### Running Frontend Tests

```bash
cd frontend

# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run Cypress E2E tests
npm run cypress:open  # Interactive mode
npm run test:e2e      # Headless mode

# Run specific test file
npm test -- MessageScheduler.test.tsx
```

### Frontend Test Configuration

Test setup includes:
- Mock implementations for external libraries (react-select, react-datepicker)
- API mocking
- Router mocking
- Global test utilities

## E2E Testing with Cypress

### Custom Commands
Located in `cypress/support/commands.ts`:
- `cy.login()` - Future authentication support
- `cy.createMessage()` - Create test message via API
- `cy.createRecipient()` - Create test recipient
- `cy.createGroup()` - Create test group

### Test Scenarios
1. **Happy Path** - Complete message scheduling workflow
2. **Error Handling** - API failures, validation errors
3. **Edge Cases** - Past dates, empty groups
4. **Performance** - Loading states, delays
5. **Accessibility** - Keyboard navigation, screen readers

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs:

### 1. Backend Tests
- Python linting (flake8, black, isort)
- Type checking (mypy)
- Unit tests with PostgreSQL and Redis
- Coverage reporting

### 2. Frontend Tests  
- ESLint and TypeScript checking
- Unit tests
- Coverage reporting

### 3. E2E Tests
- Full stack deployment
- Cypress test execution
- Screenshot/video capture on failure

### 4. Additional Checks
- Security scanning (Trivy, Bandit, Safety)
- Performance testing (Locust)
- Docker build verification

## Coverage Requirements

- **Backend**: Minimum 80% coverage
- **Frontend**: Minimum 80% coverage
- Coverage reports uploaded to Codecov

## Test Data Management

### Backend Fixtures
Using `conftest.py`:
- Database session management
- Sample data creation
- Mock external services

### Frontend Mocks
- API response mocks
- Component prop fixtures
- Router state mocks

## Best Practices

### Writing Tests

1. **Descriptive Names**: Use clear, specific test names
   ```python
   def test_send_message_with_invalid_phone_returns_error():
   ```

2. **Arrange-Act-Assert**: Structure tests clearly
   ```python
   # Arrange
   service = WhatsAppService()
   
   # Act
   result = service.send_message("+invalid", "Test")
   
   # Assert
   assert result["success"] is False
   ```

3. **Test One Thing**: Each test should verify a single behavior

4. **Use Fixtures**: Share common setup across tests

5. **Mock External Dependencies**: Don't make real API calls

### Test Organization

1. Group related tests in classes
2. Use descriptive file names
3. Keep tests close to the code they test
4. Separate unit, integration, and E2E tests

## Debugging Tests

### Backend
```bash
# Run tests with debugging output
pytest -vv -s

# Run with pdb debugger
pytest --pdb

# Run specific test with full traceback
pytest tests/test_api.py::TestSchedulesAPI::test_create_scheduled_message -vv
```

### Frontend
```bash
# Run tests in watch mode
npm test

# Debug in VS Code
# Add breakpoints and use Jest debug configuration

# Run Cypress with Chrome DevTools
npm run cypress:open
```

## Performance Testing

Basic Locust configuration included for load testing:
```python
# backend/locustfile.py
from locust import HttpUser, task, between

class WebsiteUser(HttpUser):
    wait_time = between(1, 3)
    
    @task
    def get_messages(self):
        self.client.get("/api/messages/")
```

Run with:
```bash
locust --host=http://localhost:8000
```

## Continuous Improvement

1. **Monitor Coverage Trends**: Track coverage over time
2. **Review Failed Tests**: Analyze patterns in failures
3. **Update Tests**: Keep tests current with code changes
4. **Performance Baselines**: Establish and monitor performance metrics

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure test database is running
   - Check DATABASE_URL in test environment

2. **Import Errors**
   - Verify PYTHONPATH includes project root
   - Check virtual environment activation

3. **Flaky Tests**
   - Add proper waits for async operations
   - Mock time-dependent functionality
   - Ensure test isolation

4. **Coverage Gaps**
   - Run coverage with `--show-missing`
   - Focus on critical paths first
   - Add tests for error conditions

## Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [Jest Documentation](https://jestjs.io/)
- [Cypress Documentation](https://docs.cypress.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Coverage.py Documentation](https://coverage.readthedocs.io/)