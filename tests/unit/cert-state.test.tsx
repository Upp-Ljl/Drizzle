// @vitest-environment jsdom
/**
 * Unit tests for CertificateCard's state derivation.
 *
 * The derivation is internal to certificate-card.tsx:
 *   settledPayout === null/undefined → 'pending'
 *   settledPayout > 0                → 'gold'
 *   settledPayout === 0              → 'mourn'
 *
 * We test via the public surface — render the component and read `data-state`
 * off the root `[data-testid="cert-card"]` element. This keeps the test wired
 * to real component behavior (including any future refactor) without touching
 * the source file.
 *
 * We do NOT assert on TSPR-BUG-* buggy behavior here.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { CertificateCard } from '../../components/certificate-card';

afterEach(() => {
  cleanup();
});

function renderCert(settledPayout: number | null | undefined) {
  return render(
    <CertificateCard
      certificateId="C-TEST-1"
      title="测试梗"
      firstNAtBet={1234}
      amount={10}
      oddsAtBet={2.5}
      settledPayout={settledPayout}
    />,
  );
}

describe('CertificateCard state derivation', () => {
  it('settledPayout === null → pending', () => {
    const { getByTestId } = renderCert(null);
    expect(getByTestId('cert-card').getAttribute('data-state')).toBe('pending');
  });

  it('settledPayout === undefined → pending', () => {
    const { getByTestId } = renderCert(undefined);
    expect(getByTestId('cert-card').getAttribute('data-state')).toBe('pending');
  });

  it('settledPayout > 0 → gold', () => {
    const { getByTestId } = renderCert(125);
    expect(getByTestId('cert-card').getAttribute('data-state')).toBe('gold');
  });

  it('settledPayout === 0 → mourn', () => {
    const { getByTestId } = renderCert(0);
    expect(getByTestId('cert-card').getAttribute('data-state')).toBe('mourn');
  });

  it('gold state shows payout amount in status line', () => {
    const { getByTestId } = renderCert(140);
    const status = getByTestId('cert-status-line');
    expect(status.textContent).toContain('140');
    expect(status.textContent).toContain('命中');
  });

  it('mourn state shows 未中 0 币', () => {
    const { getByTestId } = renderCert(0);
    const status = getByTestId('cert-status-line');
    expect(status.textContent).toContain('未中');
    expect(status.textContent).toContain('0');
  });

  it('pending state shows 等待 copy', () => {
    const { getByTestId } = renderCert(null);
    const status = getByTestId('cert-status-line');
    expect(status.textContent).toContain('等待');
  });

  it('explicit state prop overrides settledPayout derivation', () => {
    // Render with payout=0 (would derive mourn) but force pending.
    const { getByTestId } = render(
      <CertificateCard
        certificateId="C-OVERRIDE-1"
        title="覆盖测试"
        firstNAtBet={1234}
        amount={10}
        oddsAtBet={2.5}
        settledPayout={0}
        state="pending"
      />,
    );
    expect(getByTestId('cert-card').getAttribute('data-state')).toBe('pending');
  });
});
