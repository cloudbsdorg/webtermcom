import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import Viewport from '../frontend/components/Viewport';

// Mock the components that might use Canvas or WebSockets
vi.mock('../frontend/components/TerminalComponent', () => ({
  default: () => <div>Terminal Mock</div>
}));
vi.mock('../frontend/components/VNCComponent', () => ({
  default: () => <div>VNC Mock</div>
}));
vi.mock('../frontend/components/SerialComponent', () => ({
  default: () => <div>Serial Mock</div>
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('Viewport Component', () => {
  it('renders terminal for ssh sub-session', async () => {
    const session = { id: 's1', name: 'S1', sub_sessions: {} };
    const subSession = { id: 'sub1', params: { type: 'ssh' }, active: true };
    render(<Viewport session={session as any} subSession={subSession as any} />);
    expect(await screen.findByText('Terminal Mock')).toBeTruthy();
  });

  it('renders VNC for vnc sub-session', async () => {
    const session = { id: 's1', name: 'S1', sub_sessions: {} };
    const subSession = { id: 'sub1', params: { type: 'vnc' }, active: true };
    render(<Viewport session={session as any} subSession={subSession as any} />);
    expect(await screen.findByText('VNC Mock')).toBeTruthy();
  });

  it('renders Serial for serial sub-session', async () => {
    const session = { id: 's1', name: 'S1', sub_sessions: {} };
    const subSession = { id: 'sub1', params: { type: 'serial' }, active: true };
    render(<Viewport session={session as any} subSession={subSession as any} />);
    expect(await screen.findByText('Serial Mock')).toBeTruthy();
  });
});
