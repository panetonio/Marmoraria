

import React from 'react';
// FIX: Add import for jest-dom to provide custom matchers and fix TypeScript errors.
import '@testing-library/jest-dom';
// FIX: Import jest globals to resolve TS errors.
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuotesPage from './QuotesPage';

// Mock child components that are not essential for this test suite
jest.mock('../components/QuotePreview', () => ({ quote, onClose }: { quote: any, onClose: () => void }) => (
  <div data-testid="quote-preview">
    <h1>Preview for {quote.id}</h1>
    <button onClick={onClose}>Close Preview</button>
  </div>
));

jest.mock('../components/CuttingOptimizer', () => ({ onClose }: { onClose: () => void }) => (
    <div data-testid="cutting-optimizer">
      <h1>Optimizer</h1>
      <button onClick={onClose}>Close Optimizer</button>
    </div>
));


describe('QuotesPage', () => {
    describe('Filtering Logic', () => {
        beforeEach(() => {
            // FIX: Pass required props to QuotesPage component to resolve TypeScript error.
            render(<QuotesPage searchTarget={null} clearSearchTarget={jest.fn()} />);
        });

        test('should render all quotes initially', () => {
            const table = screen.getByRole('table');
            const rows = within(table).getAllByRole('row');
            // header row + 3 data rows
            expect(rows).toHaveLength(4);
            expect(screen.getByText('ORC-2024-001')).toBeInTheDocument();
            expect(screen.getByText('ORC-2024-002')).toBeInTheDocument();
            expect(screen.getByText('ORC-2024-003')).toBeInTheDocument();
        });

        test('should filter quotes by client name', async () => {
            const user = userEvent.setup();
            const clientInput = screen.getByPlaceholderText('Filtrar por Cliente...');
            await user.type(clientInput, 'João da Silva');

            expect(screen.getByText('ORC-2024-001')).toBeInTheDocument();
            expect(screen.queryByText('ORC-2024-002')).not.toBeInTheDocument();
            expect(screen.queryByText('ORC-2024-003')).not.toBeInTheDocument();
        });

        test('should filter quotes by date', async () => {
            const user = userEvent.setup();
            const dateInput = screen.getByLabelText('Filtrar por data');
            await user.clear(dateInput);
            await user.type(dateInput, '2024-07-29');


            expect(screen.queryByText('ORC-2024-001')).not.toBeInTheDocument();
            expect(screen.getByText('ORC-2024-002')).toBeInTheDocument();
            expect(screen.queryByText('ORC-2024-003')).not.toBeInTheDocument();
        });

        test('should filter quotes by status', async () => {
            const user = userEvent.setup();
            const statusSelect = screen.getByLabelText('Filtrar por status');
            await user.selectOptions(statusSelect, 'approved');

            expect(screen.getByText('ORC-2024-001')).toBeInTheDocument();
            expect(screen.queryByText('ORC-2024-002')).not.toBeInTheDocument();
            expect(screen.getByText('ORC-2024-003')).toBeInTheDocument();
        });

        test('should filter quotes by salesperson', async () => {
            const user = userEvent.setup();
            const salespersonSelect = screen.getByLabelText('Filtrar por vendedor');
            await user.selectOptions(salespersonSelect, 'user-2');

            expect(screen.getByText('ORC-2024-001')).toBeInTheDocument();
            expect(screen.getByText('ORC-2024-002')).toBeInTheDocument();
            expect(screen.getByText('ORC-2024-003')).toBeInTheDocument();
        });

        test('should show a message when no quotes match filters', async () => {
            const user = userEvent.setup();
            const clientInput = screen.getByPlaceholderText('Filtrar por Cliente...');
            await user.type(clientInput, 'Cliente Inexistente');

            expect(screen.getByText('Nenhum orçamento encontrado com os filtros aplicados.')).toBeInTheDocument();
        });
    });

    describe('QuoteForm Interactions', () => {
        beforeEach(async () => {
            const user = userEvent.setup();
            // FIX: Pass required props to QuotesPage component to resolve TypeScript error.
            render(<QuotesPage searchTarget={null} clearSearchTarget={jest.fn()} />);
            const newQuoteButton = screen.getByRole('button', { name: /Novo Orçamento/i });
            await user.click(newQuoteButton);
        });

        test('should display the new quote form when "Novo Orçamento" is clicked', () => {
            expect(screen.getByRole('heading', { name: /Novo Orçamento/i })).toBeInTheDocument();
            expect(screen.queryByRole('heading', { name: /Orçamentos/i })).not.toBeInTheDocument();
        });

        test('should add a new material item and update totals', async () => {
            const user = userEvent.setup();

            await user.type(screen.getByPlaceholderText('Nome do Cliente'), 'Cliente de Teste');
            await user.type(screen.getByPlaceholderText('Email do Cliente'), 'teste@teste.com');
            await user.type(screen.getByPlaceholderText('Telefone do Cliente'), '11999999999');

            await user.click(screen.getByRole('button', { name: /Procurar/i }));
            
            // Modal opens, find the material
            const modal = screen.getByRole('dialog', { name: /Catálogo de Materiais/i });
            const materialCard = await within(modal).findByText('Mármore Carrara');
            await user.click(materialCard);
            
            await user.type(screen.getByPlaceholderText('Descrição da peça (Ex: Bancada)'), 'Bancada de Teste');
            await user.type(screen.getByPlaceholderText('Largura (m)'), '2');
            await user.type(screen.getByPlaceholderText('Altura (m)'), '0.8');

            expect(screen.getByText(/Área:/i)).toHaveTextContent('1.600 m²');
            expect(screen.getByText(/Perímetro:/i)).toHaveTextContent('5.60 m');

            await user.click(screen.getByRole('button', { name: 'Adicionar Item' }));

            const itemsTable = screen.getByRole('table');
            expect(within(itemsTable).getByText('Bancada de Teste - Mármore Carrara')).toBeInTheDocument();
            
            expect(screen.getByText('Subtotal:')).toHaveTextContent('R$ 720,00');
            expect(screen.getByText('Total:')).toHaveTextContent('R$ 720,00');
        });

        test('should save the new quote and return to the list view', async () => {
            const user = userEvent.setup();
             
            await user.type(screen.getByPlaceholderText('Nome do Cliente'), 'Cliente Para Salvar');
            await user.type(screen.getByPlaceholderText('Email do Cliente'), 'salvar@teste.com');
            await user.type(screen.getByPlaceholderText('Telefone do Cliente'), '11999999999');
            
            await user.click(screen.getByRole('button', { name: /Procurar/i }));
            const modal = screen.getByRole('dialog', { name: /Catálogo de Materiais/i });
            await user.click(await within(modal).findByText('Mármore Carrara'));
            await user.type(screen.getByPlaceholderText('Descrição da peça (Ex: Bancada)'), 'Item para salvar');
            await user.type(screen.getByPlaceholderText('Largura (m)'), '1');
            await user.type(screen.getByPlaceholderText('Altura (m)'), '1');
            await user.click(screen.getByRole('button', { name: 'Adicionar Item' }));

            const saveButton = screen.getByRole('button', { name: /Salvar e Enviar/i });
            await user.click(saveButton);

            expect(screen.getByRole('heading', { name: /Orçamentos/i })).toBeInTheDocument();

            expect(screen.getByText('Cliente Para Salvar')).toBeInTheDocument();
            expect(screen.getByText(/ORC-2024-007/i)).toBeInTheDocument();
        });
    });
});
