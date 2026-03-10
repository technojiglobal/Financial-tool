import { useEffect } from 'react';

export default function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmText = 'Delete', confirmColor = 'var(--danger)' }) {
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    if (!open) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease'
        }} onClick={onCancel}>
            <div style={{
                background: '#fff', borderRadius: 20, padding: '28px 32px',
                maxWidth: 420, width: '90%', textAlign: 'center',
                boxShadow: '0 24px 64px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.1)',
                animation: 'slideUp 0.25s ease',
                position: 'relative'
            }} onClick={e => e.stopPropagation()}>
                {/* Icon */}
                <div style={{
                    width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
                    background: 'linear-gradient(135deg, #FEE2E2, #FECACA)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem'
                }}>⚠️</div>

                <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {title || 'Confirm Action'}
                </h3>
                <p style={{ margin: '0 0 24px', fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {message || 'Are you sure? This action cannot be undone.'}
                </p>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button onClick={onCancel} className="btn btn-outline" style={{
                        padding: '10px 24px', borderRadius: 12, fontSize: '0.88rem', fontWeight: 600,
                        minWidth: 100
                    }}>Cancel</button>
                    <button onClick={onConfirm} style={{
                        padding: '10px 24px', borderRadius: 12, fontSize: '0.88rem', fontWeight: 600,
                        background: confirmColor, color: '#fff', border: 'none', cursor: 'pointer',
                        minWidth: 100, transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
}
