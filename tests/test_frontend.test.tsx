import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import Viewport from '../frontend/components/Viewport';

// Mock the components that might use Canvas or WebSockets
vi.mock('../frontend/components/TerminalComponent', () => ({
  default: () => <div>Terminal</div>
}));
vi.mock('../frontend/components/VNCComponent', () => ({
  default: () => <div>VNC</div>
}));
vi.mock('../frontend/components/SerialComponent', () => ({
  default: () => <div>Serial</div>
}));

describe('Viewport Component', () => {
  it('renders terminal for ssh sub-session', () => {
    const session = { id: 's1', name: 'S1', sub_sessions: {} };
    const subSession = { id: 'sub1', params: { type: 'ssh' }, active: true };
    render(<Viewport session={session as any} subSession={subSession as any} />);
  });
});
