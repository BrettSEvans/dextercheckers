import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CheckersGame } from './App.jsx';

function createDataTransfer() {
    const store = {};
    return {
          setData(type, value) {
                  store[type] = value;
          },
          getData(type) {
                  return store[type] ?? '';
          },
          effectAllowed: 'all',
          dropEffect: 'move',
    };
}

describe('CheckersGame', () => {
    it('moves a piece with keyboard controls', async () => {
          const user = userEvent.setup();
          render(<CheckersGame />);

           const square = screen.getByLabelText(/square 17.*red piece/i);
          square.focus();

           await user.keyboard('{Enter}{ArrowRight}{Enter}');

           expect(screen.getByLabelText(/square 26.*red piece/i)).toBeInTheDocument();
          expect(screen.getByText(/black to move/i)).toBeInTheDocument();
    });

           it('supports drag and drop moves', () => {
                 render(<CheckersGame />);

                  const source = screen.getByLabelText(/square 17.*red piece/i);
                 const target = screen.getByLabelText(/^square 24, empty$/i);
                 const dataTransfer = createDataTransfer();

                  fireEvent.dragStart(source, { dataTransfer });
                 fireEvent.dragOver(target, { dataTransfer });
                 fireEvent.drop(target, { dataTransfer });
                 fireEvent.dragEnd(source, { dataTransfer });

                  expect(screen.getByLabelText(/square 24.*red piece/i)).toBeInTheDocument();
           });

           it('plays an automatic black move in single-player mode', async () => {
                 const user = userEvent.setup();
                 render(<CheckersGame />);

                  await user.click(screen.getByRole('button', { name: /play vs ai/i }));
                 await user.click(screen.getByLabelText(/square 17.*red piece/i));
                 await user.click(screen.getByLabelText(/^square 24, empty$/i));

                  await waitFor(() => {
                          expect(screen.getByText(/red to move/i)).toBeInTheDocument();
                  });

                  expect(screen.getByText(/ai mode/i)).toBeInTheDocument();
                 expect(screen.getAllByRole('listitem').length).toBeGreaterThan(1);
           });
});
