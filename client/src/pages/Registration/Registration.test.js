import { render, screen } from '@testing-library/react';
import Registration from './Registration';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router';

describe('<Registration />', () => {
    beforeEach(() => {
        render(
            <MemoryRouter>
                <Registration />
            </MemoryRouter>
        );
    });

    it('should render the registration form', () => {
        const form = screen.getByTestId('register-form');
        expect(form).toBeInTheDocument();
    });

    it('should show the registration heading', () => {
        expect(screen.getByRole('heading', { name: /register/i })).toBeInTheDocument();
    });

    it('should have three role selection radios', () => {
        const roleRadioButtons = screen.getAllByTestId('role-select');
        expect(roleRadioButtons).toHaveLength(3);
    });

    it('should default to the patient role selected', () => {
        expect(screen.getByDisplayValue('patient')).toBeChecked();
    });

    it('should render a submit button labeled Continue', () => {
        const registerButton = screen.getByTestId('register-button');
        expect(registerButton).toBeInTheDocument();
        expect(registerButton).toHaveAttribute('type', 'submit');
        expect(registerButton).toHaveTextContent(/continue/i);
    });
});
