import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import MessageScheduler from './MessageScheduler';
import { messageApi, groupApi, scheduleApi } from '../services/api';
import { LanguageProvider } from '../contexts/LanguageContext';

// Mock the API modules
jest.mock('../services/api');

// Mock react-select
jest.mock('react-select', () => ({
  __esModule: true,
  default: ({ options, onChange, placeholder, value }: any) => (
    <select
      data-testid={placeholder}
      onChange={(e) => {
        const selectedOption = options.find((opt: any) => opt.value === Number(e.target.value));
        onChange(selectedOption);
      }}
      value={value?.value || ''}
    >
      <option value="">{placeholder}</option>
      {options.map((option: any) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

// Mock react-datepicker
jest.mock('react-datepicker', () => ({
  __esModule: true,
  default: ({ onChange, selected, placeholderText }: any) => (
    <input
      type="datetime-local"
      placeholder={placeholderText}
      value={selected ? selected.toISOString().slice(0, 16) : ''}
      onChange={(e) => onChange(new Date(e.target.value))}
      data-testid="date-picker"
    />
  ),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Helper function to render component with providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <LanguageProvider>
        {component}
      </LanguageProvider>
    </BrowserRouter>
  );
};

describe('MessageScheduler Component', () => {
  const mockMessages = [
    { id: 1, title: 'Test Message 1', content: 'Content 1' },
    { id: 2, title: 'Test Message 2', content: 'Content 2' },
  ];

  const mockGroups = [
    { id: 1, name: 'Group 1', recipients: [{ id: 1 }, { id: 2 }] },
    { id: 2, name: 'Group 2', recipients: [{ id: 3 }] },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (messageApi.getAll as jest.Mock).mockResolvedValue({ data: mockMessages });
    (groupApi.getAll as jest.Mock).mockResolvedValue({ data: mockGroups });
  });

  it('renders the component and loads initial data', async () => {
    renderWithProviders(<MessageScheduler />);

    // Check title is rendered
    expect(screen.getByText('scheduler.title')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(messageApi.getAll).toHaveBeenCalled();
      expect(groupApi.getAll).toHaveBeenCalled();
    });
  });

  it('displays error when failing to fetch messages', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    (messageApi.getAll as jest.Mock).mockRejectedValue(new Error('API Error'));

    renderWithProviders(<MessageScheduler />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Error fetching messages:', expect.any(Error));
    });

    consoleError.mockRestore();
  });

  it('displays error when failing to fetch groups', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    (groupApi.getAll as jest.Mock).mockRejectedValue(new Error('API Error'));

    renderWithProviders(<MessageScheduler />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Error fetching groups:', expect.any(Error));
    });

    consoleError.mockRestore();
  });

  it('shows error when submitting without filling all fields', async () => {
    renderWithProviders(<MessageScheduler />);

    await waitFor(() => {
      expect(messageApi.getAll).toHaveBeenCalled();
    });

    const submitButton = screen.getByRole('button', { name: /scheduler.scheduleButton/i });
    fireEvent.click(submitButton);

    expect(screen.getByText('scheduler.errorFillFields')).toBeInTheDocument();
  });

  it('successfully schedules a message', async () => {
    (scheduleApi.create as jest.Mock).mockResolvedValue({ data: { id: 1 } });

    renderWithProviders(<MessageScheduler />);

    await waitFor(() => {
      expect(messageApi.getAll).toHaveBeenCalled();
    });

    // Select message
    const messageSelect = screen.getByTestId('scheduler.selectMessage');
    fireEvent.change(messageSelect, { target: { value: '1' } });

    // Select group
    const groupSelect = screen.getByTestId('scheduler.selectGroup');
    fireEvent.change(groupSelect, { target: { value: '1' } });

    // Select date
    const datePicker = screen.getByTestId('date-picker');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    fireEvent.change(datePicker, { 
      target: { value: futureDate.toISOString().slice(0, 16) } 
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /scheduler.scheduleButton/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(scheduleApi.create).toHaveBeenCalledWith({
        message_id: 1,
        group_id: 1,
        scheduled_time: expect.any(String),
      });
      expect(screen.getByText('scheduler.successMessage')).toBeInTheDocument();
    });
  });

  it('handles scheduling error from API', async () => {
    const errorMessage = 'API Error';
    (scheduleApi.create as jest.Mock).mockRejectedValue({
      response: { data: { detail: errorMessage } }
    });

    renderWithProviders(<MessageScheduler />);

    await waitFor(() => {
      expect(messageApi.getAll).toHaveBeenCalled();
    });

    // Fill form
    fireEvent.change(screen.getByTestId('scheduler.selectMessage'), { target: { value: '1' } });
    fireEvent.change(screen.getByTestId('scheduler.selectGroup'), { target: { value: '1' } });
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    fireEvent.change(screen.getByTestId('date-picker'), { 
      target: { value: futureDate.toISOString().slice(0, 16) } 
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /scheduler.scheduleButton/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('opens and closes new message modal', async () => {
    renderWithProviders(<MessageScheduler />);

    await waitFor(() => {
      expect(messageApi.getAll).toHaveBeenCalled();
    });

    // Open modal
    const newMessageButton = screen.getByText('scheduler.newMessage');
    fireEvent.click(newMessageButton);

    expect(screen.getByText('scheduler.createNewMessage')).toBeInTheDocument();

    // Close modal
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(screen.queryByText('scheduler.createNewMessage')).not.toBeInTheDocument();
  });

  it('creates a new message successfully', async () => {
    const newMessage = { id: 3, title: 'New Message', content: 'New Content' };
    (messageApi.create as jest.Mock).mockResolvedValue({ data: newMessage });

    renderWithProviders(<MessageScheduler />);

    await waitFor(() => {
      expect(messageApi.getAll).toHaveBeenCalled();
    });

    // Open modal
    fireEvent.click(screen.getByText('scheduler.newMessage'));

    // Fill form
    const titleInput = screen.getByLabelText('scheduler.messageTitle');
    const contentInput = screen.getByLabelText('scheduler.content');

    await userEvent.type(titleInput, 'New Message');
    await userEvent.type(contentInput, 'New Content');

    // Submit
    const createButton = screen.getByRole('button', { name: /scheduler.createMessage/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(messageApi.create).toHaveBeenCalledWith({
        title: 'New Message',
        content: 'New Content'
      });
      expect(screen.queryByText('scheduler.createNewMessage')).not.toBeInTheDocument();
    });
  });

  it('shows error when creating message fails', async () => {
    (messageApi.create as jest.Mock).mockRejectedValue(new Error('API Error'));

    renderWithProviders(<MessageScheduler />);

    await waitFor(() => {
      expect(messageApi.getAll).toHaveBeenCalled();
    });

    // Open modal and fill form
    fireEvent.click(screen.getByText('scheduler.newMessage'));
    
    await userEvent.type(screen.getByLabelText('scheduler.messageTitle'), 'New Message');
    await userEvent.type(screen.getByLabelText('scheduler.content'), 'New Content');

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /scheduler.createMessage/i }));

    await waitFor(() => {
      expect(screen.getByText('scheduler.errorCreate')).toBeInTheDocument();
    });
  });

  it('navigates to recipients page when clicking new group button', async () => {
    renderWithProviders(<MessageScheduler />);

    await waitFor(() => {
      expect(groupApi.getAll).toHaveBeenCalled();
    });

    const newGroupButton = screen.getByText('scheduler.newGroup');
    fireEvent.click(newGroupButton);

    expect(mockNavigate).toHaveBeenCalledWith('/recipients?tab=groups&action=create');
  });

  it('disables submit button while loading', async () => {
    (scheduleApi.create as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    renderWithProviders(<MessageScheduler />);

    await waitFor(() => {
      expect(messageApi.getAll).toHaveBeenCalled();
    });

    // Fill form
    fireEvent.change(screen.getByTestId('scheduler.selectMessage'), { target: { value: '1' } });
    fireEvent.change(screen.getByTestId('scheduler.selectGroup'), { target: { value: '1' } });
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    fireEvent.change(screen.getByTestId('date-picker'), { 
      target: { value: futureDate.toISOString().slice(0, 16) } 
    });

    // Submit
    const submitButton = screen.getByRole('button', { name: /scheduler.scheduleButton/i });
    fireEvent.click(submitButton);

    // Check button is disabled
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('scheduler.scheduling')).toBeInTheDocument();
  });

  it('validates new message form fields', async () => {
    renderWithProviders(<MessageScheduler />);

    await waitFor(() => {
      expect(messageApi.getAll).toHaveBeenCalled();
    });

    // Open modal
    fireEvent.click(screen.getByText('scheduler.newMessage'));

    // Try to submit without filling fields
    const form = screen.getByLabelText('scheduler.messageTitle').closest('form');
    fireEvent.submit(form!);

    // Check that messageApi.create was not called
    expect(messageApi.create).not.toHaveBeenCalled();
  });

  it('cancels new message creation', async () => {
    renderWithProviders(<MessageScheduler />);

    await waitFor(() => {
      expect(messageApi.getAll).toHaveBeenCalled();
    });

    // Open modal
    fireEvent.click(screen.getByText('scheduler.newMessage'));

    // Fill some data
    await userEvent.type(screen.getByLabelText('scheduler.messageTitle'), 'Test');

    // Cancel
    const cancelButton = screen.getByRole('button', { name: /scheduler.cancel/i });
    fireEvent.click(cancelButton);

    // Modal should be closed
    expect(screen.queryByText('scheduler.createNewMessage')).not.toBeInTheDocument();
  });
});